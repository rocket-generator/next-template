import { z } from "zod";

export const AuthSchema = z.object({
  id: z.string(),
  email: z.string(),
  password: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});

export type Auth = z.infer<typeof AuthSchema>;
