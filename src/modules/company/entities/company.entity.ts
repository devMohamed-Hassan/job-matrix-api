import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

export interface ImageData {
  secure_url: string;
  public_id: string;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Company {
  @Prop({ required: true, unique: true, trim: true, index: true })
  companyName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  address: string;

  @Prop({
    required: true,
    enum: ['11-20', '21-50', '51-100', '101-500', '500+'],
  })
  numberOfEmployees: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  })
  companyEmail: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({
    type: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    default: null,
  })
  logo: ImageData | null;

  @Prop({
    type: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    default: null,
  })
  coverPic: ImageData | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  HRs: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  bannedAt: Date | null;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({
    type: {
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    default: null,
  })
  legalAttachment: ImageData | null;

  @Prop({ default: false })
  approvedByAdmin: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
});

