import type { Meta, StoryObj } from "@storybook/nextjs";
import AppPageHeader from "./index";
import { Plus, Trash2, Settings, Download } from "lucide-react";
// Mock function for actions
const mockAction = async () => {
  console.log("Button action executed");
  await new Promise((resolve) => setTimeout(resolve, 500));
};

const meta: Meta<typeof AppPageHeader> = {
  title: "Molecules/AppPageHeader",
  component: AppPageHeader,
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
  { href: "/app", label: "ホーム" },
  { href: "/app/profile", label: "プロフィール" },
];

const projectBreadcrumbLinks = [
  { href: "/app", label: "ホーム" },
  { href: "/app/projects", label: "プロジェクト" },
  { href: "/app/projects/abc123", label: "ウェブサイトリニューアル" },
];

export const Default: Story = {
  args: {
    breadcrumbLinks,
    title: "プロフィール編集",
    buttons: [
      {
        href: "/app/profile/settings",
        label: "設定",
        variant: "primary",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
};

export const ProjectView: Story = {
  args: {
    breadcrumbLinks: projectBreadcrumbLinks,
    title: "ウェブサイトリニューアル",
    buttons: [
      {
        href: "/app/projects/abc123/tasks/new",
        label: "タスク追加",
        variant: "primary",
        icon: <Plus className="w-4 h-4" />,
      },
      {
        href: "/app/projects/abc123/export",
        label: "エクスポート",
        icon: <Download className="w-4 h-4" />,
      },
    ],
  },
};

export const WithActionButton: Story = {
  args: {
    breadcrumbLinks,
    title: "データ同期",
    buttons: [
      {
        action: mockAction,
        label: "同期実行",
        variant: "primary",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
};

export const WithoutButtons: Story = {
  args: {
    breadcrumbLinks,
    title: "アカウント情報",
  },
};

export const WithDangerAction: Story = {
  args: {
    breadcrumbLinks: [
      { href: "/app", label: "ホーム" },
      { href: "/app/account", label: "アカウント" },
    ],
    title: "アカウント削除",
    buttons: [
      {
        action: mockAction,
        label: "アカウントを削除",
        variant: "danger",
        icon: <Trash2 className="w-4 h-4" />,
      },
    ],
  },
};

export const SimpleBreadcrumb: Story = {
  args: {
    breadcrumbLinks: [{ href: "/app", label: "ホーム" }],
    title: "ダッシュボード",
    buttons: [
      {
        href: "/app/new",
        label: "新規作成",
        variant: "primary",
        icon: <Plus className="w-4 h-4" />,
      },
    ],
  },
};
