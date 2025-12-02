import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { S3Service } from '../../common/services/s3.service';

@Module({
  controllers: [AssetsController],
  providers: [S3Service],
})
export class AssetsModule {}

