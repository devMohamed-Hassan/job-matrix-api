import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApplicationService } from "./application.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UserRoleGuard } from "../../common/guards/user-role.guard";
import { HrOrOwnerGuard } from "../../common/guards/hr-or-owner.guard";
import { UpdateApplicationStatusDto } from "./dtos/update-application-status.dto";
import {
  CurrentUser,
  CurrentUserPayload,
} from "../../common/decorators/current-user.decorator";
import { FilterJobDto } from "../job/dtos/filter-job.dto";

@Controller()
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @UseGuards(JwtAuthGuard, UserRoleGuard)
  @Post("jobs/:jobId/apply")
  @UseInterceptors(FileInterceptor("cv"))
  async applyToJob(
    @Param("jobId") jobId: string,
    @UploadedFile() cvFile: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!cvFile) {
      throw new BadRequestException("CV file is required");
    }
    return this.applicationService.applyToJob(jobId, user.userId, cvFile);
  }

  @UseGuards(JwtAuthGuard, HrOrOwnerGuard)
  @Get("jobs/:jobId/applications")
  async getApplicationsForJob(
    @Param("jobId") jobId: string,
    @Query() filterDto: FilterJobDto,
  ) {
    const filters: any = {};
    if (filterDto.closed !== undefined) {
      filters.closed = filterDto.closed;
    }

    const pagination = {
      skip: filterDto.skip || 0,
      limit: filterDto.limit || 10,
      sort: filterDto.sort || "-createdAt",
    };

    return this.applicationService.getApplicationsForJob(jobId, filters, pagination);
  }

  @UseGuards(JwtAuthGuard, HrOrOwnerGuard)
  @Patch("applications/:applicationId")
  async updateApplicationStatus(
    @Param("applicationId") applicationId: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationService.updateApplicationStatus(
      applicationId,
      updateStatusDto,
    );
  }
}
