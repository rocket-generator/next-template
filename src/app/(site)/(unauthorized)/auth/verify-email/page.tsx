import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import EmailVerificationForm from "@/components/organisms/EmailVerificationForm";
import { verifyEmailAction, resendVerificationEmailAction } from "./actions";

export default async function VerifyEmailPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {t("email_verification")}
          </h2>
        </div>
        <Suspense
          fallback={<div className="text-center">{t("verifying")}...</div>}
        >
          <EmailVerificationForm
            onVerifyEmail={verifyEmailAction}
            onResendEmail={resendVerificationEmailAction}
          />
        </Suspense>
      </div>
    </div>
  );
}
