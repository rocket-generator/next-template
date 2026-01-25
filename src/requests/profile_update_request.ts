import { z } from "zod";

export const ProfileUpdateRequestSchema = z.object({
  name: z.string().min(1, "name_min_length").max(100, "name_max_length"),
  email: z.string().min(1, "email_required").email("email_invalid"),
});

export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>;
