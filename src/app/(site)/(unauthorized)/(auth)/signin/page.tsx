import AuthSigninForm from "@/components/organisms/AuthSigninForm";
import { redirect } from "next/navigation";
import { signInAction } from "./actions";
import { SignInRequest } from "@/requests/signin_request";
import { Success } from "@/constants/auth";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("signin.title"),
    description: t("signin.description"),
  });
}

interface SignInPageProps {
  searchParams: Promise<{ callback_url?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callback_url ?? "";

  const handleSubmit = async (formData: SignInRequest) => {
    "use server";
    const result = await signInAction(formData);
    if (result === Success) {
      if (callbackUrl) {
        redirect(callbackUrl);
      } else {
        redirect("/dashboard");
      }
    }
    return result;
  };

  return <AuthSigninForm onSubmit={handleSubmit} />;
}
