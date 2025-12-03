import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobRepository } from './job.repository';
import { CompanyRepository } from '../company/company.repository';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { FilterJobDto } from './dtos/filter-job.dto';
import { JobDocument } from './entities/job.entity';
import {
  PaginationResult,
  calculatePagination,
} from '../../common/utils/pagination.util';
import { Types } from 'mongoose';

@Injectable()
export class JobService {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    companyId: string,
    userId: string,
  ): Promise<JobDocument> {
    const company = await this.companyRepository.findByIdExcludingDeleted(
      companyId,
    );
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const jobData = {
      ...createJobDto,
      companyId: new Types.ObjectId(companyId),
      addedBy: new Types.ObjectId(userId),
      updatedBy: null,
    };

    return this.jobRepository.create(jobData);
  }

  async findAll(
    filterJobDto: FilterJobDto,
  ): Promise<PaginationResult<JobDocument>> {
    const { companyName, ...filters } = filterJobDto;

    const pagination = {
      skip: filterJobDto.skip || 0,
      limit: filterJobDto.limit || 10,
      sort: filterJobDto.sort || '-createdAt',
    };

    let processedFilters = { ...filters };
    if (companyName && !filters.companyId) {
      const companies = await this.companyRepository.searchByName(companyName);
      if (companies.length > 0) {
        processedFilters.companyIds = companies.map((c) => c._id.toString());
      } else {
        return {
          data: [],
          total: 0,
          page: 1,
          limit: pagination.limit,
          totalPages: 0,
        };
      }
    }

    const { jobs, total } = await this.jobRepository.findAll(
      processedFilters,
      pagination,
    );

    const paginationMeta = calculatePagination(
      total,
      pagination.skip,
      pagination.limit,
    );

    return {
      data: jobs,
      ...paginationMeta,
    };
  }

  async findOne(id: string): Promise<JobDocument> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async findByCompanyId(
    companyId: string,
    filterJobDto: FilterJobDto,
  ): Promise<PaginationResult<JobDocument>> {
    const company = await this.companyRepository.findByIdExcludingDeleted(
      companyId,
    );
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    const filters: any = {
      closed: filterJobDto.closed,
    };

    const pagination = {
      skip: filterJobDto.skip || 0,
      limit: filterJobDto.limit || 10,
      sort: filterJobDto.sort || '-createdAt',
    };

    const { jobs, total } = await this.jobRepository.findByCompanyId(
      companyId,
      filters,
      pagination,
    );

    const paginationMeta = calculatePagination(
      total,
      pagination.skip,
      pagination.limit,
    );

    return {
      data: jobs,
      ...paginationMeta,
    };
  }

  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    userId: string,
  ): Promise<JobDocument> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const updateData = {
      ...updateJobDto,
      updatedBy: new Types.ObjectId(userId),
    };

    const updatedJob = await this.jobRepository.update(id, updateData);
    if (!updatedJob) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return updatedJob;
  }

  async remove(id: string): Promise<void> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    await this.jobRepository.delete(id);
  }
}

