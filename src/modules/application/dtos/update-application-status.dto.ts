import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus, {
    message:
      'status must be one of: pending, accepted, viewed, in-consideration, rejected',
  })
  @IsNotEmpty()
  status: ApplicationStatus;
}

