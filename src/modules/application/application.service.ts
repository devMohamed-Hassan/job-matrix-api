import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ApplicationRepository } from "./application.repository";
import { JobRepository } from "../job/job.repository";
import { CompanyRepository } from "../company/company.repository";
import { UserRepository } from "../user/user.repository";
import { S3Service } from "../../common/services/s3.service";
import { EmailService } from "../email/email.service";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { ApplicationDocument, ApplicationStatus } from "./entities/application.entity";
import { UpdateApplicationStatusDto } from "./dtos/update-application-status.dto";
import {
  PaginationResult,
  calculatePagination,
} from "../../common/utils/pagination.util";
import { Types } from "mongoose";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly jobRepository: JobRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async applyToJob(
    jobId: string,
    userId: string,
    cvFile: Express.Multer.File,
  ): Promise<ApplicationDocument> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.closed) {
      throw new BadRequestException("Cannot apply to a closed job");
    }

    const existingApplication =
      await this.applicationRepository.findByUserIdAndJobId(userId, jobId);
    if (existingApplication) {
      throw new ConflictException(
        "You have already applied to this job",
      );
    }

    const cvUploadResult = await this.s3Service.uploadCV(
      cvFile,
      `cv/${jobId}`,
    );

    const applicationData = {
      jobId: new Types.ObjectId(jobId),
      userId: new Types.ObjectId(userId),
      userCV: {
        secure_url: cvUploadResult.secure_url,
        public_id: cvUploadResult.public_id,
      },
      status: ApplicationStatus.PENDING,
    };

    const application = await this.applicationRepository.create(applicationData);

    const populatedApplication = await this.applicationRepository.findById(
      application._id.toString(),
    );

    const companyId = job.companyId.toString();

    if (populatedApplication) {
      const populatedUserId = populatedApplication.userId as any;
      const applicationDoc = populatedApplication as any;
      
      this.notificationsGateway.emitNewApplication(companyId, {
        applicationId: populatedApplication._id.toString(),
        jobId: jobId,
        jobTitle: job.jobTitle,
        applicant: {
          userId: populatedUserId._id?.toString() || populatedUserId.toString(),
          name: `${populatedUserId.firstName} ${populatedUserId.lastName}`,
          email: populatedUserId.email,
        },
        appliedAt: applicationDoc.createdAt || new Date(),
      });
    }

    return populatedApplication!;
  }

  async getApplicationsForJob(
    jobId: string,
    filters: any = {},
    pagination: any = {},
  ): Promise<PaginationResult<ApplicationDocument>> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const { applications, total } =
      await this.applicationRepository.findByJobId(jobId, filters, pagination);

    const paginationMeta = calculatePagination(
      total,
      pagination.skip || 0,
      pagination.limit || 10,
    );

    return {
      data: applications,
      ...paginationMeta,
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    updateStatusDto: UpdateApplicationStatusDto,
  ): Promise<ApplicationDocument> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`,
      );
    }

    const updatedApplication = await this.applicationRepository.update(
      applicationId,
      { status: updateStatusDto.status },
    );

    if (!updatedApplication) {
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`,
      );
    }

    if (
      updateStatusDto.status === ApplicationStatus.ACCEPTED ||
      updateStatusDto.status === ApplicationStatus.REJECTED
    ) {
      const applicant = updatedApplication.userId as any;
      const job = updatedApplication.jobId as any;
      const companyId = job.companyId?.toString() || job.companyId;
      
      const company = await this.companyRepository.findByIdExcludingDeleted(
        companyId,
      );

      if (applicant && applicant.email && job && company) {
        try {
          await this.emailService.sendApplicationStatusEmail({
            to: applicant.email,
            applicantName: `${applicant.firstName} ${applicant.lastName}`,
            jobTitle: job.jobTitle || 'the position',
            companyName: company.companyName,
            status:
              updateStatusDto.status === ApplicationStatus.ACCEPTED
                ? 'accepted'
                : 'rejected',
          });
        } catch (error) {
          console.error('Failed to send application status email:', error);
        }
      }
    }

    return updatedApplication;
  }
}
