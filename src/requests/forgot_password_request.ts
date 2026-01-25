import * as z from "zod";

// 国際化対応のスキーマ作成関数
export const createEmailSchema = (t: (key: string) => string) =>
  z
    .string({
      required_error: t("validation.email_required"),
      invalid_type_error: t("validation.email_required"),
    })
    .email({
      message: t("validation.email_invalid"),
    });

export const createForgotPasswordRequestSchema = (
  t: (key: string) => string
) => {
  const emailSchema = createEmailSchema(t);

  return z.object({
    email: emailSchema,
  });
};

// 後方互換性のための非国際化スキーマ（デフォルト英語）
export const emailSchema = createEmailSchema((key) => {
  const messages: Record<string, string> = {
    "validation.email_required": "Email is required",
    "validation.email_invalid": "Please enter a valid email address",
  };
  return messages[key] || key;
});

export const ForgotPasswordRequestSchema = createForgotPasswordRequestSchema(
  (key) => {
    const messages: Record<string, string> = {
      "validation.email_required": "Email is required",
      "validation.email_invalid": "Please enter a valid email address",
    };
    return messages[key] || key;
  }
);

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;
