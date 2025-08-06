import type { Meta, StoryObj } from "@storybook/nextjs";
import AuthSigninForm from "./index";

const meta = {
  title: "Organisms/AuthSigninForm",
  component: AuthSigninForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSubmit: {
      action: "submitted",
    },
  },
} satisfies Meta<typeof AuthSigninForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な使用例
export const Default: Story = {
  args: {
    onSubmit: async () => "success",
  },
};

// ローディング状態
export const Loading: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return "success";
    },
  },
};

// エラー状態 - 無効な入力
export const InvalidInput: Story = {
  args: {
    onSubmit: async () => "invalid-input",
  },
};

// エラー状態 - 無効な認証情報
export const InvalidCredentials: Story = {
  args: {
    onSubmit: async () => "invalid-credentials",
  },
};

// システムエラー
export const SystemError: Story = {
  args: {
    onSubmit: async () => {
      throw new Error("Network error");
    },
  },
};

// 成功状態（ローディング維持）
export const Success: Story = {
  args: {
    onSubmit: async () => "success",
  },
};
