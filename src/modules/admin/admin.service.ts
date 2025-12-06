import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserRepository } from "../user/user.repository";
import { CompanyRepository } from "../company/company.repository";
import {
  AllDataResponse,
  BanUserResponse,
  BanCompanyResponse,
  ApproveCompanyResponse,
  UserType,
  CompanyType,
  ImageDataType,
} from "./graphql/admin.graphql.types";

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  private mapImageData(image: any): ImageDataType | null {
    if (!image) return null;
    return {
      secure_url: image.secure_url,
      public_id: image.public_id,
    };
  }

  private serializeDate(date: any): Date | null {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  }

  private mapUserToType(userObj: any): UserType {
    return {
      _id: userObj._id.toString(),
      firstName: userObj.firstName,
      lastName: userObj.lastName,
      email: userObj.email,
      provider: userObj.provider,
      gender: userObj.gender || null,
      DOB: userObj.DOB ? this.serializeDate(userObj.DOB) : null,
      mobileNumber: userObj.mobileNumber || null,
      role: userObj.role,
      emailConfirmed: userObj.emailConfirmed,
      deletedAt: userObj.deletedAt
        ? this.serializeDate(userObj.deletedAt)
        : null,
      bannedAt: userObj.bannedAt ? this.serializeDate(userObj.bannedAt) : null,
      profilePic: this.mapImageData(userObj.profilePic),
      coverPic: this.mapImageData(userObj.coverPic),
      createdAt: this.serializeDate(userObj.createdAt),
      updatedAt: this.serializeDate(userObj.updatedAt),
    };
  }

  private mapCompanyToType(companyObj: any): CompanyType {
    return {
      _id: companyObj._id.toString(),
      companyName: companyObj.companyName,
      description: companyObj.description,
      industry: companyObj.industry,
      address: companyObj.address,
      numberOfEmployees: companyObj.numberOfEmployees,
      companyEmail: companyObj.companyEmail,
      createdBy: companyObj.createdBy.toString(),
      logo: this.mapImageData(companyObj.logo),
      coverPic: this.mapImageData(companyObj.coverPic),
      HRs: companyObj.HRs.map((hr: any) => hr.toString()),
      bannedAt: companyObj.bannedAt
        ? this.serializeDate(companyObj.bannedAt)
        : null,
      deletedAt: companyObj.deletedAt
        ? this.serializeDate(companyObj.deletedAt)
        : null,
      legalAttachment: this.mapImageData(companyObj.legalAttachment),
      approvedByAdmin: companyObj.approvedByAdmin,
      createdAt: this.serializeDate(companyObj.createdAt),
      updatedAt: this.serializeDate(companyObj.updatedAt),
    };
  }

  async getAllData(): Promise<AllDataResponse> {
    const users = await this.userRepository.findAllIncludingDeleted();
    const companies = await this.companyRepository.findAllIncludingDeleted();

    const transformedUsers: UserType[] = users.map((user) => {
      const userObj = user.toObject();
      return this.mapUserToType(userObj);
    });

    const transformedCompanies: CompanyType[] = companies.map((company) => {
      const companyObj = company.toObject();
      return this.mapCompanyToType(companyObj);
    });

    return {
      users: transformedUsers,
      companies: transformedCompanies,
    };
  }

  async banUser(userId: string, adminId: string): Promise<BanUserResponse> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.bannedAt) {
      throw new BadRequestException("User is already banned");
    }

    const updatedUser = await this.userRepository.update(userId, {
      bannedAt: new Date(),
      updatedBy: adminId as any,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userObj = updatedUser.toObject();
    const mappedUser: UserType = this.mapUserToType(userObj);

    return {
      user: mappedUser,
      message: "User has been banned successfully",
    };
  }

  async unbanUser(userId: string, adminId: string): Promise<BanUserResponse> {
    const user = await this.userRepository.findByIdExcludingDeleted(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.bannedAt) {
      throw new BadRequestException("User is not banned");
    }

    const updatedUser = await this.userRepository.update(userId, {
      bannedAt: null,
      updatedBy: adminId as any,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const userObj = updatedUser.toObject();
    const mappedUser: UserType = this.mapUserToType(userObj);

    return {
      user: mappedUser,
      message: "User has been unbanned successfully",
    };
  }

  async banCompany(
    companyId: string,
    adminId: string
  ): Promise<BanCompanyResponse> {
    const company =
      await this.companyRepository.findByIdExcludingDeleted(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    if (company.bannedAt) {
      throw new BadRequestException("Company is already banned");
    }

    const updatedCompany = await this.companyRepository.update(companyId, {
      bannedAt: new Date(),
    });

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const companyObj = updatedCompany.toObject();
    const mappedCompany: CompanyType = this.mapCompanyToType(companyObj);

    return {
      company: mappedCompany,
      message: "Company has been banned successfully",
    };
  }

  async unbanCompany(
    companyId: string,
    adminId: string
  ): Promise<BanCompanyResponse> {
    const company =
      await this.companyRepository.findByIdExcludingDeleted(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    if (!company.bannedAt) {
      throw new BadRequestException("Company is not banned");
    }

    const updatedCompany = await this.companyRepository.update(companyId, {
      bannedAt: null,
    });

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const companyObj = updatedCompany.toObject();
    const mappedCompany: CompanyType = this.mapCompanyToType(companyObj);

    return {
      company: mappedCompany,
      message: "Company has been unbanned successfully",
    };
  }

  async approveCompany(
    companyId: string,
    adminId: string
  ): Promise<ApproveCompanyResponse> {
    const company =
      await this.companyRepository.findByIdExcludingDeleted(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    if (company.approvedByAdmin) {
      throw new BadRequestException("Company is already approved");
    }

    const updatedCompany = await this.companyRepository.update(companyId, {
      approvedByAdmin: true,
    });

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const companyObj = updatedCompany.toObject();
    const mappedCompany: CompanyType = this.mapCompanyToType(companyObj);

    return {
      company: mappedCompany,
      message: "Company has been approved successfully",
    };
  }
}
