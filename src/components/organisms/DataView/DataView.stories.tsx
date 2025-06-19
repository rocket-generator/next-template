import type { Meta, StoryObj } from '@storybook/react';
import DataView from './index';

const meta: Meta<typeof DataView> = {
  title: 'Organisms/DataView',
  component: DataView,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const userProfileData = {
  id: '1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  phone: '090-1234-5678',
  department: '開発部',
  position: 'シニアエンジニア',
  joinDate: 1640991600, // 2022-01-01T00:00:00Z in Unix timestamp
  isActive: true,
  profileUrl: 'https://example.com/profile/tanaka',
  address: {
    street: '東京都渋谷区神南1-1-1',
    city: '東京',
    zipCode: '150-0041',
  },
};

const userProfileStructure = [
  { name: 'ID', key: 'id', type: 'text' },
  { name: '名前', key: 'name', type: 'text' },
  { name: 'メールアドレス', key: 'email', type: 'text' },
  { name: '電話番号', key: 'phone', type: 'text' },
  { name: '部署', key: 'department', type: 'text' },
  { name: '役職', key: 'position', type: 'text' },
  { name: '入社日', key: 'joinDate', type: 'datetime' },
  { name: 'アクティブ', key: 'isActive', type: 'boolean' },
  { name: 'プロフィールURL', key: 'profileUrl', type: 'link' },
  { name: '住所', key: 'address.street', type: 'text' },
];

const productData = {
  id: 'P001',
  name: 'MacBook Pro 16インチ',
  description: '高性能なプロフェッショナル向けノートパソコン',
  price: 398000,
  category: 'ノートパソコン',
  manufacturer: 'Apple',
  inStock: true,
  releaseDate: 1697587200, // 2023-10-18T00:00:00Z
  specifications: {
    cpu: 'M3 Pro',
    memory: '32GB',
    storage: '1TB SSD',
  },
  supportUrl: 'https://support.apple.com/macbook-pro',
};

const productStructure = [
  { name: '商品ID', key: 'id', type: 'text' },
  { name: '商品名', key: 'name', type: 'text' },
  { name: '説明', key: 'description', type: 'text' },
  { name: '価格', key: 'price', type: 'text', options: { suffix: '円' } },
  { name: 'カテゴリ', key: 'category', type: 'text' },
  { name: 'メーカー', key: 'manufacturer', type: 'text' },
  { name: '在庫あり', key: 'inStock', type: 'boolean' },
  { name: '発売日', key: 'releaseDate', type: 'datetime' },
  { name: 'CPU', key: 'specifications.cpu', type: 'text' },
  { name: 'メモリ', key: 'specifications.memory', type: 'text' },
  { name: 'ストレージ', key: 'specifications.storage', type: 'text' },
  { name: 'サポートURL', key: 'supportUrl', type: 'link' },
];

export const UserProfile: Story = {
  args: {
    data: userProfileData,
    structure: userProfileStructure,
  },
};

export const ProductDetails: Story = {
  args: {
    data: productData,
    structure: productStructure,
  },
};

export const MinimalData: Story = {
  args: {
    data: {
      id: '001',
      title: 'シンプルなデータ',
      status: 'アクティブ',
    },
    structure: [
      { name: 'ID', key: 'id', type: 'text' },
      { name: 'タイトル', key: 'title', type: 'text' },
      { name: 'ステータス', key: 'status', type: 'text' },
    ],
  },
};

export const WithMissingData: Story = {
  args: {
    data: {
      id: '002',
      name: '山田花子',
      // email は意図的に省略
      isActive: false,
    },
    structure: [
      { name: 'ID', key: 'id', type: 'text' },
      { name: '名前', key: 'name', type: 'text' },
      { name: 'メールアドレス', key: 'email', type: 'text' },
      { name: 'アクティブ', key: 'isActive', type: 'boolean' },
      { name: '作成日', key: 'createdAt', type: 'datetime' },
      { name: 'ウェブサイト', key: 'website', type: 'link' },
    ],
  },
};