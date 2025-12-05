import { Suspense } from "react";
import EmailVerificationForm from "@/components/organisms/EmailVerificationForm";
import { verifyEmailAction, resendVerificationEmailAction } from "./actions";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("verify_email.title"),
    description: t("verify_email.description"),
  });
}

export default async function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center">Loading...</div>}>
      <EmailVerificationForm
        onVerifyEmail={verifyEmailAction}
        onResendEmail={resendVerificationEmailAction}
      />
    </Suspense>
  );
}
