import { Router, raw } from "express";
import {
  upload,
  getImage,
  getImagePreview,
  deleteImage,
} from "@/controllers/image.controller.js";
import zodParser, { TargetEnum } from "@/middlewares/zodParser.middleware";
import { imageIdSchema } from "@/schema/imageSchema/id.schema";
import { ALLOW_MINE_TYPES, MAX_FILE_SIZE } from "@/constant";

const router = Router();

router.post("/upload", raw({
  limit: MAX_FILE_SIZE,
  type: ALLOW_MINE_TYPES
}), upload);
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
