import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AdminService } from "../admin.service";
import { GraphQLJwtAuthGuard } from "../../../common/guards/graphql-jwt-auth.guard";
import { GraphQLAdminGuard } from "../../../common/guards/graphql-admin.guard";
import {
  AllDataResponse,
  BanUserResponse,
  BanCompanyResponse,
  ApproveCompanyResponse,
  UserType,
  CompanyType,
} from "./admin.graphql.types";
import { CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Resolver(() => AllDataResponse)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @ResolveField(() => [UserType])
  users(@Parent() parent: AllDataResponse): UserType[] {
    if (Array.isArray(parent?.users)) {
      return parent.users;
    }
    console.error(
      "[Resolver] Field resolver: users is not an array, returning empty array"
    );
    return [];
  }

  @ResolveField(() => [CompanyType])
  companies(@Parent() parent: AllDataResponse): CompanyType[] {
    if (Array.isArray(parent?.companies)) {
      return parent.companies;
    }
    console.error(
      "[Resolver] Field resolver: companies is not an array, returning empty array"
    );
    return [];
  }

  @Query(() => AllDataResponse, { name: "getAllData" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async getAllData(): Promise<AllDataResponse> {
    console.log("[Resolver] getAllData called");
    let result: AllDataResponse | null = null;

    try {
      result = await this.adminService.getAllData();
      console.log(
        "[Resolver] Service returned:",
        result ? "result exists" : "result is null"
      );

      if (!result) {
        console.error("[Resolver] CRITICAL: Service returned null/undefined");
        return { users: [], companies: [] };
      }

      let users: any[] = [];
      let companies: any[] = [];

      if (Array.isArray(result.users)) {
        users = [...result.users];
      } else {
        console.error(
          "[Resolver] CRITICAL: result.users is not an array:",
          typeof result.users,
          result.users
        );
        users = [];
      }

      if (Array.isArray(result.companies)) {
        companies = [...result.companies];
      } else {
        console.error(
          "[Resolver] CRITICAL: result.companies is not an array:",
          typeof result.companies,
          result.companies
        );
        companies = [];
      }

      if (users === null || users === undefined) {
        console.error(
          "[Resolver] CRITICAL: users is null/undefined after processing"
        );
        users = [];
      }
      if (companies === null || companies === undefined) {
        console.error(
          "[Resolver] CRITICAL: companies is null/undefined after processing"
        );
        companies = [];
      }

      const finalResult: AllDataResponse = {
        users: users,
        companies: companies,
      };

      console.log(
        "[Resolver] Returning final result with",
        finalResult.users.length,
        "users and",
        finalResult.companies.length,
        "companies"
      );
      console.log(
        "[Resolver] Final validation - users is array:",
        Array.isArray(finalResult.users),
        "companies is array:",
        Array.isArray(finalResult.companies)
      );

      return finalResult;
    } catch (error) {
      console.error("[Resolver] Error caught in getAllData resolver:", error);
      console.error(
        "[Resolver] Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      return {
        users: [],
        companies: [],
      };
    }
  }

  @Mutation(() => BanUserResponse, { name: "banUser" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async banUser(
    @Args("userId") userId: string,
    @Context() context: any
  ): Promise<BanUserResponse> {
    const user = context.req.user as CurrentUserPayload;
    return this.adminService.banUser(userId, user.userId);
  }

  @Mutation(() => BanUserResponse, { name: "unbanUser" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async unbanUser(
    @Args("userId") userId: string,
    @Context() context: any
  ): Promise<BanUserResponse> {
    const user = context.req.user as CurrentUserPayload;
    return this.adminService.unbanUser(userId, user.userId);
  }

  @Mutation(() => BanCompanyResponse, { name: "banCompany" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async banCompany(
    @Args("companyId") companyId: string,
    @Context() context: any
  ): Promise<BanCompanyResponse> {
    const user = context.req.user as CurrentUserPayload;
    return this.adminService.banCompany(companyId, user.userId);
  }

  @Mutation(() => BanCompanyResponse, { name: "unbanCompany" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async unbanCompany(
    @Args("companyId") companyId: string,
    @Context() context: any
  ): Promise<BanCompanyResponse> {
    const user = context.req.user as CurrentUserPayload;
    return this.adminService.unbanCompany(companyId, user.userId);
  }

  @Mutation(() => ApproveCompanyResponse, { name: "approveCompany" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async approveCompany(
    @Args("companyId") companyId: string,
    @Context() context: any
  ): Promise<ApproveCompanyResponse> {
    const user = context.req.user as CurrentUserPayload;
    return this.adminService.approveCompany(companyId, user.userId);
  }
}
