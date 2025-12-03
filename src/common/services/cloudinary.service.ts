import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { configureCloud } from '../../config/cloud.config';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    configureCloud(this.configService);
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(
                `Failed to upload file to Cloudinary: ${error.message}`,
                error.stack,
              );
              reject(
                new BadRequestException(`Failed to upload image: ${error.message}`),
              );
              return;
            }

            if (!result) {
              reject(new BadRequestException('Upload failed: No result returned'));
              return;
            }

            this.logger.log(`Successfully uploaded ${result.public_id} to Cloudinary`);

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Cloudinary: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async uploadDocument(
    file: Express.Multer.File,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only PDF, JPEG, PNG, and WebP files are allowed.',
      );
    }

    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    try {
      const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: resourceType,
            allowed_formats: resourceType === 'raw' ? ['pdf'] : ['jpg', 'jpeg', 'png', 'webp'],
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(
                `Failed to upload document to Cloudinary: ${error.message}`,
                error.stack,
              );
              reject(
                new BadRequestException(`Failed to upload document: ${error.message}`),
              );
              return;
            }

            if (!result) {
              reject(new BadRequestException('Upload failed: No result returned'));
              return;
            }

            this.logger.log(`Successfully uploaded ${result.public_id} to Cloudinary`);

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload document to Cloudinary: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to upload document: ${error.message}`);
    }
  }

  async uploadCV(
    file: Express.Multer.File,
    folder: string = 'cv',
  ): Promise<CloudinaryUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'Invalid file type. Only PDF files are allowed for CV.',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('CV file size exceeds 5MB limit');
    }

    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'raw',
            allowed_formats: ['pdf'],
            format: 'pdf',
          },
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              this.logger.error(
                `Failed to upload CV to Cloudinary: ${error.message}`,
                error.stack,
              );
              reject(
                new BadRequestException(`Failed to upload CV: ${error.message}`),
              );
              return;
            }

            if (!result) {
              reject(new BadRequestException('Upload failed: No result returned'));
              return;
            }

            this.logger.log(`Successfully uploaded CV ${result.public_id} to Cloudinary`);

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(
        `Failed to upload CV to Cloudinary: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to upload CV: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) {
      return;
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok') {
        this.logger.log(`Successfully deleted ${publicId} from Cloudinary`);
      } else if (result.result === 'not found') {
        this.logger.warn(`File ${publicId} not found in Cloudinary`);
      } else {
        this.logger.warn(`Failed to delete ${publicId}: ${result.result}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Cloudinary: ${error.message}`,
        error.stack,
      );
    }
  }
}

