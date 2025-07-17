import type { Meta, StoryObj } from "@storybook/nextjs";
import EmailVerificationForm from "./index";

const action =
  (name: string) =>
  (...args: unknown[]) => {
    console.log(`Action: ${name}`, ...args);
    return Promise.resolve({ success: true, message: "Mock action completed" });
  };

const meta = {
  title: "organisms/EmailVerificationForm",
  component: EmailVerificationForm,
  parameters: {
    layout: "centered",
    nextjs: {
      navigation: {
        pathname: "/auth/verify-email",
        query: { token: "mock-verification-token" },
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onVerifyEmail: { action: "verify-email" },
    onResendEmail: { action: "resend-email" },
  },
} satisfies Meta<typeof EmailVerificationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onVerifyEmail: action("verify-email"),
    onResendEmail: action("resend-email"),
  },
};

export const Success: Story = {
  args: {
    onVerifyEmail: async () => ({
      success: true,
      message: "メールアドレスの認証が完了しました。",
    }),
    onResendEmail: action("resend-email"),
  },
};

export const Error: Story = {
  args: {
    onVerifyEmail: async () => ({
      success: false,
      message: "認証トークンが無効または期限切れです。",
    }),
    onResendEmail: action("resend-email"),
  },
};

export const ResendSuccess: Story = {
  args: {
    onVerifyEmail: async () => ({
      success: false,
      message: "認証トークンが無効または期限切れです。",
    }),
    onResendEmail: async () => ({
      success: true,
      message: "認証メールを再送信しました。",
    }),
  },
};

export const ResendError: Story = {
  args: {
    onVerifyEmail: async () => ({
      success: false,
      message: "認証トークンが無効または期限切れです。",
    }),
    onResendEmail: async () => ({
      success: false,
      message: "メールの再送信に失敗しました。",
    }),
  },
};
