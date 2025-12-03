import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  companyName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  industry: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['11-20', '21-50', '51-100', '101-500', '500+'], {
    message: 'numberOfEmployees must be one of: 11-20, 21-50, 51-100, 101-500, 500+',
  })
  numberOfEmployees: string;

  @IsEmail()
  @IsNotEmpty()
  companyEmail: string;
}
