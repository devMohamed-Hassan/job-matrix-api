import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsEnum(['full-time', 'part-time', 'contract', 'internship'])
  @IsOptional()
  type?: string;

  @IsEnum(['remote', 'on-site', 'hybrid'])
  @IsOptional()
  workMode?: string;

  @IsEnum(['active', 'closed', 'draft'])
  @IsOptional()
  status?: string;
}

