import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Application,
  ApplicationDocument,
  ApplicationStatus,
} from "./entities/application.entity";

@Injectable()
export class ApplicationRepository {
  constructor(
    @InjectModel(Application.name)
    private applicationModel: Model<ApplicationDocument>
  ) {}

  async create(applicationData: Partial<Application>): Promise<ApplicationDocument> {
    const application = new this.applicationModel(applicationData);
    return application.save();
  }

  async findById(id: string): Promise<ApplicationDocument | null> {
    return this.applicationModel
      .findById(id)
      .populate({
        path: 'jobId',
        populate: {
          path: 'companyId',
          select: 'companyName companyEmail logo',
        },
      })
      .populate('userId', 'firstName lastName email profilePic')
      .exec();
  }

  async findByJobId(
    jobId: string,
    filters: any = {},
    pagination: any = {},
  ): Promise<{ applications: ApplicationDocument[]; total: number }> {
    const query: any = { jobId: new Types.ObjectId(jobId) };

    if (filters.status) {
      query.status = filters.status;
    }

    const total = await this.applicationModel.countDocuments(query);
    const sort = pagination.sort || '-createdAt';
    const skip = pagination.skip || 0;
    const limit = pagination.limit || 10;

    const applications = await this.applicationModel
      .find(query)
      .populate({
        path: 'jobId',
        select: 'jobTitle companyId',
        populate: {
          path: 'companyId',
          select: 'companyName companyEmail logo',
        },
      })
      .populate('userId', 'firstName lastName email profilePic')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return { applications, total };
  }

  async findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<ApplicationDocument | null> {
    return this.applicationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        jobId: new Types.ObjectId(jobId),
      })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Application>,
  ): Promise<ApplicationDocument | null> {
    return this.applicationModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate({
        path: 'jobId',
        populate: {
          path: 'companyId',
          select: 'companyName companyEmail logo',
        },
      })
      .populate('userId', 'firstName lastName email profilePic')
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.applicationModel.findByIdAndDelete(id).exec();
  }
}
