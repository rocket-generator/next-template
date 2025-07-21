import type { Meta, StoryObj } from "@storybook/nextjs";
import { PasswordChangeForm } from "./index";

const action =
  (name: string) =>
  (...args: unknown[]) => {
    console.log(`Action: ${name}`, ...args);
  };

const meta = {
  title: "organisms/PasswordChangeForm",
  component: PasswordChangeForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSuccess: { action: "success" },
  },
} satisfies Meta<typeof PasswordChangeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSuccess: action("password-changed"),
  },
};
