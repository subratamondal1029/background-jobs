import s3Client from "@/config/s3Client";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { randomBytes } from "node:crypto";
import { Readable } from "node:stream";

import { ALLOW_MINE_TYPES, MAX_FILE_SIZE } from "@/constant";

import ApiError from "@/utils/ApiError";

import type { Request } from "express";

class UploadService {
  private s3Client = s3Client;
  private bucketName = process.env.S3_BUCKET || "image-preview";

  private generateFileKey(filename: string = "image.jpg"): string {
    return `uploads/originals/${randomBytes(16).toString("hex")}-${filename}`;
  }

  async uploadFile(req: Request): Promise<{
    key: string,
    filename: string,
    contentType: string
  }> {
    const contentType = req.headers?.["content-type"];
    const fileSize = Number(req.headers?.["content-length"] || 0);

    if (!contentType || !ALLOW_MINE_TYPES.includes(contentType)) {
      throw new ApiError(415, "Invalid file type", undefined, [
        {
          path: "content-type",
          message: `Must be one of ${ALLOW_MINE_TYPES.join(", ")}`,
        },
      ]);
    }

    // if exist and real value
    if (fileSize > MAX_FILE_SIZE) {
      throw new ApiError(413, "File size exceeds limit", undefined, [
        {
          path: "content-length",
          message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
      ]);
    }

    // real file size validation
    let received = 0;
    req.on("data", (chunk: Buffer) => {
      received += chunk.length;
      if (received > MAX_FILE_SIZE) {
        return req.destroy(new ApiError(413, "File size exceeds limit"));
      }
    });

    const fileKey = this.generateFileKey(
      req.headers?.["x-file-name"] as string,
    );
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: req.body,
          ContentType: contentType,
        }),
      );

      return {
        key: fileKey,
        filename: fileKey.split("-").pop() || "image.jpg",
        contentType,
      };
    } catch (error) {
      // delete async if exist
      this.deleteFile(fileKey);
      throw error;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        }),
      );
    } catch (error) {
      console.error("Error deleting file:", error); // store in logs
    }
  }

  async getFile(fileKey: string): Promise<Readable> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );

    if (!response.Body) {
      throw new ApiError(404, "File not found");
    }

    return response.Body as Readable;
  }
}

export default new UploadService();