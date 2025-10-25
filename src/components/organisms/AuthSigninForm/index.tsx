"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SignInRequest, SignInRequestSchema } from "@/requests/signin_request";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import {
  InvalidCredentials,
  InvalidInput,
  EmailVerificationRequired,
} from "@/constants/auth";
import { cn } from "@/libraries/css";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface AuthSigninFormProps {
  onSubmit: (formData: SignInRequest) => Promise<string>;
}

export default function AuthSigninForm({ onSubmit }: AuthSigninFormProps) {
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInRequest>({
    resolver: zodResolver(SignInRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFormSubmit = (formData: SignInRequest) => {
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await onSubmit(formData);
        if (message === InvalidInput) {
          setError(tAuth("invalid_input"));
          setIsLoading(false);
        } else if (message === InvalidCredentials) {
          setError(tAuth("invalid_credentials"));
          setIsLoading(false);
        } else if (message === EmailVerificationRequired) {
          setError(tAuth("email_verification_required"));
          setIsLoading(false);
        }
        // Success case: ローディング状態を維持し、親コンポーネントのリダイレクトを待つ
        // 成功時はsetIsLoading(false)を呼ばない
      } catch (error) {
        if (isRedirectError(error)) {
          return;
        }
        console.error(error);
        setError(tAuth("system_error"));
        setIsLoading(false);
      }
    });
  };

  const tAuth = useTranslations("Auth");

  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{tAuth("signin")}</h1>
        <p className="mt-2 text-gray-600">{tAuth("signin_description")}</p>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-8 space-y-6"
      >
        <div className="space-y-4">
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
              data-testid="email-input"
              autoComplete="email"
              required
              className={cn(
                "mt-1",
                errors.email && "border-red-500 focus:ring-red-500"
              )}
              placeholder="your@email.com"
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
              {tAuth("password")}
            </Label>
            <Input
              id="password"
              type="password"
              data-testid="password-input"
              autoComplete="current-password"
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
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            {tAuth("if_forgot_password")}
          </Link>
        </div>

        <Button
          type="submit"
          data-testid="signin-submit-button"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tAuth("signing_in")}
            </>
          ) : (
            tAuth("signin")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {tAuth("if_you_do_not_have_an_account")}{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            {tAuth("signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
