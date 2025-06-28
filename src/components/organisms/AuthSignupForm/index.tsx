"use client";
import * as React from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { SignUpRequest, SignUpRequestSchema } from "@/requests/signup_request";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { InvalidCredentials, InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";

interface AuthSignupFormProps {
  onSubmit: (formData: SignUpRequest) => Promise<string>;
}

export default function AuthSignupForm({ onSubmit }: AuthSignupFormProps) {
  const [, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const tAuth = useTranslations("Auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpRequest>({
    resolver: zodResolver(SignUpRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      name: "",
    },
  });

  const handleFormSubmit = (formData: SignUpRequest) => {
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await onSubmit(formData);
        if (message === InvalidInput) {
          setError(tAuth("invalid_input"));
        } else if (message === InvalidCredentials) {
          setError(tAuth("invalid_credentials"));
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
        <h1 className="text-2xl font-bold">{tAuth("signup")}</h1>
        <p className="mt-2 text-gray-600">{tAuth("create_account")}</p>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 space-y-6">
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
              placeholder={tAuth("name_placeholder")}
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
              {tAuth("email")}
            </Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              autoComplete="email"
              required
              className={cn(
                "mt-1",
                errors.email && "border-red-500 focus:ring-red-500"
              )}
              placeholder="your@email.com"
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
              {...register("password")}
              type="password"
              autoComplete="new-password"
              required
              className={cn(
                "mt-1",
                errors.password && "border-red-500 focus:ring-red-500"
              )}
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
              {...register("confirm_password")}
              type="password"
              autoComplete="new-password"
              required
              className={cn(
                "mt-1",
                errors.confirm_password && "border-red-500 focus:ring-red-500"
              )}
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
              {tAuth("signing_up")}
            </>
          ) : (
            tAuth("signup")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {tAuth("already_have_account")}{" "}
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