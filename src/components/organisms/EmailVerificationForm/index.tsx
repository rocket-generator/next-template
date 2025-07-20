"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useTranslations } from "next-intl";
import { cn } from "@/libraries/css";
import { Loader2 } from "lucide-react";

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
    "loading" | "success" | "error" | "resending" | "resend_success"
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

  // 成功時に自動リダイレクト
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, router]);

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
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("email_verification")}</h1>
          <p className="mt-2 text-gray-600">{t("verifying_email")}</p>
        </div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("email_verification")}</h1>
          <p className="mt-2 text-gray-600">{t("verification_complete")}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-700"
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
          <p className="mt-4 text-sm text-gray-600">{message}</p>
          <p className="mt-4 text-sm text-gray-600">
            {t("verification_success_message")}
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className={cn(buttonVariants({ variant: "default" }), "w-full")}
            >
              {t("go_to_signin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // リセンド成功状態
  if (status === "resend_success") {
    return (
      <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("email_verification")}</h1>
          <p className="mt-2 text-gray-600">{t("email_sent")}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-700"
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
          <p className="mt-4 text-sm text-gray-600">{message}</p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              {t("back_to_signin")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態またはリセンド中の状態
  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("email_verification")}</h1>
        <p className="mt-2 text-gray-600">{t("verification_error")}</p>
      </div>
      {message && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded">
          {message}
        </div>
      )}
      <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              {t("email")}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder={t("resend_email_placeholder")}
            />
          </div>
        </div>

        <Button
          onClick={handleResendEmail}
          disabled={status === "resending"}
          className="w-full"
        >
          {status === "resending" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("resending")}
            </>
          ) : (
            t("resend_verification")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("already_have_account")}{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-gray-700 hover:underline"
          >
            {t("signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
