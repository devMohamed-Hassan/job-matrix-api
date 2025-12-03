import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, MinLength } from 'class-validator';
import {
  JobLocation,
  WorkingTime,
  SeniorityLevel,
} from '../entities/job.entity';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  jobTitle?: string;

  @IsEnum(JobLocation, {
    message: 'jobLocation must be one of: onsite, remotely, hybrid',
  })
  @IsOptional()
  jobLocation?: JobLocation;

  @IsEnum(WorkingTime, {
    message: 'workingTime must be one of: part-time, full-time',
  })
  @IsOptional()
  workingTime?: WorkingTime;

  @IsEnum(SeniorityLevel, {
    message:
      'seniorityLevel must be one of: fresh, junior, mid-level, senior, team-lead, cto',
  })
  @IsOptional()
  seniorityLevel?: SeniorityLevel;

  @IsString()
  @IsOptional()
  @MinLength(50)
  jobDescription?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  technicalSkills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  softSkills?: string[];

  @IsBoolean()
  @IsOptional()
  closed?: boolean;
}

