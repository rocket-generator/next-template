import { z } from "zod";

export const PasswordChangeRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "current_password_required"),
    newPassword: z
      .string()
      .min(8, "password_min_length")
      .max(256, "password_max_length"),
    confirmPassword: z.string().min(1, "confirm_password_required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "new_passwords_do_not_match",
    path: ["confirmPassword"],
  });

export type PasswordChangeRequest = z.infer<typeof PasswordChangeRequestSchema>;
