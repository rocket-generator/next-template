"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface ResendVerificationFormProps {
  onResendEmail: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
}

export default function ResendVerificationForm({
  onResendEmail,
}: ResendVerificationFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const t = useTranslations("Auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus("error");
      setMessage(t("validation.email_required"));
      return;
    }

    // 簡単なメールバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus("error");
      setMessage(t("validation.email_invalid"));
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const result = await onResendEmail(email);

      if (result.success) {
        setStatus("success");
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

  if (status === "success") {
    return (
      <div
        data-testid="resend-verification-success"
        className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {t("email_verification_pending")}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("verification_email_resent_description")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("check_your_email")}
            </h3>

            <p className="text-sm text-gray-600 mb-6">
              {t("verification_email_resent_success")}
            </p>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t("didnt_receive_email")}
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setStatus("idle");
                    setMessage("");
                    setEmail("");
                  }}
                  className="font-medium text-gray-700 hover:underline"
                >
                  {t("resend_verification_email")}
                </button>

                <Link
                  data-testid="signin-link"
                  href="/auth/signin"
                  className="font-medium text-gray-700 hover:underline"
                >
                  {t("back_to_signin")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="resend-verification-form"
      className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md"
    >
      <div className="text-center">
        <h1
          data-testid="resend-verification-title"
          className="text-2xl font-bold"
        >
          {t("resend_verification_email")}
        </h1>
        <p className="mt-2 text-gray-600">
          {t("resend_verification_description")}
        </p>
      </div>

      {status === "error" && message && (
        <div
          data-testid="error-message"
          className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded"
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              type="text"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <Button
          type="submit"
          data-testid="resend-submit-button"
          className="w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("sending")}
            </>
          ) : (
            t("resend_verification_email")
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t("already_have_account")}{" "}
          <Link
            data-testid="signin-link"
            href="/auth/signin"
            className="font-medium text-blue-600 hover:underline"
          >
            {t("signin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
