import type { Meta, StoryObj } from "@storybook/nextjs";
import AdminHeader from "./index";
import type { User } from "@/models/user";

const meta: Meta<typeof AdminHeader> = {
  title: "Organisms/AdminHeader",
  component: AdminHeader,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser: User = {
  id: "1",
  email: "user@example.com",
  password: "password",
  name: "田中太郎",
  permissions: ["read", "write"],
  isActive: true,
  emailVerified: true,
};

const mockUserWithLongName: User = {
  id: "2",
  email: "verylongname@example.com",
  password: "password",
  name: "とても長い名前のユーザー山田花子田中",
  permissions: ["read", "write", "admin"],
  isActive: true,
  emailVerified: true,
};

export const WithSignedInUser: Story = {
  args: {
    signInUser: mockUser,
  },
};

export const WithoutSignedInUser: Story = {
  args: {
    signInUser: null,
  },
};

export const WithLongUserName: Story = {
  args: {
    signInUser: mockUserWithLongName,
  },
};
