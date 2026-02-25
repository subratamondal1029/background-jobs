import { Router } from "express";
import { getJob, getJobStatus } from "@/controllers/job.controller";
import zodParser, { TargetEnum } from "@/middlewares/zodParser.middleware";
import { jobIdSchema } from "@/schema/jobSchema/id.schema";

const router = Router();

router.use(zodParser(jobIdSchema, TargetEnum.params));

router.get("/:id", getJob);
router.get("/status/:id", getJobStatus);

export default router;
