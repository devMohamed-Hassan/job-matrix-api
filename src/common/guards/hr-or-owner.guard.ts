import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CompanyRepository } from '../../modules/company/company.repository';
import { JobRepository } from '../../modules/job/job.repository';
import { ApplicationRepository } from '../../modules/application/application.repository';

@Injectable()
export class HrOrOwnerGuard implements CanActivate {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly jobRepository: JobRepository,
    @Optional() private readonly applicationRepository?: ApplicationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const applicationId = request.params.applicationId;
    const jobId = request.params.jobId || request.params.id;
    const companyId =
      request.params.companyId ||
      request.query.companyId ||
      request.body?.companyId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (applicationId && this.applicationRepository) {
      const application = await this.applicationRepository.findById(applicationId);
      if (!application) {
        throw new NotFoundException(`Application with ID ${applicationId} not found`);
      }

      const applicationJobId = 
        application.jobId && typeof application.jobId === 'object' && '_id' in application.jobId
          ? (application.jobId as any)._id.toString()
          : application.jobId.toString();

      const job = await this.jobRepository.findById(applicationJobId);
      if (!job) {
        throw new NotFoundException(`Job not found for this application`);
      }

      const companyIdValue = 
        job.companyId && typeof job.companyId === 'object' && '_id' in job.companyId
          ? (job.companyId as any)._id.toString()
          : job.companyId.toString();

      const company = await this.companyRepository.findByIdExcludingDeleted(
        companyIdValue,
      );

      if (!company) {
        throw new NotFoundException('Company not found for this job');
      }

      return this.checkAccess(user.userId, company);
    }

    if (jobId) {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      const companyIdValue = 
        job.companyId && typeof job.companyId === 'object' && '_id' in job.companyId
          ? (job.companyId as any)._id.toString()
          : job.companyId.toString();

      const company = await this.companyRepository.findByIdExcludingDeleted(
        companyIdValue,
      );

      if (!company) {
        throw new NotFoundException('Company not found for this job');
      }

      return this.checkAccess(user.userId, company);
    }

    if (companyId) {
      const company = await this.companyRepository.findByIdExcludingDeleted(
        companyId,
      );

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      return this.checkAccess(user.userId, company);
    }

    throw new NotFoundException('Company ID or Job ID is required');
  }

  private checkAccess(userId: string, company: any): boolean {
    const ownerId = company.createdBy?.toString() || company.createdBy;

    if (ownerId === userId) {
      return true;
    }

    const hrIds = company.HRs?.map((hr: any) => hr?.toString() || hr) || [];
    if (hrIds.includes(userId)) {
      return true;
    }

    throw new ForbiddenException(
      'Only company HR or owner can perform this action',
    );
  }
}

