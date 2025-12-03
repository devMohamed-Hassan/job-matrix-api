import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { ApplicationRepository } from './application.repository';
import { Application, ApplicationSchema } from './entities/application.entity';
import { UserModule } from '../user/user.module';
import { JobModule } from '../job/job.module';
import { CompanyModule } from '../company/company.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { S3Service } from '../../common/services/s3.service';
import { HrOrOwnerGuard } from '../../common/guards/hr-or-owner.guard';
import { UserRoleGuard } from '../../common/guards/user-role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    UserModule,
    JobModule,
    CompanyModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationService,
    ApplicationRepository,
    S3Service,
    HrOrOwnerGuard,
    UserRoleGuard,
  ],
  exports: [ApplicationService, ApplicationRepository],
})
export class ApplicationModule {}

