import { z } from "zod";

export const ProfileUpdateRequestSchema = z.object({
  name: z
    .string()
    .min(1, "name_min_length")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().min(1, "email_required").email("email_invalid"),
});

export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>;
