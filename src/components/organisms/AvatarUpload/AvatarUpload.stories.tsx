import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { AvatarUpload } from "./index";

const meta = {
  title: "organisms/AvatarUpload",
  component: AvatarUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onSuccess: { action: "success" },
  },
} satisfies Meta<typeof AvatarUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userName: "山田太郎",
    onSuccess: action("avatar-updated"),
  },
};

export const WithAvatar: Story = {
  args: {
    initialAvatarUrl: "https://via.placeholder.com/150",
    userName: "山田太郎",
    onSuccess: action("avatar-updated"),
  },
};

export const LongUserName: Story = {
  args: {
    userName: "非常に長い名前のユーザーさんの表示確認用テストデータ",
    onSuccess: action("avatar-updated"),
  },
};

export const WithAvatarAndLongName: Story = {
  args: {
    initialAvatarUrl: "https://via.placeholder.com/150",
    userName: "非常に長い名前のユーザーさんの表示確認用テストデータ",
    onSuccess: action("avatar-updated"),
  },
};
