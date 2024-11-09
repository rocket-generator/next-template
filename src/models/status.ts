import { z } from "zod";

export const StatusSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invalid_params: z.array(z.string()).optional(),
  code: z.number(),
});

export type Status = z.infer<typeof StatusSchema>;
