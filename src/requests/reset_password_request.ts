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
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
      message: t("validation.password_complexity"),
    });

export const createTokenSchema = (t: (key: string) => string) =>
  z
    .string({
      required_error: t("validation.token_required"),
      invalid_type_error: t("validation.token_required"),
    })
    .min(1, {
      message: t("validation.token_min_length"),
    });

export const createResetPasswordRequestSchema = (
  t: (key: string) => string
) => {
  const emailSchema = createEmailSchema(t);
  const passwordSchema = createPasswordSchema(t);
  const tokenSchema = createTokenSchema(t);

  return z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirm_password: passwordSchema,
      token: tokenSchema,
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t("validation.passwords_do_not_match"),
      path: ["confirm_password"],
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
    "validation.password_complexity":
      "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
  };
  return messages[key] || key;
});

export const tokenSchema = createTokenSchema((key) => {
  const messages: Record<string, string> = {
    "validation.token_required": "Token is required",
    "validation.token_min_length": "Token must be at least 1 character",
  };
  return messages[key] || key;
});

export const ResetPasswordRequestSchema = createResetPasswordRequestSchema(
  (key) => {
    const messages: Record<string, string> = {
      "validation.email_required": "Email is required",
      "validation.email_invalid": "Please enter a valid email address",
      "validation.password_required": "Password is required",
      "validation.password_min_length":
        "Password must be at least 8 characters",
      "validation.password_max_length":
        "Password must be at most 256 characters",
      "validation.password_complexity":
        "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
      "validation.passwords_do_not_match": "Passwords do not match",
      "validation.token_required": "Token is required",
      "validation.token_min_length": "Token must be at least 1 character",
    };
    return messages[key] || key;
  }
);

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
