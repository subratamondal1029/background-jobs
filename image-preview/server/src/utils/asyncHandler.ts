import type { Request, Response, NextFunction } from "express";
import ApiError from "./ApiError";

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

const normalizeErrorResponse = (err: unknown): ApiError => {
  let errorResponse: ApiError;

  if (err instanceof ApiError) {
    errorResponse = err;
  }
  // TODO: handle other error types

  // unknown Error
  errorResponse = new ApiError();

  return errorResponse;
};

const asyncHandler =
  (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch((err) => {
      const errorResponse = normalizeErrorResponse(err);
      next(errorResponse);
    });

export default asyncHandler;
