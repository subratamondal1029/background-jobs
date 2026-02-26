import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import prisma from "@/lib/prisma.js";
import ApiError from "@/utils/ApiError.js";
import asyncHandler from "@/utils/asyncHandler.js";
import ApiResponse from "./utils/ApiResponse";
import imageRouter from "@/routes/image.routes.js"
import jobRouter from "@/routes/job.routes.js"

const app = express();

// middleware config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.json(new ApiResponse({ status: "OK", message: "Server is running" }));
    } catch (error) {
      throw new ApiError(503, "Database unavailable");
    }
  }),
);

// routes
app.use("/api/v1/images", imageRouter);
app.use("/api/v1/jobs", jobRouter);

// Catch all route
app.use(
  asyncHandler(async (req: Request, res: Response, __: NextFunction) => {
    const route = req.path;
    throw new ApiError(404, `Route not found: ${route}`);
  }),
);

// Error Handling Middleware
app.use((err: ApiError, _: Request, res: Response, __: NextFunction) => {
  res.status(err.statusCode).json(err);
});

export default app;
