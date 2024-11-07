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
  .min(4, {
    message: "Password must be made of at least 8 characters",
  })
  .max(256, {
    message: "Password must be made of at most 256 characters",
  })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/, {
    message:
      "Password must contain at least 8 characters, including one uppercase, one lowercase, one number and one special character",
  });

export const nameSchema = z.string({
  required_error: "Name is required",
  invalid_type_error: "Name must be a string",
});

export const SignUpRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
