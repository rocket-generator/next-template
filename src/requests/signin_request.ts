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

export const createPasswordSchema = (t: (key: string) => string) =>
  z
    .string({
      required_error: t("validation.password_required"),
      invalid_type_error: t("validation.password_required"),
    })
    .min(8, {
      message: t("validation.password_min_length"),
    })
    .max(256, {
      message: t("validation.password_max_length"),
    });

export const createSignInRequestSchema = (t: (key: string) => string) => {
  const emailSchema = createEmailSchema(t);
  const passwordSchema = createPasswordSchema(t);

  return z.object({
    email: emailSchema,
    password: passwordSchema,
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

export const passwordSchema = createPasswordSchema((key) => {
  const messages: Record<string, string> = {
    "validation.password_required": "Password is required",
    "validation.password_min_length": "Password must be at least 8 characters",
    "validation.password_max_length": "Password must be at most 256 characters",
  };
  return messages[key] || key;
});

export const SignInRequestSchema = createSignInRequestSchema((key) => {
  const messages: Record<string, string> = {
    "validation.email_required": "Email is required",
    "validation.email_invalid": "Please enter a valid email address",
    "validation.password_required": "Password is required",
    "validation.password_min_length": "Password must be at least 8 characters",
    "validation.password_max_length": "Password must be at most 256 characters",
  };
  return messages[key] || key;
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;
