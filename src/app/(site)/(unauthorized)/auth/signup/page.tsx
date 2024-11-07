"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SignUpRequest, SignUpRequestSchema } from "@/requests/signup_request";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { signUpAction } from "./actions";

import { Success, InvalidCredentials, InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback_url") ?? "";
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpRequest>({
    resolver: zodResolver(SignUpRequestSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (formData: SignUpRequest) => {
    setError(null);
    startTransition(async () => {
      try {
        const message = await signUpAction(formData);
        switch (message) {
          case InvalidInput:
            setError(tAuth("invalid_input"));
            break;
          case InvalidCredentials:
            setError(tAuth("invalid_credentials"));
            break;
          case Success:
            if (callbackUrl) {
              router.push(callbackUrl);
            } else {
              router.push("/dashboard");
            }
            break;
        }
      } catch (error) {
        console.error(error);
        setError(tAuth("system_error"));
      }
    });
  };

  const tAuth = useTranslations("Auth");
  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{tAuth("signup")}</h1>
        <p className="mt-2 text-gray-600">{tAuth("create_account")}</p>
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
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              {tAuth("name")}
            </Label>
            <Input
              id="name"
              {...register("name")}
              type="text"
              autoComplete="name"
              required
              className={cn(
                "mt-1",
                errors.name && "border-red-500 focus:ring-red-500"
              )}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              {tAuth("confirm_password")}
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className={cn(
                "mt-1",
                errors.confirmPassword && "border-red-500 focus:ring-red-500"
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          {tAuth("signup")}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {tAuth("already_have_account")}{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            {tAuth("signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
