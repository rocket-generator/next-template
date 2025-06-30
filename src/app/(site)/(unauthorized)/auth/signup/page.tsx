import AuthSignupForm from "@/components/organisms/AuthSignupForm";
import { redirect } from "next/navigation";
import { signUpAction } from "./actions";
import { SignUpRequest } from "@/requests/signup_request";
import { Success } from "@/constants/auth";

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
    }
    return result;
  };

  return <AuthSignupForm onSubmit={handleSubmit} />;
}
