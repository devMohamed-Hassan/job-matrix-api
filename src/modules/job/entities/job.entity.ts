import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

export enum JobLocation {
  ONSITE = 'onsite',
  REMOTELY = 'remotely',
  HYBRID = 'hybrid',
}

export enum WorkingTime {
  PART_TIME = 'part-time',
  FULL_TIME = 'full-time',
}

export enum SeniorityLevel {
  FRESH = 'fresh',
  JUNIOR = 'junior',
  MID_LEVEL = 'mid-level',
  SENIOR = 'senior',
  TEAM_LEAD = 'team-lead',
  CTO = 'cto',
}

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, trim: true, index: true })
  jobTitle: string;

  @Prop({
    required: true,
    enum: JobLocation,
    index: true,
  })
  jobLocation: JobLocation;

  @Prop({
    required: true,
    enum: WorkingTime,
    index: true,
  })
  workingTime: WorkingTime;

  @Prop({
    required: true,
    enum: SeniorityLevel,
    index: true,
  })
  seniorityLevel: SeniorityLevel;

  @Prop({ required: true })
  jobDescription: string;

  @Prop({ type: [String], default: [] })
  technicalSkills: string[];

  @Prop({ type: [String], default: [] })
  softSkills: string[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  addedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;

  @Prop({ default: false, index: true })
  closed: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;
}

export const JobSchema = SchemaFactory.createForClass(Job);

JobSchema.index({ companyId: 1, closed: 1 });
JobSchema.index({ jobLocation: 1, workingTime: 1, seniorityLevel: 1 });
JobSchema.index({ jobTitle: 'text', jobDescription: 'text' });

