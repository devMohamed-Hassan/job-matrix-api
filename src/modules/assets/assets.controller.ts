import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { S3Service } from "../../common/services/s3.service";

@Controller("assets")
export class AssetsController {
  constructor(private readonly s3Service: S3Service) {}

  @Get("*")
  async getAsset(
    @Param("0") path: string,
    @Query("download") download: string,
    @Query("name") customName: string,
    @Res() res: Response
  ) {
    if (!path) {
      throw new BadRequestException("Asset path is required");
    }

    const shouldDownload = download === "true" || download === "1";

    const stream = await this.s3Service.getAsset({ key: path });

    if (!stream?.Body) {
      throw new NotFoundException("File not found");
    }

    const originalName = path.split("/").pop() || "file";
    const filename = customName || originalName;

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader(
      "Content-Type",
      stream.ContentType || "application/octet-stream"
    );

    if (shouldDownload) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
    } else {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(filename)}"`
      );
    }

    const readableStream = stream.Body as NodeJS.ReadableStream;
    readableStream.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming file" });
      }
    });
    readableStream.pipe(res);
  }
}
