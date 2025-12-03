import { Injectable } from '@nestjs/common';
import { CompanyRepository } from '../../company/company.repository';
import { UserRepository } from '../../user/user.repository';
import { Types } from 'mongoose';

@Injectable()
export class ChatAuthorizationUtil {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async isHrOrOwner(userId: string, companyId: string): Promise<boolean> {
    const company = await this.companyRepository.findByIdExcludingDeleted(companyId);
    if (!company) {
      return false;
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId === userId) {
      return true;
    }

    const hrIds = company.HRs?.map((hr: any) => hr?.toString() || hr) || [];
    return hrIds.includes(userId);
  }

  async canAccessConversation(
    userId: string,
    conversationId: string,
    conversationCompanyId: string,
  ): Promise<boolean> {
    return this.isHrOrOwner(userId, conversationCompanyId);
  }

  async getUserCompanyId(userId: string): Promise<string | null> {
    const companiesByOwner = await this.companyRepository.findByOwnerId(userId);
    if (companiesByOwner.length > 0) {
      return companiesByOwner[0]._id.toString();
    }

    const allCompanies = await this.companyRepository.findAll();
    for (const company of allCompanies) {
      const hrIds = company.HRs?.map((hr: any) => {
        if (hr && typeof hr === 'object' && '_id' in hr) {
          return hr._id.toString();
        }
        return hr?.toString() || hr;
      }) || [];
      if (hrIds.includes(userId)) {
        return company._id.toString();
      }
    }
    return null;
  }
}

