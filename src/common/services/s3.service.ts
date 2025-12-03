import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { extname } from "path";

export interface S3UploadResult {
  secure_url: string;
  public_id: string;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>("aws.region");
    const accessKeyId = this.configService.get<string>("aws.accessKeyId");
    const secretAccessKey = this.configService.get<string>(
      "aws.secretAccessKey"
    );
    this.bucketName = this.configService.get<string>("aws.s3BucketName");

    if (!this.region || !accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn(
        "AWS S3 configuration is incomplete. Some features may not work."
      );
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: "profile" | "cover",
    userId: string
  ): Promise<S3UploadResult> {
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }

    try {
      const fileExtension = extname(file.originalname).toLowerCase();
      const fileName = `${userId}-${uuidv4()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const apiUrl = this.configService.get<string>("apiUrl") || "http://localhost:5000";
      const proxyUrl = `${apiUrl}/assets/${key}`;

      this.logger.log(`Successfully uploaded ${key} to S3`);

      return {
        secure_url: proxyUrl,
        public_id: key,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to S3: ${error.message}`,
        error.stack
      );
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(key: string): Promise<void> {
    if (!key) {
      return;
    }

    if (!key.startsWith("profile/") && !key.startsWith("cover/")) {
      this.logger.warn(`Skipping deletion of non-S3 key: ${key}`);
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted ${key} from S3`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${error.message}`,
        error.stack
      );
    }
  }

  async getAsset({ key }: { key: string }) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return await this.s3Client.send(command);
  }

  private getPublicUrl(key: string): string {
    if (this.region === "us-east-1") {
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url) {
      return null;
    }

    const apiUrl = this.configService.get<string>("apiUrl") || "http://localhost:5000";
    const proxyUrlPattern = new RegExp(`${apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/assets/(.+)`);
    const proxyMatch = url.match(proxyUrlPattern);
    if (proxyMatch) {
      return proxyMatch[1];
    }

    let s3UrlPattern: RegExp;
    if (this.region === "us-east-1") {
      s3UrlPattern = new RegExp(
        `https://${this.bucketName}\\.s3\\.amazonaws\\.com/(.+)`
      );
    } else {
      s3UrlPattern = new RegExp(
        `https://${this.bucketName}\\.s3\\.${this.region}\\.amazonaws\\.com/(.+)`
      );
    }
    const match = url.match(s3UrlPattern);
    return match ? match[1] : null;
  }
}
