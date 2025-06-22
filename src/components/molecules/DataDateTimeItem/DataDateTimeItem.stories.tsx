import type { Meta, StoryObj } from '@storybook/nextjs';
import DataDateTimeItem from './index';

const meta: Meta<typeof DataDateTimeItem> = {
  title: 'Molecules/DataDateTimeItem',
  component: DataDateTimeItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentTime: Story = {
  args: {
    record: {
      createdAt: Math.floor(Date.now() / 1000), // 現在時刻のUnixタイムスタンプ
    },
    name: '作成日時',
    columnKey: 'createdAt',
    options: {},
  },
};

export const PastDate: Story = {
  args: {
    record: {
      joinDate: 1640991600, // 2022-01-01T00:00:00Z
    },
    name: '入社日',
    columnKey: 'joinDate',
    options: {},
  },
};

export const RecentDate: Story = {
  args: {
    record: {
      lastLogin: 1703980800, // 2023-12-30T00:00:00Z
    },
    name: '最終ログイン',
    columnKey: 'lastLogin',
    options: {},
  },
};

export const MorningTime: Story = {
  args: {
    record: {
      appointmentTime: 1704067200, // 2024-01-01T09:00:00Z
    },
    name: '予約時間',
    columnKey: 'appointmentTime',
    options: {},
  },
};

export const EveningTime: Story = {
  args: {
    record: {
      meetingTime: 1704135600, // 2024-01-01T22:00:00Z
    },
    name: '会議時間',
    columnKey: 'meetingTime',
    options: {},
  },
};

export const WithLabels: Story = {
  args: {
    record: {
      status: 'published',
    },
    name: 'ステータス',
    columnKey: 'status',
    options: {
      labels: {
        draft: '下書き',
        published: '公開済み',
        archived: 'アーカイブ済み',
      },
    },
  },
};

export const FutureDate: Story = {
  args: {
    record: {
      deadline: 1735689600, // 2025-01-01T00:00:00Z
    },
    name: '期限',
    columnKey: 'deadline',
    options: {},
  },
};

export const Midnight: Story = {
  args: {
    record: {
      backupTime: 1704067200, // 2024-01-01T00:00:00Z (midnight)
    },
    name: 'バックアップ時間',
    columnKey: 'backupTime',
    options: {},
  },
};