import ResendVerificationForm from "@/components/organisms/ResendVerificationForm";
import { resendVerificationEmailAction } from "../actions";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("verify_email_resend.title"),
    description: t("verify_email_resend.description"),
  });
}

export default async function ResendVerificationPage() {
  return (
    <ResendVerificationForm onResendEmail={resendVerificationEmailAction} />
  );
}
