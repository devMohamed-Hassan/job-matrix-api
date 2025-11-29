import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '../entities/user.entity';
import { IsAgeValid } from '../../../common/validators/is-age-valid.validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @IsEnum(Gender, { message: 'Gender must be either Male or Female' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsAgeValid({ message: 'Date of birth must be valid, in the past, and age must be at least 18 years' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date;
    }
    return value;
  })
  DOB: Date;

  @IsString()
  @IsOptional()
  mobileNumber?: string;
}
