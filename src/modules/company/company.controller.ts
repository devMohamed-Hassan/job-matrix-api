import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dtos/create-company.dto';
import { UpdateCompanyDto } from './dtos/update-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { AdminOrOwnerGuard } from '../../common/guards/admin-or-owner.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { createMulterConfig } from '../../config/multer.config';

@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companyService.create(createCompanyDto, user.userId);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.companyService.update(id, updateCompanyDto, user.userId);
  }

  @UseGuards(JwtAuthGuard, AdminOrOwnerGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.companyService.softDelete(id, user.userId, user.role);
    return { message: 'Company deleted successfully' };
  }

  @Get('search')
  async searchByName(@Query('name') name: string) {
    if (!name) {
      throw new BadRequestException('Search term (name) is required');
    }
    return this.companyService.searchByName(name);
  }

  @Get(':id/jobs')
  async findOneWithJobs(@Param('id') id: string) {
    return this.companyService.findOneWithJobs(id);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('profile')))
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.companyService.uploadLogo(id, file, user.userId);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Post(':id/cover')
  @UseInterceptors(FileInterceptor('file', createMulterConfig('cover')))
  async uploadCoverPic(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.companyService.uploadCoverPic(id, file, user.userId);
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Delete(':id/logo')
  async deleteLogo(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.companyService.deleteLogo(id, user.userId);
    return { message: 'Logo deleted successfully' };
  }

  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @Delete(':id/cover')
  async deleteCoverPic(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.companyService.deleteCoverPic(id, user.userId);
    return { message: 'Cover picture deleted successfully' };
  }
}
