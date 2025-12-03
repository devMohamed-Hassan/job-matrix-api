import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  receiverId: string;

  @IsMongoId()
  @IsNotEmpty()
  companyId: string;

  @IsOptional()
  @IsMongoId()
  applicationId?: string;
}

