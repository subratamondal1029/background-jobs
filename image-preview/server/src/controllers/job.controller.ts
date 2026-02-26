import ApiError from "@/utils/ApiError";
import prisma from "@/lib/prisma";
import asyncHandler from "@/utils/asyncHandler";

import { publishToQueue } from "@/lib/rabbitmq";
import type { Job } from "../../generated/prisma/client";
import type { Request, Response } from "express";
import type { JobIdSchema } from "@/schema/jobSchema/id.schema.js";
import ApiResponse from "@/utils/ApiResponse";
import sseService from "@/services/sse.service";

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

const sendStatusUpdate = async (jobId: number, status: string) => {
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    sseService.sendData(jobId, {
      statusCode: 404,
      error: "Job not found",
    });
    return;
  }

  const response: {
    jobId: number;
    status: string;
    previewUrl?: string;
    error?: string;
  } = {
    jobId,
    status: job.status,
  };

  if (job.status === "SUCCESS") {
    response.previewUrl = `/api/v1/images/preview/${job.resourceId}`;
  } else if (job.status === "FAILED") {
    response.error = "Something Went Wrong";
  }

  sseService.sendData(jobId, response);

  if (job.status === "SUCCESS" || job.status === "FAILED") {
    sseService.removeInstance(jobId);
  }
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

// sse job status
const startSseJobStatusEvent = async (req: Request, res: Response) => {
  let job: Pick<
    Job,
    "id" | "status" | "completedAt" | "createdAt" | "updatedAt"
  > | null = null;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { id } = req.params as unknown as JobIdSchema;

    job = await prisma.job.findUnique({
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
      res.write(
        `data: ${JSON.stringify(new ApiError(404, "Job not found"))}\n\n`,
      );
      res.end();
      return;
    }

    res.write(
      `data: ${JSON.stringify(new ApiResponse(job, 200, "Job status retrieved successfully"))}\n\n`,
    );

    if (job?.status === "SUCCESS" || job?.status === "FAILED") {
      res.end();
      return;
    }

    const jobId = job.id;
    sseService.addInstance(jobId, res);
    req.on("close", () => {
      sseService.removeInstance(jobId);
    });
  } catch (error) {
    res.write(
      `data: ${JSON.stringify(new ApiError(500, "Internal server error"))}\n\n`,
    );
    res.end();
    if (job) {
      sseService.removeInstance(job.id);
    }
  }
};

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

export {
  addJob,
  getJobStatus,
  startSseJobStatusEvent,
  sendStatusUpdate,
  getJob,
};
