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

  async findByIdExcludingDeleted(
    id: string,
  ): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findByEmail(email: string): Promise<CompanyDocument | null> {
    return this.companyModel
      .findOne({ companyEmail: email.toLowerCase(), deletedAt: null })
      .exec();
  }

  async findByName(name: string): Promise<CompanyDocument | null> {
    return this.companyModel
      .findOne({ companyName: name.trim(), deletedAt: null })
      .exec();
  }

  async searchByName(searchTerm: string): Promise<CompanyDocument[]> {
    return this.companyModel
      .find({
        companyName: { $regex: searchTerm, $options: 'i' },
        deletedAt: null,
      })
      .exec();
  }

  async findByIdWithJobs(id: string): Promise<CompanyDocument | null> {
    return this.companyModel
      .findOne({ _id: id, deletedAt: null })
      .populate('jobs')
      .exec();
  }

  async findByOwnerId(ownerId: string): Promise<CompanyDocument[]> {
    return this.companyModel
      .find({ createdBy: ownerId, deletedAt: null })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Company>,
  ): Promise<CompanyDocument | null> {
    return this.companyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<CompanyDocument | null> {
    return this.companyModel
      .findByIdAndUpdate(
        id,
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.companyModel.findByIdAndDelete(id).exec();
  }

  async findAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find({ deletedAt: null }).exec();
  }
}

