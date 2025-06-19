import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './index';

const meta: Meta<typeof DataTable> = {
  title: 'Organisms/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const userTableData = [
  {
    id: '1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    department: '開発部',
    position: 'シニアエンジニア',
    age: 32,
    joinDate: 1640991600, // 2022-01-01
    isActive: true,
    profileUrl: 'https://example.com/profile/tanaka',
  },
  {
    id: '2',
    name: '山田花子',
    email: 'yamada@example.com',
    department: '営業部',
    position: 'マネージャー',
    age: 28,
    joinDate: 1609459200, // 2021-01-01
    isActive: true,
    profileUrl: 'https://example.com/profile/yamada',
  },
  {
    id: '3',
    name: '佐藤次郎',
    email: 'sato@example.com',
    department: 'マーケティング部',
    position: 'アシスタント',
    age: 25,
    joinDate: 1672531200, // 2023-01-01
    isActive: false,
    profileUrl: 'https://example.com/profile/sato',
  },
  {
    id: '4',
    name: '鈴木三郎',
    email: 'suzuki@example.com',
    department: '人事部',
    position: 'ディレクター',
    age: 35,
    joinDate: 1577836800, // 2020-01-01
    isActive: true,
    profileUrl: 'https://example.com/profile/suzuki',
  },
];

const userTableStructure = [
  { name: '名前', key: 'name', type: 'text', options: {}, isSortable: true },
  { name: 'メール', key: 'email', type: 'text', options: {}, isSortable: true },
  { name: '部署', key: 'department', type: 'text', options: {}, isSortable: true },
  { name: '役職', key: 'position', type: 'text', options: {}, isSortable: false },
  { name: '年齢', key: 'age', type: 'text', options: {}, isSortable: true },
  { name: '入社日', key: 'joinDate', type: 'datetime', options: {}, isSortable: true },
  { name: 'アクティブ', key: 'isActive', type: 'boolean', options: {}, isSortable: false },
  { name: 'プロフィール', key: 'profileUrl', type: 'link', options: {}, isSortable: false },
];

const productTableData = [
  {
    id: 'P001',
    name: 'MacBook Pro 16インチ',
    category: 'ノートパソコン',
    price: 398000,
    manufacturer: 'Apple',
    inStock: true,
    releaseDate: 1697587200, // 2023-10-18
    specs: {
      cpu: 'M3 Pro',
      memory: '32GB',
      storage: '1TB SSD',
    },
  },
  {
    id: 'P002',
    name: 'iPhone 15 Pro',
    category: 'スマートフォン',
    price: 159800,
    manufacturer: 'Apple',
    inStock: false,
    releaseDate: 1695081600, // 2023-09-19
    specs: {
      cpu: 'A17 Pro',
      memory: '8GB',
      storage: '256GB',
    },
  },
  {
    id: 'P003',
    name: 'Surface Laptop 5',
    category: 'ノートパソコン',
    price: 179800,
    manufacturer: 'Microsoft',
    inStock: true,
    releaseDate: 1665705600, // 2022-10-14
    specs: {
      cpu: 'Intel Core i7',
      memory: '16GB',
      storage: '512GB SSD',
    },
  },
];

const productTableStructure = [
  { name: '商品名', key: 'name', type: 'text', options: {}, isSortable: true },
  { name: 'カテゴリ', key: 'category', type: 'text', options: {}, isSortable: true },
  { name: '価格', key: 'price', type: 'text', options: { suffix: '円' }, isSortable: true },
  { name: 'メーカー', key: 'manufacturer', type: 'text', options: {}, isSortable: true },
  { name: '在庫', key: 'inStock', type: 'boolean', options: {}, isSortable: false },
  { name: '発売日', key: 'releaseDate', type: 'datetime', options: {}, isSortable: true },
];

export const UserTable: Story = {
  args: {
    count: 25,
    offset: 0,
    limit: 10,
    data: userTableData,
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const ProductTable: Story = {
  args: {
    count: 15,
    offset: 0,
    limit: 10,
    data: productTableData,
    structure: productTableStructure,
    basePath: '/admin/products',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const WithSearchQuery: Story = {
  args: {
    count: 12,
    offset: 0,
    limit: 10,
    query: '田中',
    data: [userTableData[0]], // 検索結果として1件のみ表示
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const SortedByAge: Story = {
  args: {
    count: 25,
    offset: 0,
    limit: 10,
    order: 'age',
    direction: 'desc',
    data: [...userTableData].sort((a, b) => b.age - a.age),
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const WithoutActions: Story = {
  args: {
    count: 25,
    offset: 0,
    limit: 10,
    data: userTableData,
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: false,
    showPencilSquareIcon: false,
  },
};

export const ViewOnlyActions: Story = {
  args: {
    count: 25,
    offset: 0,
    limit: 10,
    data: userTableData,
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: false,
  },
};

export const EmptyTable: Story = {
  args: {
    count: 0,
    offset: 0,
    limit: 10,
    data: [],
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const MinimalTable: Story = {
  args: {
    count: 3,
    offset: 0,
    limit: 10,
    data: [
      { id: '1', name: 'テストユーザー1', status: 'アクティブ' },
      { id: '2', name: 'テストユーザー2', status: '非アクティブ' },
      { id: '3', name: 'テストユーザー3', status: 'アクティブ' },
    ],
    structure: [
      { name: '名前', key: 'name', type: 'text', options: {}, isSortable: true },
      { name: 'ステータス', key: 'status', type: 'text', options: {}, isSortable: false },
    ],
    basePath: '/admin/simple',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};

export const SecondPage: Story = {
  args: {
    count: 25,
    offset: 10,
    limit: 10,
    data: userTableData,
    structure: userTableStructure,
    basePath: '/admin/users',
    showEyeIcon: true,
    showPencilSquareIcon: true,
  },
};