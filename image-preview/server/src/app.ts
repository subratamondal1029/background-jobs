import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import prisma from "@/lib/prisma.js";
import { publishToQueue } from "@/lib/rabbitmq.js";

const app = express();

// middleware config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/health", async (req: Request, res: Response) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log(result); // NOTE: ONLY FOR LEARNING

    res.status(200).json({ status: "OK", message: "Server is running" });
  } catch (error) {
    res.status(503).json({ status: "ERROR", message: "Database unavailable" });
  }
});

// testing
app.get("/test", async (req: Request, res: Response) => {
  const confirm = publishToQueue({ test: "message", jobId: 1 });
  await confirm();

  res.json({
    success: true,
    message: "Message published to queue successfully",
    jobId: 1,
  });
});

// Catch all route
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
