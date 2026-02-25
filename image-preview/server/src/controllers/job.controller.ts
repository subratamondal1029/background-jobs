import ApiError from "@/utils/ApiError";
import prisma from "@/lib/prisma";
import asyncHandler from "@/utils/asyncHandler";

import { publishToQueue } from "@/lib/rabbitmq";
import type { Request, Response } from "express";
import type { JobIdSchema } from "@/schema/jobSchema/id.schema.js";
import ApiResponse from "@/utils/ApiResponse";

// outside of req, res cycle
const addJob = async (imageId: string): Promise<number> => {
  const job = await prisma.job.create({
    data: {
      resourceId: imageId,
    },
  });

  const confirm = publishToQueue({
    jobId: job.id,
    imageId,
    size: "1280x720",
  });

  await confirm();
  return job.id;
};

// for user
const getJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as JobIdSchema;

  const job = await prisma.job.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  res.json(new ApiResponse(job, 200, "Job status retrieved successfully"));
});

// for admin/developer
const getJob = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as JobIdSchema;

  const job = await prisma.job.findUnique({
    where: {
      id,
    },
  });

  if (!job) {
    throw new ApiError(404, "Job not found");
  }

  res.json(new ApiResponse(job, 200, "Job retrieved successfully"));
});

export { addJob, getJobStatus, getJob };
