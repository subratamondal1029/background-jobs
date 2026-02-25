import { Router } from "express";
import {
  upload,
  getImage,
  getImagePreview,
  deleteImage,
} from "@/controllers/image.controller.js";
import zodParser, { TargetEnum } from "@/middlewares/zodParser.middleware";
import { imageIdSchema } from "@/schema/imageSchema/id.schema";

const router = Router();

router.post("/upload", upload);
router.get(
  "/preview/:id",
  zodParser(imageIdSchema, TargetEnum.params),
  getImagePreview,
);
router
  .route("/:id")
  .all(zodParser(imageIdSchema, TargetEnum.params))
  .get(getImage)
  .delete(deleteImage);

export default router;
