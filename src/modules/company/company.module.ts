import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyRepository } from './company.repository';
import { Company, CompanySchema } from './entities/company.entity';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { AdminOrOwnerGuard } from '../../common/guards/admin-or-owner.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
    ]),
  ],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    CloudinaryService,
    CompanyOwnerGuard,
    AdminOrOwnerGuard,
  ],
  exports: [CompanyService, CompanyRepository],
})
export class CompanyModule {}

