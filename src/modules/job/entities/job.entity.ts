import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  requirements: string[];

  @Prop({ required: true })
  location: string;

  @Prop()
  salary?: string;

  @Prop({ required: true, enum: ['full-time', 'part-time', 'contract', 'internship'] })
  type: string;

  @Prop({ required: true, enum: ['remote', 'on-site', 'hybrid'] })
  workMode: string;

  @Prop({ type: String, ref: 'Company', required: true })
  companyId: string;

  @Prop({ default: 'active', enum: ['active', 'closed', 'draft'] })
  status: string;

  @Prop({ default: 0 })
  applicationCount: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);

