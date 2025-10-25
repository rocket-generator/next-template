"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordRequest,
  createResetPasswordRequestSchema,
} from "@/requests/reset_password_request";
import { InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface AuthResetPasswordFormProps {
  token: string;
  email: string;
  onSubmit: (formData: ResetPasswordRequest) => Promise<string>;
}

export default function AuthResetPasswordForm({
  token,
  email,
  onSubmit,
}: AuthResetPasswordFormProps) {
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const tAuth = useTranslations("Auth");

  // 国際化されたバリデーションスキーマを作成
  const resetPasswordSchema = React.useMemo(
    () => createResetPasswordRequestSchema(tAuth),
    [tAuth]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email,
      token,
      password: "",
      confirm_password: "",
    },
  });

  // Set error if no token is provided
  React.useEffect(() => {
    if (!token) {
      setError(tAuth("invalid_reset_link"));
    }
  }, [token, tAuth]);

  const handleFormSubmit = (formData: ResetPasswordRequest) => {
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await onSubmit(formData);
        if (message === InvalidInput) {
          setError(tAuth("invalid_input"));
        }
        // Success case is handled by parent component (redirect)
      } catch (error) {
        console.error(error);
        setError(tAuth("system_error"));
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{tAuth("reset_password_title")}</h1>
        <p className="mt-2 text-gray-600">
          {tAuth("reset_password_description")}
        </p>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          <p>{error}</p>
          {!token && (
            <div className="mt-2">
              <Link
                href="/forgot-password"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {tAuth("go_to_forgot_password")}
              </Link>
            </div>
          )}
        </div>
      )}
      {token && (
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="mt-8 space-y-6"
        >
          <div className="space-y-4">
            <Input type="hidden" {...register("token")} />

            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                {tAuth("email")}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={cn(
                  "mt-1",
                  errors.email && "border-red-500 focus:ring-red-500"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                {tAuth("new_password")}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className={cn(
                  "mt-1",
                  errors.password && "border-red-500 focus:ring-red-500"
                )}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirm_password"
                className="block text-sm font-medium text-gray-700"
              >
                {tAuth("confirm_password")}
              </Label>
              <Input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                className={cn(
                  "mt-1",
                  errors.confirm_password && "border-red-500 focus:ring-red-500"
                )}
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tAuth("resetting")}
              </>
            ) : (
              tAuth("reset_password")
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
