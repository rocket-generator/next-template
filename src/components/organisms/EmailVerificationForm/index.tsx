"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/atoms/button";
import { useTranslations } from "next-intl";
import { cn } from "@/libraries/css";

interface EmailVerificationFormProps {
  onVerifyEmail: (
    token: string
  ) => Promise<{ success: boolean; message: string }>;
  onResendEmail: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
}

export default function EmailVerificationForm({
  onVerifyEmail,
  onResendEmail,
}: EmailVerificationFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "resending"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const t = useTranslations("Auth");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(t("token_missing"));
      return;
    }

    // トークンを使って認証処理を実行
    onVerifyEmail(token)
      .then((result) => {
        if (result.success) {
          setStatus("success");
          setMessage(result.message);
          // 3秒後にサインインページにリダイレクト
          setTimeout(() => {
            router.push("/auth/signin");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(result.message);
        }
      })
      .catch((error) => {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage(t("verification_error"));
      });
  }, [searchParams, router, onVerifyEmail, t]);

  const handleResendEmail = async () => {
    if (!email) {
      setMessage(t("validation.email_required"));
      return;
    }

    setStatus("resending");
    setMessage(t("resending"));

    try {
      const result = await onResendEmail(email);

      if (result.success) {
        setStatus("resend_success");
        setMessage(result.message);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch (error) {
      console.error("Resend error:", error);
      setStatus("error");
      setMessage(t("resend_error"));
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t("verifying_email")}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {t("verification_complete")}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <p className="mt-2 text-xs text-gray-500">
          {t("redirecting_to_signin")}
        </p>
      </div>
    );
  }

  // リセンド成功状態
  if (status === "resend_success") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {t("email_sent")}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6">
          <Link
            href="/auth/signin"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            {t("back_to_signin")}
          </Link>
        </div>
      </div>
    );
  }

  // エラー状態またはリセンド中の状態
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {t("verification_error")}
      </h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder={t("resend_email_placeholder")}
          />
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleResendEmail}
            disabled={status === "resending"}
            className="flex-1"
          >
            {status === "resending" ? t("resending") : t("resend_verification")}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/auth/signin")}
            className="flex-1"
          >
            {t("back_to_signin")}
          </Button>
        </div>
      </div>
    </div>
  );
}
