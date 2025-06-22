"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
} from "@/requests/forgot_password_request";
import { forgotPasswordAction } from "@/app/(site)/(unauthorized)/auth/forgot-password/actions";
import { Success, InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";
import { Mail, Loader2 } from "lucide-react";

export default function AuthForgotPasswordForm() {
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const tAuth = useTranslations("Auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (formData: ForgotPasswordRequest) => {
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await forgotPasswordAction(formData);
        switch (message) {
          case InvalidInput:
            setError(tAuth("invalid_input"));
            break;
          case Success:
            setIsSubmitted(true);
            break;
        }
      } catch (error) {
        console.error(error);
        setError(tAuth("system_error"));
      } finally {
        setIsLoading(false);
      }
    });
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 mb-4 text-blue-500">
            <Mail className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold">{tAuth("email_sent")}</h1>
          <p className="mt-4 text-gray-600">
            {tAuth("check_email_for_reset_link")}
          </p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {tAuth("didnt_receive_email")}{" "}
            <button
              onClick={() => setIsSubmitted(false)}
              className="font-medium text-blue-600 hover:underline"
            >
              {tAuth("try_again")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{tAuth("forgot_password_title")}</h1>
        <p className="mt-2 text-gray-600">
          {tAuth("forgot_password_description")}
        </p>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
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
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tAuth("sending")}
            </>
          ) : (
            tAuth("send_reset_link")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {tAuth("remembered_password")}{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:underline"
          >
            {tAuth("signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}