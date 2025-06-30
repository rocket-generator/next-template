import type { Meta, StoryObj } from "@storybook/nextjs";
import AdminPageHeader from "./index";
import { Plus, Trash2, Settings, Download } from "lucide-react";
// Mock function for actions
const mockAction = async () => {
  console.log("Button action executed");
  await new Promise((resolve) => setTimeout(resolve, 500));
};

const meta: Meta<typeof AdminPageHeader> = {
  title: "Molecules/AdminPageHeader",
  component: AdminPageHeader,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const breadcrumbLinks = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/users", label: "ユーザー管理" },
];

const deepBreadcrumbLinks = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/settings", label: "設定" },
  { href: "/admin/settings/general", label: "一般設定" },
  { href: "/admin/settings/general/notifications", label: "通知設定" },
];

export const Default: Story = {
  args: {
    breadcrumbLinks,
    title: "ユーザー一覧",
    buttons: [
      {
        href: "/admin/users/new",
        label: "新規作成",
        variant: "primary",
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
};

export const WithMultipleButtons: Story = {
  args: {
    breadcrumbLinks,
    title: "ユーザー管理",
    buttons: [
      {
        href: "/admin/users/new",
        label: "新規作成",
        variant: "primary",
        icon: <Plus className="w-4 h-4" />,
      },
      {
        href: "/admin/users/export",
        label: "エクスポート",
        icon: <Download className="w-4 h-4" />,
      },
      {
        action: mockAction,
        label: "一括削除",
        variant: "danger",
        icon: <Trash2 className="w-4 h-4" />,
      },
    ],
  },
};

export const WithActionButton: Story = {
  args: {
    breadcrumbLinks,
    title: "システム設定",
    buttons: [
      {
        action: mockAction,
        label: "設定保存",
        variant: "primary",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
};

export const WithDeepBreadcrumbs: Story = {
  args: {
    breadcrumbLinks: deepBreadcrumbLinks,
    title: "通知設定",
    buttons: [
      {
        href: "/admin/settings/general/notifications/new",
        label: "新規通知",
        variant: "primary",
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
};

export const WithoutButtons: Story = {
  args: {
    breadcrumbLinks,
    title: "ユーザー詳細",
  },
};

export const WithDangerButton: Story = {
  args: {
    breadcrumbLinks: [
      { href: "/admin", label: "ダッシュボード" },
      { href: "/admin/users", label: "ユーザー管理" },
      { href: "/admin/users/123", label: "田中太郎" },
    ],
    title: "ユーザー削除確認",
    buttons: [
      {
        action: mockAction,
        label: "ユーザーを削除",
        variant: "danger",
        icon: <Trash2 className="w-4 h-4" />,
      },
    ],
  },
};

export const LongTitle: Story = {
  args: {
    breadcrumbLinks,
    title: "とても長いタイトルのページでUIが崩れないかテストするためのページ",
    buttons: [
      {
        href: "/admin/test",
        label: "操作ボタン",
        variant: "primary",
      },
    ],
  },
};
