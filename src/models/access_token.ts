import { z } from "zod";

export const AccessTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  id: z.string(),
  permissions: z.array(z.string()),
});

export type AccessToken = z.infer<typeof AccessTokenSchema>;
