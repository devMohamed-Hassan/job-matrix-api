import { IsOptional, IsString, IsEnum, IsDateString, Matches } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class UpdateAccountDto {
  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Mobile number must be valid' })
  mobileNumber?: string;

  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsOptional()
  DOB?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(Gender, { message: 'Gender must be either Male or Female' })
  @IsOptional()
  gender?: Gender;
}

