import { z } from "zod";

// 国際化対応のスキーマ作成関数
export const createPasswordChangeRequestSchema = (
  t: (key: string) => string
) => {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, t("validation.current_password_required")),
      newPassword: z
        .string()
        .min(8, t("validation.password_min_length"))
        .max(256, t("validation.password_max_length"))
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
          message: t("validation.password_complexity"),
        }),
      confirmPassword: z
        .string()
        .min(1, t("validation.confirm_password_required")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.new_passwords_do_not_match"),
      path: ["confirmPassword"],
    });
};

// 後方互換性のための非国際化スキーマ（デフォルト英語）
export const PasswordChangeRequestSchema = createPasswordChangeRequestSchema(
  (key) => {
    const messages: Record<string, string> = {
      "validation.current_password_required": "current_password_required",
      "validation.password_min_length": "password_min_length",
      "validation.password_max_length": "password_max_length",
      "validation.password_complexity":
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
      "validation.confirm_password_required": "confirm_password_required",
      "validation.new_passwords_do_not_match": "new_passwords_do_not_match",
    };
    return messages[key] || key;
  }
);

export type PasswordChangeRequest = z.infer<typeof PasswordChangeRequestSchema>;
