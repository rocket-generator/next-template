import type { Meta, StoryObj } from '@storybook/nextjs';
import DataSelectSingleInputField from './index';
// Mock function for onChange handlers
const mockOnChange = (value: string) => {
  console.log('Select changed:', value);
};

const meta: Meta<typeof DataSelectSingleInputField> = {
  title: 'Molecules/DataSelectSingleInputField',
  component: DataSelectSingleInputField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;


const departmentOptions = {
  options: [
    { name: '開発部', value: 'engineering' },
    { name: '営業部', value: 'sales' },
    { name: 'マーケティング部', value: 'marketing' },
    { name: '人事部', value: 'hr' },
    { name: '総務部', value: 'general_affairs' },
  ],
};

const categoryOptions = {
  options: [
    { name: 'ノートパソコン', value: 'laptop' },
    { name: 'デスクトップPC', value: 'desktop' },
    { name: 'タブレット', value: 'tablet' },
    { name: 'スマートフォン', value: 'smartphone' },
    { name: 'アクセサリー', value: 'accessory' },
  ],
};

const statusOptions = {
  options: [
    { name: 'アクティブ', value: 'active' },
    { name: '非アクティブ', value: 'inactive' },
    { name: '保留中', value: 'pending' },
    { name: '停止中', value: 'suspended' },
  ],
};

export const Department: Story = {
  args: {
    name: '部署',
    data_key: 'department',
    value: '',
    placeholder: '部署を選択してください',
    required: true,
    disabled: false,
    options: departmentOptions,
    onChange: mockOnChange,
  },
};

export const WithSelectedValue: Story = {
  args: {
    name: '部署',
    data_key: 'department',
    value: 'engineering',
    placeholder: '部署を選択してください',
    required: true,
    disabled: false,
    options: departmentOptions,
    onChange: mockOnChange,
  },
};

export const Category: Story = {
  args: {
    name: 'カテゴリ',
    data_key: 'category',
    value: '',
    placeholder: 'カテゴリを選択',
    required: true,
    disabled: false,
    options: categoryOptions,
    onChange: mockOnChange,
  },
};

export const Status: Story = {
  args: {
    name: 'ステータス',
    data_key: 'status',
    value: 'active',
    placeholder: 'ステータスを選択',
    required: true,
    disabled: false,
    options: statusOptions,
    onChange: mockOnChange,
  },
};

export const Disabled: Story = {
  args: {
    name: '部署',
    data_key: 'department',
    value: 'engineering',
    placeholder: '部署を選択してください',
    required: true,
    disabled: true,
    options: departmentOptions,
    onChange: mockOnChange,
  },
};

export const Optional: Story = {
  args: {
    name: '優先度',
    data_key: 'priority',
    value: '',
    placeholder: '優先度を選択（任意）',
    required: false,
    disabled: false,
    options: {
      options: [
        { name: '高', value: 'high' },
        { name: '中', value: 'medium' },
        { name: '低', value: 'low' },
      ],
    },
    onChange: mockOnChange,
  },
};

export const FewOptions: Story = {
  args: {
    name: 'タイプ',
    data_key: 'type',
    value: '',
    placeholder: 'タイプを選択',
    required: true,
    disabled: false,
    options: {
      options: [
        { name: '個人', value: 'individual' },
        { name: '法人', value: 'corporate' },
      ],
    },
    onChange: mockOnChange,
  },
};

export const ManyOptions: Story = {
  args: {
    name: '都道府県',
    data_key: 'prefecture',
    value: '',
    placeholder: '都道府県を選択',
    required: true,
    disabled: false,
    options: {
      options: [
        { name: '北海道', value: 'hokkaido' },
        { name: '青森県', value: 'aomori' },
        { name: '岩手県', value: 'iwate' },
        { name: '宮城県', value: 'miyagi' },
        { name: '秋田県', value: 'akita' },
        { name: '山形県', value: 'yamagata' },
        { name: '福島県', value: 'fukushima' },
        { name: '茨城県', value: 'ibaraki' },
        { name: '栃木県', value: 'tochigi' },
        { name: '群馬県', value: 'gunma' },
        { name: '埼玉県', value: 'saitama' },
        { name: '千葉県', value: 'chiba' },
        { name: '東京都', value: 'tokyo' },
        { name: '神奈川県', value: 'kanagawa' },
        { name: '新潟県', value: 'niigata' },
        { name: '富山県', value: 'toyama' },
        { name: '石川県', value: 'ishikawa' },
        { name: '福井県', value: 'fukui' },
        { name: '山梨県', value: 'yamanashi' },
        { name: '長野県', value: 'nagano' },
        { name: '岐阜県', value: 'gifu' },
        { name: '静岡県', value: 'shizuoka' },
        { name: '愛知県', value: 'aichi' },
        { name: '三重県', value: 'mie' },
        { name: '滋賀県', value: 'shiga' },
        { name: '京都府', value: 'kyoto' },
        { name: '大阪府', value: 'osaka' },
        { name: '兵庫県', value: 'hyogo' },
        { name: '奈良県', value: 'nara' },
        { name: '和歌山県', value: 'wakayama' },
        { name: '鳥取県', value: 'tottori' },
        { name: '島根県', value: 'shimane' },
        { name: '岡山県', value: 'okayama' },
        { name: '広島県', value: 'hiroshima' },
        { name: '山口県', value: 'yamaguchi' },
        { name: '徳島県', value: 'tokushima' },
        { name: '香川県', value: 'kagawa' },
        { name: '愛媛県', value: 'ehime' },
        { name: '高知県', value: 'kochi' },
        { name: '福岡県', value: 'fukuoka' },
        { name: '佐賀県', value: 'saga' },
        { name: '長崎県', value: 'nagasaki' },
        { name: '熊本県', value: 'kumamoto' },
        { name: '大分県', value: 'oita' },
        { name: '宮崎県', value: 'miyazaki' },
        { name: '鹿児島県', value: 'kagoshima' },
        { name: '沖縄県', value: 'okinawa' },
      ],
    },
    onChange: mockOnChange,
  },
};

export const WithError: Story = {
  args: {
    name: '部署',
    data_key: 'department',
    value: '',
    placeholder: '部署を選択してください',
    required: true,
    disabled: false,
    options: departmentOptions,
    onChange: mockOnChange,
    className: 'border-red-500 focus:ring-red-500',
  },
};