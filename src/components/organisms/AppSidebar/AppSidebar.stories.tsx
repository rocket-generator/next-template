import type { Meta, StoryObj } from "@storybook/nextjs";
import AppSidebar from "./index";
import { User } from "@/models/user";

const meta: Meta<typeof AppSidebar> = {
  title: "Organisms/AppSidebar",
  component: AppSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser: User = {
  id: "user-1",
  name: "山田太郎",
  email: "yamada@example.com",
  password: "hashedpassword",
  permissions: ["user"],
  isActive: true,
  emailVerified: true,
  avatarKey: undefined,
};

const mockMenuItems = [
  {
    icon: <div className="w-5 h-5 bg-blue-500 rounded" />,
    label: "ダッシュボード",
    href: "/dashboard",
  },
  {
    icon: <div className="w-5 h-5 bg-green-500 rounded" />,
    label: "設定",
    href: "/settings",
  },
];

export const Default: Story = {
  args: {
    signInUser: mockUser,
    menuItems: mockMenuItems,
    title: "アプリケーション",
    onSignOut: () => console.log("Sign out clicked"),
  },
};

export const WithoutUser: Story = {
  args: {
    signInUser: null,
    menuItems: mockMenuItems,
    title: "アプリケーション",
    onSignOut: () => console.log("Sign out clicked"),
  },
};

export const WithLongUserName: Story = {
  args: {
    signInUser: {
      ...mockUser,
      name: "とても長い名前を持つユーザー",
    },
    menuItems: mockMenuItems,
    title: "アプリケーション",
    onSignOut: () => console.log("Sign out clicked"),
  },
};

export const WithManyMenuItems: Story = {
  args: {
    signInUser: mockUser,
    menuItems: [
      ...mockMenuItems,
      {
        icon: <div className="w-5 h-5 bg-red-500 rounded" />,
        label: "レポート",
        href: "/reports",
      },
      {
        icon: <div className="w-5 h-5 bg-yellow-500 rounded" />,
        label: "分析",
        href: "/analytics",
      },
    ],
    title: "アプリケーション",
    onSignOut: () => console.log("Sign out clicked"),
  },
};
