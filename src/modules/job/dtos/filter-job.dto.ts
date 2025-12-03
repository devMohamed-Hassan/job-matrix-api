import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  JobLocation,
  WorkingTime,
  SeniorityLevel,
} from '../entities/job.entity';

export class FilterJobDto {
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsEnum(JobLocation, {
    message: 'jobLocation must be one of: onsite, remotely, hybrid',
  })
  jobLocation?: JobLocation;

  @IsOptional()
  @IsEnum(WorkingTime, {
    message: 'workingTime must be one of: part-time, full-time',
  })
  workingTime?: WorkingTime;

  @IsOptional()
  @IsEnum(SeniorityLevel, {
    message:
      'seniorityLevel must be one of: fresh, junior, mid-level, senior, team-lead, cto',
  })
  seniorityLevel?: SeniorityLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim());
    }
    return value;
  })
  technicalSkills?: string[];

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companyIds?: string[];

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  closed?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string = '-createdAt';
}

