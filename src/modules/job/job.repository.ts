import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from './entities/job.entity';

@Injectable()
export class JobRepository {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(jobData: Partial<Job>): Promise<JobDocument> {
    const job = new this.jobModel(jobData);
    return job.save();
  }

  async findById(id: string): Promise<JobDocument | null> {
    return this.jobModel.findById(id).populate('companyId').exec();
  }

  async findByCompanyId(companyId: string): Promise<JobDocument[]> {
    return this.jobModel.find({ companyId }).exec();
  }

  async findAll(): Promise<JobDocument[]> {
    return this.jobModel.find().populate('companyId').exec();
  }

  async update(id: string, updateData: Partial<Job>): Promise<JobDocument | null> {
    return this.jobModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.jobModel.findByIdAndDelete(id).exec();
  }
}

