import * as z from "zod";

const createRequiredStringSchema = (
  requiredMessage: string,
  invalidTypeMessage: string = requiredMessage
) =>
  z.string({
    error: (issue) =>
      issue.input === undefined ? requiredMessage : invalidTypeMessage,
  });

export const emailSchema = createRequiredStringSchema(
  "Email is required",
  "Email must be a string"
)
  .min(1, {
    message: "Email is required",
  })
  .email({
    message: "Please enter a valid email address",
  });

export const passwordSchema = createRequiredStringSchema(
  "Password is required",
  "Password must be a string"
)
  .min(1, {
    message: "Password is required",
  })
  .min(8, {
    message: "Password must be made of at least 8 characters",
  })
  .max(256, {
    message: "Password must be made of at most 256 characters",
  })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
    message:
      "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
  });

export const nameSchema = createRequiredStringSchema(
  "Name is required",
  "Name must be a string"
).min(1, {
  message: "Name must be made of at least 1 character",
});

export const permissionsSchema = z
  .array(
    z.string({
      error: "Permission must be a string",
    })
  )
  .default([]);

export const avatarKeySchema = z
  .string({
    error: "Avatar key must be a string",
  })
  .optional();

export const UserCreateRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  permissions: permissionsSchema,
  avatarKey: avatarKeySchema,
});

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
