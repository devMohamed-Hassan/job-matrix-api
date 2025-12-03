import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CompanyRepository } from '../../modules/company/company.repository';
import { JobRepository } from '../../modules/job/job.repository';

@Injectable()
export class JobOwnerGuard implements CanActivate {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const jobId = request.params.jobId || request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!jobId) {
      throw new NotFoundException('Job ID is required');
    }

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

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== user.userId) {
      throw new ForbiddenException(
        'Only the company owner who created this job can perform this action',
      );
    }

    return true;
  }
}

