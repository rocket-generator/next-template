import SignUpPage from "@/app/(site)/(unauthorized)/(auth)/signup/page";
import { signUpAction } from "@/app/(site)/(unauthorized)/(auth)/signup/actions";
import { EmailVerificationRequired } from "@/constants/auth";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

const mockAuthSignupForm = jest.fn();

jest.mock("@/components/organisms/AuthSignupForm", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockAuthSignupForm(props);
    return null;
  },
}));

jest.mock("@/app/(site)/(unauthorized)/(auth)/signup/actions", () => ({
  signUpAction: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to the pending verification page when email verification is required", async () => {
    const formData = {
      name: "Example User",
      email: "user@example.com",
      password: "Password1!",
      confirm_password: "Password1!",
    };
    (signUpAction as jest.Mock).mockResolvedValue(EmailVerificationRequired);

    const element = (await SignUpPage({
      searchParams: Promise.resolve({}),
    })) as ReactElement<{
      onSubmit: (data: typeof formData) => Promise<string>;
    }>;

    await element.props.onSubmit(formData);

    expect(signUpAction).toHaveBeenCalledWith(formData);
    expect(redirect).toHaveBeenCalledWith("/verify-email/pending");
  });
});
