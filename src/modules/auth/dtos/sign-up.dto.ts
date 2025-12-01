import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Matches, IsEnum, IsDateString } from 'class-validator';
import { Gender } from '../../user/entities/user.entity';

export class SignUpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(Gender, { message: 'Gender must be either Male or Female' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

  @IsDateString({}, { message: 'Date of birth must be a valid date' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  DOB: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9+\-\s()]+$/, { message: 'Mobile number must be valid' })
  mobileNumber?: string;
}

