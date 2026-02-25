import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../../generated/prisma/client";
import { S3ServiceException } from "@aws-sdk/client-s3";
import ApiError from "./ApiError";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const DEFAULT_MESSAGE = "Internal Server Error";

const createApiError = (
  statusCode: number,
  message: string,
  track?: string,
  errors: Array<Record<string, unknown>> = [],
) => new ApiError(statusCode, message, track, errors);

const normalizePrismaError = (err: unknown): ApiError | null => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCodeByCode: Record<string, number> = {
      P2002: 409,
      P2003: 409,
      P2014: 409,
      P2025: 404,
    };

    const statusCode = statusCodeByCode[err.code] ?? 400;
    return createApiError(statusCode, err.message, err.stack, [
      {
        source: "prisma",
        code: err.code,
        meta: err.meta ?? null,
      },
    ]);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return createApiError(400, err.message, err.stack, [
      {
        source: "prisma",
        type: "validation",
      },
    ]);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return createApiError(503, "Database unavailable", err.stack, [
      {
        source: "prisma",
        type: "initialization",
      },
    ]);
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return createApiError(500, "Database engine failure", err.stack, [
      {
        source: "prisma",
        type: "panic",
      },
    ]);
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return createApiError(500, "Database request failed", err.stack, [
      {
        source: "prisma",
        type: "unknown",
      },
    ]);
  }

  return null;
};

const normalizeS3Error = (err: unknown): ApiError | null => {
  if (!(err instanceof S3ServiceException)) {
    return null;
  }

  const statusCodeByName: Record<string, number> = {
    NoSuchKey: 404,
    AccessDenied: 403,
    InvalidObjectState: 409,
  };

  const statusCode =
    statusCodeByName[err.name] ?? err.$metadata?.httpStatusCode ?? 502;

  return createApiError(statusCode, err.message || "S3 request failed", err.stack, [
    {
      source: "s3",
      name: err.name,
      requestId: err.$metadata?.requestId ?? null,
      extendedRequestId: err.$metadata?.extendedRequestId ?? null,
    },
  ]);
};

const normalizeUnknownError = (err: unknown): ApiError => {
  if (err instanceof Error) {
    return createApiError(500, err.message || DEFAULT_MESSAGE, err.stack, [
      {
        source: "unknown",
        name: err.name,
      },
    ]);
  }

  return createApiError(500, DEFAULT_MESSAGE, undefined, [
    {
      source: "unknown",
      detail: err,
    },
  ]);
};

const normalizeErrorResponse = (err: unknown): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  const prismaError = normalizePrismaError(err);
  if (prismaError) {
    return prismaError;
  }

  const s3Error = normalizeS3Error(err);
  if (s3Error) {
    return s3Error;
  }

  return normalizeUnknownError(err);
};

const asyncHandler =
  (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
      const errorResponse = normalizeErrorResponse(err);
      next(errorResponse);
    });

export default asyncHandler;
