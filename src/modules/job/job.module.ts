import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { JobRepository } from './job.repository';
import { Job, JobSchema } from './entities/job.entity';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
    CompanyModule,
  ],
  controllers: [JobController],
  providers: [JobService, JobRepository],
  exports: [JobService, JobRepository],
})
export class JobModule {}

