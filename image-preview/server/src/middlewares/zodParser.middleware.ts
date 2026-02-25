import { type ZodObject } from "zod";
import asyncHandler from "@/utils/asyncHandler.js";
import ApiError from "@/utils/ApiError.js";
import { Request, Response, NextFunction } from "express";

export enum TargetEnum {
  params = "params",
  body = "body",
  query = "query",
}

/**
 * Zod validation middleware
 * @param {ZodObject<any>} schema - The Zod schema to validate against
 * @param {TargetEnum} [target=TargetEnum.body] - The request property to validate
 * @returns Middleware function that validates request data and attaches parsed data to `req.body`, `req.query`, or `req.params` depending on the target
 * @example
 * // The validated data is available in req.body, req.query, or req.zodParsedQuery
 * const { email, password } = req.body;
 * const { page, limit } = req.zodParsedQuery;
 */

const zodParser = (schema: ZodObject<any>, target: TargetEnum) =>
  asyncHandler(async (req, res, next) => {
    const { success, error, data } = schema.safeParse(req[target]);

    if (!success) {
      const errors = error.issues.map((issue) => ({
        path: issue.path[0],
        message: issue.message,
        cause: issue.code,
      }));

      throw new ApiError(400, "Input Validation Error", undefined, errors);
    }

    // Assign directly to body/params (they're writable), or custom property for query (read-only)
    if (target === "query") {
      (req as any).zodParsedQuery = data;
    } else {
      req[target] = data;
    }
    next();
  });

export default zodParser;
