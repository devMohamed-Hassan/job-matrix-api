import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { UserRepository } from "../user/user.repository";
import { CompanyRepository } from "../company/company.repository";
import { UserDocument } from "../user/entities/user.entity";
import { CompanyDocument } from "../company/entities/company.entity";
import {
  AllDataResponse,
  BanUserResponse,
  BanCompanyResponse,
  ApproveCompanyResponse,
} from "./graphql/admin.graphql.types";

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository
  ) {}

  async getAllData(): Promise<AllDataResponse> {
    try {
      console.log("[getAllData] Starting data fetch...");

      let users = await this.userRepository.findAllIncludingDeleted();
      users = await Promise.resolve(users);
      if (!Array.isArray(users)) {
        console.warn(
          "[getAllData] users is not an array after await, converting:",
          typeof users,
          users
        );
        users = users == null ? [] : [users];
      }
      console.log(
        "[getAllData] Users fetched:",
        Array.isArray(users) ? users.length : "NOT AN ARRAY",
        typeof users
      );

      let companies = await this.companyRepository.findAllIncludingDeleted();
      companies = await Promise.resolve(companies);
      if (!Array.isArray(companies)) {
        console.warn(
          "[getAllData] companies is not an array after await, converting:",
          typeof companies,
          companies
        );
        companies = companies == null ? [] : [companies];
      }
      console.log(
        "[getAllData] Companies fetched:",
        Array.isArray(companies) ? companies.length : "NOT AN ARRAY",
        typeof companies
      );

      let transformedUsers: any[] = [];
      if (Array.isArray(users)) {
        transformedUsers = users
          .filter((user) => user != null)
          .map((user) => {
            try {
              const userObj = user.toObject();
              delete userObj.password;
              delete userObj.refreshTokenHash;
              delete userObj.otp;
              return userObj;
            } catch (error) {
              console.error("Error transforming user:", error);
              return null;
            }
          })
          .filter((user) => user != null);
      } else {
        console.warn(
          "[getAllData] users is not an array:",
          typeof users,
          users
        );
        transformedUsers = [];
      }

      let transformedCompanies: any[] = [];
      if (Array.isArray(companies)) {
        transformedCompanies = companies
          .filter((company) => company != null)
          .map((company) => {
            try {
              return company.toObject ? company.toObject() : company;
            } catch (error) {
              console.error("Error transforming company:", error);
              return null;
            }
          })
          .filter((company) => company != null);
      } else {
        console.warn(
          "[getAllData] companies is not an array:",
          typeof companies,
          companies
        );
        transformedCompanies = [];
      }

      const finalUsers = Array.isArray(transformedUsers)
        ? [...transformedUsers]
        : [];
      const finalCompanies = Array.isArray(transformedCompanies)
        ? [...transformedCompanies]
        : [];

      if (finalUsers === null || finalUsers === undefined) {
        console.error("[getAllData] CRITICAL: finalUsers is null/undefined");
        throw new Error("finalUsers cannot be null");
      }
      if (finalCompanies === null || finalCompanies === undefined) {
        console.error(
          "[getAllData] CRITICAL: finalCompanies is null/undefined"
        );
        throw new Error("finalCompanies cannot be null");
      }

      const result: AllDataResponse = {
        users: finalUsers as any,
        companies: finalCompanies as any,
      };

      console.log(
        "[getAllData] Returning result with",
        result.users.length,
        "users and",
        result.companies.length,
        "companies"
      );
      console.log(
        "[getAllData] Result type check - users is array:",
        Array.isArray(result.users),
        "companies is array:",
        Array.isArray(result.companies)
      );

      return result;
    } catch (error) {
      console.error("[getAllData] Error caught:", error);
      console.error(
        "[getAllData] Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      return {
        users: [],
        companies: [],
      };
    }
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
    delete userObj.password;
    delete userObj.refreshTokenHash;
    delete userObj.otp;

    return {
      user: userObj as any,
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
    delete userObj.password;
    delete userObj.refreshTokenHash;
    delete userObj.otp;

    return {
      user: userObj as any,
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

    return {
      company: updatedCompany as any,
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

    return {
      company: updatedCompany as any,
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

    return {
      company: updatedCompany as any,
      message: "Company has been approved successfully",
    };
  }
}
