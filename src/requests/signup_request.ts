import * as z from "zod";

export const emailSchema = z
  .string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  })
  .email({
    message: "Please enter a valid email address",
  });

export const passwordSchema = z
  .string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
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

export const nameSchema = z
  .string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  })
  .min(1, {
    message: "Name must be made of at least 1 character",
  });

export const SignUpRequestSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm_password: passwordSchema,
    name: nameSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
