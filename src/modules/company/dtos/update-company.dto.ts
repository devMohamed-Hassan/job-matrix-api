import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  companyName?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['11-20', '21-50', '51-100', '101-500', '500+'], {
    message: 'numberOfEmployees must be one of: 11-20, 21-50, 51-100, 101-500, 500+',
  })
  numberOfEmployees?: string;

  @IsEmail()
  @IsOptional()
  companyEmail?: string;

  @IsArray()
  @IsOptional()
  @Type(() => String)
  HRs?: string[];
}
