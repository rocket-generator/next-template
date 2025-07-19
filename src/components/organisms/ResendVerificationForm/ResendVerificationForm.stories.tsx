import type { Meta, StoryObj } from "@storybook/nextjs";
import ResendVerificationForm from "./index";

const meta: Meta<typeof ResendVerificationForm> = {
  title: "Organisms/ResendVerificationForm",
  component: ResendVerificationForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onResendEmail: { action: "resend email" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockResendEmail = async () => {
  return new Promise<{ success: boolean; message: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: "Verification email sent successfully",
      });
    }, 1000);
  });
};

export const Default: Story = {
  args: {
    onResendEmail: mockResendEmail,
  },
};

export const WithError: Story = {
  args: {
    onResendEmail: async () => {
      return { success: false, message: "メールアドレスが見つかりません" };
    },
  },
};

export const WithSuccess: Story = {
  args: {
    onResendEmail: async () => {
      return { success: true, message: "認証メールを再送信しました" };
    },
  },
};
