import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { CompanyDocument } from './entities/company.entity';
import { S3Service } from '../../common/services/s3.service';
import { Types } from 'mongoose';

@Injectable()
export class CompanyService {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    userId: string,
    legalAttachment: Express.Multer.File,
  ): Promise<CompanyDocument> {
    const existingByEmail = await this.companyRepository.findByEmail(
      createCompanyDto.companyEmail,
    );
    if (existingByEmail) {
      throw new ConflictException(
        `Company with email ${createCompanyDto.companyEmail} already exists`,
      );
    }

    const existingByName = await this.companyRepository.findByName(
      createCompanyDto.companyName,
    );
    if (existingByName) {
      throw new ConflictException(
        `Company with name ${createCompanyDto.companyName} already exists`,
      );
    }

    const companyData = {
      ...createCompanyDto,
      companyEmail: createCompanyDto.companyEmail.toLowerCase(),
      companyName: createCompanyDto.companyName.trim(),
      createdBy: new Types.ObjectId(userId),
      approvedByAdmin: false,
    };

    const company = await this.companyRepository.create(companyData);

    const uploadResult = await this.s3Service.uploadCompanyImage(
      legalAttachment,
      'legal',
      company._id.toString(),
    );

    const updatedCompany = await this.companyRepository.update(
      company._id.toString(),
      {
        legalAttachment: {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
        },
      },
    );

    return updatedCompany ?? company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
  ): Promise<CompanyDocument> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== userId) {
      throw new ForbiddenException(
        'Only the company owner can update the company',
      );
    }

    if (updateCompanyDto.companyEmail) {
      const existingByEmail = await this.companyRepository.findByEmail(
        updateCompanyDto.companyEmail,
      );
      if (existingByEmail && existingByEmail._id.toString() !== id) {
        throw new ConflictException(
          `Company with email ${updateCompanyDto.companyEmail} already exists`,
        );
      }
    }

    if (updateCompanyDto.companyName) {
      const existingByName = await this.companyRepository.findByName(
        updateCompanyDto.companyName,
      );
      if (existingByName && existingByName._id.toString() !== id) {
        throw new ConflictException(
          `Company with name ${updateCompanyDto.companyName} already exists`,
        );
      }
    }

    const updateData: any = { ...updateCompanyDto };
    if (updateCompanyDto.HRs) {
      updateData.HRs = updateCompanyDto.HRs.map(
        (hrId) => new Types.ObjectId(hrId),
      );
    }

    if (updateCompanyDto.companyEmail) {
      updateData.companyEmail = updateCompanyDto.companyEmail.toLowerCase();
    }

    if (updateCompanyDto.companyName) {
      updateData.companyName = updateCompanyDto.companyName.trim();
    }

    const updatedCompany = await this.companyRepository.update(id, updateData);
    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return updatedCompany;
  }

  async softDelete(id: string, userId: string, userRole: string): Promise<void> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    const isAdmin = userRole === 'Admin';
    const isOwner = ownerId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Only admin or company owner can delete the company',
      );
    }

    await this.companyRepository.softDelete(id);
  }

  async findOneWithJobs(id: string): Promise<CompanyDocument> {
    const company = await this.companyRepository.findByIdWithJobs(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async searchByName(searchTerm: string): Promise<CompanyDocument[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }
    return this.companyRepository.searchByName(searchTerm.trim());
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<CompanyDocument> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== userId) {
      throw new ForbiddenException(
        'Only the company owner can upload the logo',
      );
    }

    if (company.logo?.public_id) {
      await this.s3Service.deleteImage(company.logo.public_id);
    }

    const uploadResult = await this.s3Service.uploadCompanyImage(
      file,
      'logo',
      id,
    );

    const updatedCompany = await this.companyRepository.update(id, {
      logo: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return updatedCompany;
  }

  async uploadCoverPic(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<CompanyDocument> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== userId) {
      throw new ForbiddenException(
        'Only the company owner can upload the cover picture',
      );
    }

    if (company.coverPic?.public_id) {
      await this.s3Service.deleteImage(company.coverPic.public_id);
    }

    const uploadResult = await this.s3Service.uploadCompanyImage(
      file,
      'cover',
      id,
    );

    const updatedCompany = await this.companyRepository.update(id, {
      coverPic: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return updatedCompany;
  }

  async deleteLogo(id: string, userId: string): Promise<void> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== userId) {
      throw new ForbiddenException(
        'Only the company owner can delete the logo',
      );
    }

    if (!company.logo?.public_id) {
      throw new BadRequestException('Company does not have a logo');
    }

    await this.s3Service.deleteImage(company.logo.public_id);

    await this.companyRepository.update(id, {
      logo: null,
    });
  }

  async deleteCoverPic(id: string, userId: string): Promise<void> {
    const company = await this.companyRepository.findByIdExcludingDeleted(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    const ownerId = company.createdBy?.toString() || company.createdBy;
    if (ownerId !== userId) {
      throw new ForbiddenException(
        'Only the company owner can delete the cover picture',
      );
    }

    if (!company.coverPic?.public_id) {
      throw new BadRequestException('Company does not have a cover picture');
    }

    await this.s3Service.deleteImage(company.coverPic.public_id);

    await this.companyRepository.update(id, {
      coverPic: null,
    });
  }
}
