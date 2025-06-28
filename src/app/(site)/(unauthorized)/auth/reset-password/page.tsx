import AuthResetPasswordForm from "@/components/organisms/AuthResetPasswordForm";
import { Suspense } from "react";

function ResetPasswordContent() {
  return <AuthResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
