import AuthResetPasswordForm from "@/components/organisms/AuthResetPasswordForm";
import { redirect } from "next/navigation";
import { resetPasswordAction } from "./actions";
import { ResetPasswordRequest } from "@/requests/reset_password_request";
import { Success } from "@/constants/auth";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("reset_password.title"),
    description: t("reset_password.description"),
  });
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token || "";
  const email = params.email || "";

  const handleSubmit = async (formData: ResetPasswordRequest) => {
    "use server";
    const result = await resetPasswordAction(formData);
    if (result === Success) {
      redirect("/signin");
    }
    return result;
  };

  return (
    <AuthResetPasswordForm
      token={token}
      email={email}
      onSubmit={handleSubmit}
    />
  );
}
