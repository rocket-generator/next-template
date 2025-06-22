import type { Meta, StoryObj } from '@storybook/nextjs';
import SideMenu from './index';
import { Home, Users, Settings, FileText, BarChart3, Shield } from 'lucide-react';

const meta: Meta<typeof SideMenu> = {
  title: 'Organisms/SideMenu',
  component: SideMenu,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
        <div style={{ flex: 1, padding: '20px', backgroundColor: '#f5f5f5' }}>
          <h1>メインコンテンツエリア</h1>
          <p>サイドメニューの動作を確認するためのメインコンテンツです。</p>
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultMenuItems = [
  {
    icon: <Home className="w-5 h-5" />,
    label: 'ダッシュボード',
    href: '/dashboard',
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'ユーザー管理',
    href: '/users',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    label: 'ドキュメント',
    href: '/documents',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: '分析・レポート',
    href: '/analytics',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: '設定',
    href: '/settings',
  },
];

export const Default: Story = {
  args: {
    title: 'Admin Panel',
    menuItems: defaultMenuItems,
    icon: <Shield className="w-8 h-8 text-blue-600" />,
  },
};

export const WithoutIcon: Story = {
  args: {
    title: 'システム管理',
    menuItems: defaultMenuItems,
  },
};

export const FewItems: Story = {
  args: {
    title: 'Simple App',
    menuItems: [
      {
        icon: <Home className="w-5 h-5" />,
        label: 'ホーム',
        href: '/home',
      },
      {
        icon: <Settings className="w-5 h-5" />,
        label: '設定',
        href: '/settings',
      },
    ],
  },
};

export const LongTitle: Story = {
  args: {
    title: 'とても長いアプリケーション名システム',
    menuItems: defaultMenuItems,
    icon: <BarChart3 className="w-8 h-8 text-green-600" />,
  },
};