import { IsNotEmpty, IsString } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsNotEmpty({ message: 'secure_url is required' })
  secure_url: string;

  @IsString()
  @IsNotEmpty({ message: 'public_id is required' })
  public_id: string;
}

