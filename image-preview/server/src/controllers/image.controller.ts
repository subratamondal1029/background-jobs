import asyncHandler from "@/utils/asyncHandler";
import ApiError from "@/utils/ApiError";
import ApiResponse from "@/utils/ApiResponse";
import prisma from "@/lib/prisma";
import type { Request, Response } from "express";
import uploadService from "@/services/upload.service";
import { addJob } from "./job.controller";

const getImageEntry = async (id: string) => {
  const image = await prisma.image.findUnique({
    where: {
      id,
    },
  });

  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  return image;
};

const upload = asyncHandler(async (req: Request, res: Response) => {
  const { key, filename, contentType } = await uploadService.uploadFile(req);

  const image = await prisma.image.create({
    data: {
      originalKey: key,
      filename,
      contentType,
    },
  });

  const jobId = await addJob(image.id);
  // create sse

  res
    .status(201)
    .json(
      new ApiResponse(
        { id: image.id, jobId },
        201,
        "Image uploaded successfully",
      ),
    );
});

const getImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const image = await getImageEntry(id);

  const stream = await uploadService.getFile(image.originalKey);

  stream.pipe(res);
});

const getImagePreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const image = await getImageEntry(id);

  if (!image.previewKey) {
    throw new ApiError(404, "Preview not available");
  }

  const stream = await uploadService.getFile(image.previewKey);
  stream.pipe(res);
});

const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const image = await getImageEntry(id);

  await prisma.image.delete({
    where: {
      id,
    },
  });

  uploadService.deleteFile(image.originalKey);
  if (image.previewKey) {
    uploadService.deleteFile(image.previewKey);
  }

  res.sendStatus(204);
});

export { upload, getImage, getImagePreview, deleteImage };
