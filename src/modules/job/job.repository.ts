import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './entities/job.entity';

@Injectable()
export class JobRepository {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(jobData: Partial<Job>): Promise<JobDocument> {
    const job = new this.jobModel(jobData);
    return job.save();
  }

  async findById(id: string): Promise<JobDocument | null> {
    return this.jobModel
      .findById(id)
      .populate('companyId', 'companyName companyEmail logo')
      .populate('addedBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .exec();
  }

  async findByCompanyId(
    companyId: string,
    filters: any = {},
    pagination: any = {},
  ): Promise<{ jobs: JobDocument[]; total: number }> {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (filters.closed !== undefined) {
      query.closed = filters.closed;
    }

    const total = await this.jobModel.countDocuments(query);
    const sort = pagination.sort || '-createdAt';
    const skip = pagination.skip || 0;
    const limit = pagination.limit || 10;

    const jobs = await this.jobModel
      .find(query)
      .populate('companyId', 'companyName companyEmail logo')
      .populate('addedBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return { jobs, total };
  }

  async findAll(filters: any = {}, pagination: any = {}): Promise<{ jobs: JobDocument[]; total: number }> {
    const query: any = {};

    if (filters.jobTitle) {
      query.jobTitle = { $regex: filters.jobTitle, $options: 'i' };
    }

    if (filters.jobLocation) {
      query.jobLocation = filters.jobLocation;
    }

    if (filters.workingTime) {
      query.workingTime = filters.workingTime;
    }

    if (filters.seniorityLevel) {
      query.seniorityLevel = filters.seniorityLevel;
    }

    if (filters.technicalSkills && filters.technicalSkills.length > 0) {
      query.technicalSkills = {
        $in: filters.technicalSkills.map((skill: string) =>
          new RegExp(skill, 'i'),
        ),
      };
    }

    if (filters.companyId) {
      query.companyId = new Types.ObjectId(filters.companyId);
    }

    if (filters.companyIds && filters.companyIds.length > 0) {
      query.companyId = {
        $in: filters.companyIds.map((id: string) => new Types.ObjectId(id)),
      };
    }

    if (filters.closed !== undefined) {
      query.closed = filters.closed;
    }

    const total = await this.jobModel.countDocuments(query);
    const sort = pagination.sort || '-createdAt';
    const skip = pagination.skip || 0;
    const limit = pagination.limit || 10;

    const jobs = await this.jobModel
      .find(query)
      .populate('companyId', 'companyName companyEmail logo')
      .populate('addedBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return { jobs, total };
  }

  async update(
    id: string,
    updateData: Partial<Job>,
  ): Promise<JobDocument | null> {
    return this.jobModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('companyId', 'companyName companyEmail logo')
      .populate('addedBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.jobModel.findByIdAndDelete(id).exec();
  }

  async count(filters: any = {}): Promise<number> {
    const query: any = {};

    if (filters.companyId) {
      query.companyId = new Types.ObjectId(filters.companyId);
    }

    if (filters.closed !== undefined) {
      query.closed = filters.closed;
    }

    return this.jobModel.countDocuments(query);
  }
}

