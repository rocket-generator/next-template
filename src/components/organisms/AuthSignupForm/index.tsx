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
import { signUpAction } from "@/app/(site)/(unauthorized)/auth/signup/actions";
import { Loader2 } from "lucide-react";
import { Success, InvalidCredentials, InvalidInput } from "@/constants/auth";
import { cn } from "@/libraries/css";

export default function AuthSignupForm() {
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
      confirm_password: "",
      name: "",
    },
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = (formData: SignUpRequest) => {
    console.log(formData);
    setError(null);
    setIsLoading(true);
    startTransition(async () => {
      try {
        const message = await signUpAction(formData);
        console.log(message);
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
      } finally {
        setIsLoading(false);
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