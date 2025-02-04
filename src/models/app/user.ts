import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  permissions: z.array(z.string()),
});

export type User = z.infer<typeof UserSchema>;
