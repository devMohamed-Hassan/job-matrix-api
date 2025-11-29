import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationRepository } from './application.repository';
import { Application, ApplicationSchema } from './entities/application.entity';
import { UserModule } from '../user/user.module';
import { JobModule } from '../job/job.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    UserModule,
    JobModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationRepository],
  exports: [ApplicationService, ApplicationRepository],
})
export class ApplicationModule {}

