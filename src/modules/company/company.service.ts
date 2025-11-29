import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { CompanyDocument } from './entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    ownerId: string,
  ): Promise<CompanyDocument> {
    // TODO: Implement company creation logic
    throw new Error('Method not implemented.');
  }

  async findAll(): Promise<CompanyDocument[]> {
    return this.companyRepository.findAll();
  }

  async findOne(id: string): Promise<CompanyDocument> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async findByOwnerId(ownerId: string): Promise<CompanyDocument[]> {
    return this.companyRepository.findByOwnerId(ownerId);
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyDocument> {
    const company = await this.companyRepository.update(id, updateCompanyDto);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async remove(id: string): Promise<void> {
    await this.companyRepository.delete(id);
  }
}

