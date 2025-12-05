import { Resolver, Query, Mutation, Args, Context } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { AdminService } from "../admin.service";
import { GraphQLJwtAuthGuard } from "../../../common/guards/graphql-jwt-auth.guard";
import { GraphQLAdminGuard } from "../../../common/guards/graphql-admin.guard";
import {
  AllDataResponse,
  BanUserResponse,
  BanCompanyResponse,
  ApproveCompanyResponse,
} from "./admin.graphql.types";
import { CurrentUserPayload } from "../../../common/decorators/current-user.decorator";

@Resolver(() => AllDataResponse)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => AllDataResponse, { name: "getAllData" })
  @UseGuards(GraphQLJwtAuthGuard, GraphQLAdminGuard)
  async getAllData(): Promise<AllDataResponse> {
    return this.adminService.getAllData();
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
