"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordRequest,
  ResetPasswordRequestSchema,
} from "@/requests/reset_password_request";
import { resetPasswordAction } from "@/app/(site)/(unauthorized)/auth/reset-password/actions";
import { Success, InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";
import { Loader2 } from "lucide-react";

export default function AuthResetPasswordForm() {
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAuth = useTranslations("Auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    defaultValues: {
      email: searchParams.get("email") || "",
      token: searchParams.get("token") || "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = (formData: ResetPasswordRequest) => {
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await resetPasswordAction(formData);
        switch (message) {
          case InvalidInput:
            setError(tAuth("invalid_input"));
            break;
          case Success:
            router.push("/auth/signin");
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
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <Input type="hidden" {...register("email")} />
          <Input type="hidden" {...register("token")} />

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
    </div>
  );
}