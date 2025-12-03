import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../modules/user/entities/user.entity';
import { CompanyRepository } from '../../modules/company/company.repository';

@Injectable()
export class AdminOrOwnerGuard implements CanActivate {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    if (!companyId) {
      throw new NotFoundException('Company ID is required');
    }

    const company = await this.companyRepository.findByIdExcludingDeleted(
      companyId,
    );

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== user.userId) {
      throw new ForbiddenException(
        'Only admin or company owner can perform this action',
      );
    }

    return true;
  }
}

