import type { Meta, StoryObj } from '@storybook/react';
import DataTextItem from './index';

const meta: Meta<typeof DataTextItem> = {
  title: 'Molecules/DataTextItem',
  component: DataTextItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    record: {
      name: '田中太郎',
      email: 'tanaka@example.com',
      department: '開発部',
    },
    name: '名前',
    columnKey: 'name',
  },
};

export const Email: Story = {
  args: {
    record: {
      name: '田中太郎',
      email: 'tanaka@example.com',
      department: '開発部',
    },
    name: 'メールアドレス',
    columnKey: 'email',
  },
};

export const LongText: Story = {
  args: {
    record: {
      description: 'これは非常に長いテキストです。長いテキストがどのように表示されるかをテストしています。テキストが長い場合に改行が適切に行われるかを確認します。',
    },
    name: '説明',
    columnKey: 'description',
  },
};

export const EmptyValue: Story = {
  args: {
    record: {
      name: '田中太郎',
      email: '',
      department: '開発部',
    },
    name: 'メールアドレス',
    columnKey: 'email',
  },
};

export const UndefinedValue: Story = {
  args: {
    record: {
      name: '田中太郎',
      department: '開発部',
    },
    name: 'メールアドレス',
    columnKey: 'email',
  },
};

export const NumericValue: Story = {
  args: {
    record: {
      name: '田中太郎',
      age: 32,
      salary: 500000,
    },
    name: '年齢',
    columnKey: 'age',
  },
};

export const WithCustomClassName: Story = {
  args: {
    record: {
      status: 'アクティブ',
    },
    name: 'ステータス',
    columnKey: 'status',
    className: 'text-green-600 font-bold bg-green-50 px-2 py-1 rounded',
  },
};

export const JapaneseText: Story = {
  args: {
    record: {
      company: '株式会社サンプル',
      position: 'シニアソフトウェアエンジニア',
      location: '東京都渋谷区神南1-1-1',
    },
    name: '会社名',
    columnKey: 'company',
  },
};