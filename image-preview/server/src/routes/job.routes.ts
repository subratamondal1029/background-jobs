import { Router } from "express";
import {
  getJob,
  getJobStatus,
  startSseJobStatusEvent,
} from "@/controllers/job.controller";
import zodParser, { TargetEnum } from "@/middlewares/zodParser.middleware";
import { jobIdSchema } from "@/schema/jobSchema/id.schema";

const router = Router();

router.get("/status/event/:id", startSseJobStatusEvent); // zod parse in controller for normalize error message
router.get("/status/:id", zodParser(jobIdSchema, TargetEnum.params), getJobStatus);
router.get("/:id", zodParser(jobIdSchema, TargetEnum.params), getJob);

export default router;
