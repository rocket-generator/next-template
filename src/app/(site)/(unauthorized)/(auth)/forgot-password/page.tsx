import AuthForgotPasswordForm from "@/components/organisms/AuthForgotPasswordForm";
import { redirect } from "next/navigation";
import { forgotPasswordAction } from "./actions";
import { ForgotPasswordRequest } from "@/requests/forgot_password_request";
import { Success } from "@/constants/auth";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("forgot_password.title"),
    description: t("forgot_password.description"),
  });
}

interface ForgotPasswordPageProps {
  searchParams: Promise<{ sent?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const isSubmitted = params.sent === "true";

  const handleSubmit = async (formData: ForgotPasswordRequest) => {
    "use server";
    const result = await forgotPasswordAction(formData);
    if (result === Success) {
      redirect("/forgot-password?sent=true");
    }
    return result;
  };

  const handleTryAgain = async () => {
    "use server";
    redirect("/forgot-password");
  };

  return (
    <AuthForgotPasswordForm
      isSubmitted={isSubmitted}
      onSubmit={handleSubmit}
      onTryAgain={handleTryAgain}
    />
  );
}
