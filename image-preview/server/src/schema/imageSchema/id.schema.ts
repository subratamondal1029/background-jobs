import { z } from "zod";

const idSchema = z.object({
  id: z.uuid(),
});

export {idSchema as imageIdSchema}
export type ImageIdSchema = z.infer<typeof idSchema>