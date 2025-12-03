import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CompanyService } from '../company/company.service';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { FilterJobDto } from './dtos/filter-job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HrOrOwnerGuard } from '../../common/guards/hr-or-owner.guard';
import { JobOwnerGuard } from '../../common/guards/job-owner.guard';
import { CompanyHrGuard } from '../../common/guards/company-hr.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly companyService: CompanyService,
  ) {}

  @UseGuards(JwtAuthGuard, HrOrOwnerGuard)
  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @Query('companyId') companyIdFromQuery: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const companyId =
      companyIdFromQuery || (createJobDto as any).companyId;
    if (!companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.jobService.create(createJobDto, companyId, user.userId);
  }

  @Get()
  async findAll(@Query() filterJobDto: FilterJobDto) {
    return this.jobService.findAll(filterJobDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Get('companies/:companyId/jobs')
  async findByCompanyId(
    @Param('companyId') companyId: string,
    @Query() filterJobDto: FilterJobDto,
  ) {
    return this.jobService.findByCompanyId(companyId, filterJobDto);
  }

  @UseGuards(JwtAuthGuard, JobOwnerGuard)
  @Patch(':jobId')
  async update(
    @Param('jobId') jobId: string,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobService.update(jobId, updateJobDto, user.userId);
  }

  @UseGuards(JwtAuthGuard, CompanyHrGuard)
  @Delete(':jobId')
  async remove(@Param('jobId') jobId: string) {
    return this.jobService.remove(jobId);
  }
}
