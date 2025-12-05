import AuthSignupForm from "@/components/organisms/AuthSignupForm";
import { redirect } from "next/navigation";
import { signUpAction } from "./actions";
import { SignUpRequest } from "@/requests/signup_request";
import { Success, EmailVerificationRequired } from "@/constants/auth";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("signup.title"),
    description: t("signup.description"),
  });
}

interface SignUpPageProps {
  searchParams: Promise<{ callback_url?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callback_url ?? "";

  const handleSubmit = async (formData: SignUpRequest) => {
    "use server";
    const result = await signUpAction(formData);
    if (result === Success) {
      if (callbackUrl) {
        redirect(callbackUrl);
      } else {
        redirect("/dashboard");
      }
    } else if (result === EmailVerificationRequired) {
      redirect("/verify-email/pending");
    }
    return result;
  };

  return <AuthSignupForm onSubmit={handleSubmit} />;
}
