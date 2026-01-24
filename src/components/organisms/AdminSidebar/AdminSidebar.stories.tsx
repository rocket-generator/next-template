import type { Meta, StoryObj } from "@storybook/nextjs";
import { Users, Settings, Home, BarChart2, CheckCircle } from "lucide-react";
import AdminSidebar from "./index";
import { SidebarProvider, SidebarTrigger } from "@/components/atoms/sidebar";
import { SERVICE_NAME } from "@/constants/site";

const meta = {
  title: "Organisms/AdminSidebar",
  component: AdminSidebar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SidebarProvider>
        <div className="flex h-screen">
          <Story />
          <div className="flex-1 bg-gray-50">
            <header className="flex items-center gap-3 border-b px-4 py-3">
              <SidebarTrigger className="md:hidden" label="サイドバーを開く" />
              <span className="text-lg font-semibold">
                {`${SERVICE_NAME} Admin`}
              </span>
            </header>
            <div className="p-4">
              <h1>Main Content Area</h1>
              <p>
                This is the main content area to demonstrate the sidebar layout.
              </p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    ),
  ],
  argTypes: {
    onSignOut: { action: "signedOut" },
    title: { control: "text" },
    icon: { control: false },
    menuItems: { control: false },
    signInUser: { control: false },
  },
  args: {
    onSignOut: () => console.log("Sign out clicked"),
  },
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockMenuItems = [
  {
    icon: <Home className="h-4 w-4" />,
    label: "ダッシュボード",
    href: "/admin/dashboard",
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: "ユーザー",
    href: "/admin/users",
  },
  {
    icon: <BarChart2 className="h-4 w-4" />,
    label: "統計",
    href: "/admin/statistics",
  },
  {
    icon: <Settings className="h-4 w-4" />,
    label: "設定",
    href: "/admin/settings",
  },
];

const mockUser = {
  id: "1",
  name: "管理者 太郎",
  email: "admin@example.com",
  password: "hashed_password",
  permissions: ["admin"],
  isActive: true,
  emailVerified: true,
};

// 基本的な使用例
export const Default: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// アイコンなしのバリエーション
export const WithoutIcon: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// 異なるタイトルとアイコン
export const CustomTitleAndIcon: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "管理コンソール",
    icon: <Settings className="w-8 h-8 text-green-600" />,
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// ユーザー情報が少ない場合
export const MinimalUser: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: {
      id: "2",
      name: "A",
      email: "a@example.com",
      password: "hashed_password",
      permissions: ["admin"],
      isActive: true,
      emailVerified: true,
    },
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// ユーザー情報がnullの場合
export const NoUser: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: null,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// 少ないメニュー項目
export const FewMenuItems: Story = {
  args: {
    menuItems: [
      {
        icon: <Home className="h-4 w-4" />,
        label: "ダッシュボード",
        href: "/admin/dashboard",
      },
      {
        icon: <Users className="h-4 w-4" />,
        label: "ユーザー",
        href: "/admin/users",
      },
    ],
    title: "Simple Admin",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// 多くのメニュー項目
export const ManyMenuItems: Story = {
  args: {
    menuItems: [
      {
        icon: <Home className="h-4 w-4" />,
        label: "ダッシュボード",
        href: "/admin/dashboard",
      },
      {
        icon: <Users className="h-4 w-4" />,
        label: "ユーザー管理",
        href: "/admin/users",
      },
      {
        icon: <BarChart2 className="h-4 w-4" />,
        label: "統計とレポート",
        href: "/admin/statistics",
      },
      {
        icon: <Settings className="h-4 w-4" />,
        label: "システム設定",
        href: "/admin/settings",
      },
      {
        icon: <CheckCircle className="h-4 w-4" />,
        label: "監査ログ",
        href: "/admin/audit",
      },
      {
        icon: <Users className="h-4 w-4" />,
        label: "権限管理",
        href: "/admin/permissions",
      },
    ],
    title: "Full Admin Panel",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// 長いタイトル
export const LongTitle: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "非常に長いタイトルの管理パネル",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: mockUser,
    onSignOut: () => console.log("Sign out clicked"),
  },
};

// 長いユーザー名
export const LongUserName: Story = {
  args: {
    menuItems: mockMenuItems,
    title: "Admin Panel",
    icon: <CheckCircle className="h-4 w-4 text-blue-600" />,
    signInUser: {
      id: "3",
      name: "非常に長い名前のユーザーさん",
      email: "very-long-name-user@example.com",
      password: "hashed_password",
      permissions: ["admin"],
      isActive: true,
      emailVerified: true,
    },
    onSignOut: () => console.log("Sign out clicked"),
  },
};
