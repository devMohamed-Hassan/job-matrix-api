import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, deletedAt: null }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email, deletedAt: null }).select('+password +refreshTokenHash').exec();
  }

  async findByIdWithRefreshToken(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+refreshTokenHash').exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}

