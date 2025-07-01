import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { ProfileForm } from "./index";

const meta = {
  title: "organisms/ProfileForm",
  component: ProfileForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSuccess: { action: "success" },
  },
} satisfies Meta<typeof ProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialName: "山田太郎",
    initialEmail: "yamada@example.com",
    onSuccess: action("profile-updated"),
  },
};

export const Empty: Story = {
  args: {
    initialName: "",
    initialEmail: "",
    onSuccess: action("profile-updated"),
  },
};

export const LongName: Story = {
  args: {
    initialName: "非常に長い名前のユーザーさんの表示確認用テストデータ",
    initialEmail: "long-name-user@example.com",
    onSuccess: action("profile-updated"),
  },
};

export const LongEmail: Story = {
  args: {
    initialName: "山田太郎",
    initialEmail:
      "very.long.email.address.for.testing.purposes@example-domain.com",
    onSuccess: action("profile-updated"),
  },
};
