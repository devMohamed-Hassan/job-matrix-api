import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
} from 'class-validator';
import {
  JobLocation,
  WorkingTime,
  SeniorityLevel,
} from '../entities/job.entity';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  jobTitle: string;

  @IsEnum(JobLocation, {
    message: 'jobLocation must be one of: onsite, remotely, hybrid',
  })
  @IsNotEmpty()
  jobLocation: JobLocation;

  @IsEnum(WorkingTime, {
    message: 'workingTime must be one of: part-time, full-time',
  })
  @IsNotEmpty()
  workingTime: WorkingTime;

  @IsEnum(SeniorityLevel, {
    message:
      'seniorityLevel must be one of: fresh, junior, mid-level, senior, team-lead, cto',
  })
  @IsNotEmpty()
  seniorityLevel: SeniorityLevel;

  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  jobDescription: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  technicalSkills: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  softSkills?: string[];

  @IsBoolean()
  @IsOptional()
  closed?: boolean;
}

