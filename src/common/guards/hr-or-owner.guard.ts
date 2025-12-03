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
export class HrOrOwnerGuard implements CanActivate {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly jobRepository: JobRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const jobId = request.params.jobId || request.params.id;
    const companyId =
      request.params.companyId ||
      request.query.companyId ||
      request.body?.companyId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (jobId) {
      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      const company = await this.companyRepository.findByIdExcludingDeleted(
        job.companyId.toString(),
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

