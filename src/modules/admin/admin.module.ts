import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { JobModule } from '../job/job.module';
import { ApplicationModule } from '../application/application.module';
import { AuthModule } from '../auth/auth.module';
import { AdminResolver } from './graphql/admin.resolver';

@Module({
  imports: [UserModule, CompanyModule, JobModule, ApplicationModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminResolver],
  exports: [AdminService],
})
export class AdminModule {}

