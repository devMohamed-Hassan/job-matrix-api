import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { JobModule } from '../job/job.module';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [UserModule, CompanyModule, JobModule, ApplicationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

