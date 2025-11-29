import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from './job.repository';
import { CreateJobDto } from './dtos/create-job.dto';
import { UpdateJobDto } from './dtos/update-job.dto';
import { JobDocument } from './entities/job.entity';

@Injectable()
export class JobService {
  constructor(private readonly jobRepository: JobRepository) {}

  async create(createJobDto: CreateJobDto, companyId: string): Promise<JobDocument> {
    // TODO: Implement job creation logic
    throw new Error('Method not implemented.');
  }

  async findAll(): Promise<JobDocument[]> {
    return this.jobRepository.findAll();
  }

  async findOne(id: string): Promise<JobDocument> {
    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async findByCompanyId(companyId: string): Promise<JobDocument[]> {
    return this.jobRepository.findByCompanyId(companyId);
  }

  async update(id: string, updateJobDto: UpdateJobDto): Promise<JobDocument> {
    const job = await this.jobRepository.update(id, updateJobDto);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async remove(id: string): Promise<void> {
    await this.jobRepository.delete(id);
  }
}

