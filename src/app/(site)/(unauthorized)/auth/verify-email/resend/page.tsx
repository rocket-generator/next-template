import ResendVerificationForm from "@/components/organisms/ResendVerificationForm";
import { resendVerificationEmailAction } from "../actions";

export default async function ResendVerificationPage() {
  return (
    <ResendVerificationForm onResendEmail={resendVerificationEmailAction} />
  );
}
