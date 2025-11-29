import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  requirements: string[];

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsEnum(['full-time', 'part-time', 'contract', 'internship'])
  @IsNotEmpty()
  type: string;

  @IsEnum(['remote', 'on-site', 'hybrid'])
  @IsNotEmpty()
  workMode: string;
}

