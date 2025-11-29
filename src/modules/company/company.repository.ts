import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company, CompanyDocument } from './entities/company.entity';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(companyData: Partial<Company>): Promise<CompanyDocument> {
    const company = new this.companyModel(companyData);
    return company.save();
  }

  async findById(id: string): Promise<CompanyDocument | null> {
    return this.companyModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ email }).exec();
  }

  async findByOwnerId(ownerId: string): Promise<CompanyDocument[]> {
    return this.companyModel.find({ ownerId }).exec();
  }

  async update(
    id: string,
    updateData: Partial<Company>,
  ): Promise<CompanyDocument | null> {
    return this.companyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.companyModel.findByIdAndDelete(id).exec();
  }

  async findAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find().exec();
  }
}

