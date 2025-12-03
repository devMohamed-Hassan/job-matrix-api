import { IsString, IsNotEmpty, MinLength, MaxLength, IsMongoId, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Message must be at least 1 character' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message: string;

  @IsMongoId()
  @IsNotEmpty()
  receiverId: string;

  @IsOptional()
  @IsMongoId()
  conversationId?: string;

  @IsOptional()
  @IsMongoId()
  applicationId?: string;
}

