import { z } from "zod";

const idSchema = z.object({
  id: z.coerce.number().min(1),
});

export {idSchema as jobIdSchema}
export type JobIdSchema = z.infer<typeof idSchema>