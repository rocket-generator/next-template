import type { Meta, StoryObj } from '@storybook/react';
import SearchForm from './index';

const meta: Meta<typeof SearchForm> = {
  title: 'Molecules/SearchForm',
  component: SearchForm,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          検索フォーム
        </h3>
        <Story />
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          Enterキーで検索が実行されます（実際のナビゲーションは行われません）
        </p>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultValue: '',
  },
};

export const WithDefaultValue: Story = {
  args: {
    defaultValue: 'JavaScript',
  },
};

export const UserSearch: Story = {
  args: {
    defaultValue: '田中',
  },
};

export const ProductSearch: Story = {
  args: {
    defaultValue: 'MacBook',
  },
};

export const EmailSearch: Story = {
  args: {
    defaultValue: 'example@company.com',
  },
};

export const NumberSearch: Story = {
  args: {
    defaultValue: '12345',
  },
};

export const LongSearch: Story = {
  args: {
    defaultValue: 'とても長い検索キーワードでフォームの表示を確認',
  },
};

export const EmptySearch: Story = {
  args: {
    defaultValue: '',
  },
};