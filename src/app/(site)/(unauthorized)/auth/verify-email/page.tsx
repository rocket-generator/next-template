import { Suspense } from "react";
import EmailVerificationForm from "@/components/organisms/EmailVerificationForm";
import { verifyEmailAction, resendVerificationEmailAction } from "./actions";

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
