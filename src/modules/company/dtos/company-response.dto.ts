import { Types } from 'mongoose';
import { ImageData } from '../entities/company.entity';

export class CompanyResponseDto {
  _id: Types.ObjectId;
  companyName: string;
  description: string;
  industry: string;
  address: string;
  numberOfEmployees: string;
  companyEmail: string;
  createdBy: Types.ObjectId;
  logo: ImageData | null;
  coverPic: ImageData | null;
  HRs: Types.ObjectId[];
  bannedAt: Date | null;
  deletedAt: Date | null;
  legalAttachment: ImageData | null;
  approvedByAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  jobs?: any[];
}

