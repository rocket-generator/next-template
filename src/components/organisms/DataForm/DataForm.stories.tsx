import type { Meta, StoryObj } from '@storybook/nextjs';
import DataForm from './index';
// Mock function for form submission
const mockSubmitAction = async (data: Record<string, unknown>) => {
  console.log('Form submitted with data:', data);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation
  return true;
};

// Default submit action for stories without submitAction
const defaultSubmitAction = async (data: Record<string, unknown>) => {
  console.log('Default form submission:', data);
  return true;
};

const meta: Meta<typeof DataForm> = {
  title: 'Organisms/DataForm',
  component: DataForm,
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


const userRegistrationStructure: Array<{
  name: string;
  key: string;
  type: string;
  value: string | number | boolean | string[] | undefined;
  required: boolean;
  placeholder: string;
  options?: {
    options?: Array<{ value: string; name: string }>;
    choices?: Array<{ value: string; label: string }>;
  };
}> = [
  {
    name: '名前',
    key: 'name',
    type: 'text',
    value: '',
    required: true,
    placeholder: '田中太郎',
  },
  {
    name: 'メールアドレス',
    key: 'email',
    type: 'text',
    value: '',
    required: true,
    placeholder: 'tanaka@example.com',
  },
  {
    name: 'パスワード',
    key: 'password',
    type: 'password',
    value: '',
    required: true,
    placeholder: '8文字以上',
  },
  {
    name: '年齢',
    key: 'age',
    type: 'number',
    value: '',
    required: false,
    placeholder: '25',
  },
  {
    name: '部署',
    key: 'department',
    type: 'select_single',
    value: '',
    required: true,
    placeholder: '部署を選択',
    options: {
      options: [
        { value: 'engineering', name: '開発部' },
        { value: 'sales', name: '営業部' },
        { value: 'marketing', name: 'マーケティング部' },
        { value: 'hr', name: '人事部' },
      ],
    },
  },
  {
    name: 'スキル',
    key: 'skills',
    type: 'checkbox_multi',
    value: [],
    required: false,
    placeholder: 'スキルを選択',
    options: {
      options: [
        { value: 'javascript', name: 'JavaScript' },
        { value: 'typescript', name: 'TypeScript' },
        { value: 'react', name: 'React' },
        { value: 'nextjs', name: 'Next.js' },
        { value: 'nodejs', name: 'Node.js' },
      ],
    },
  },
  {
    name: '入社日',
    key: 'joinDate',
    type: 'datetime',
    value: undefined,
    required: true,
    placeholder: '入社日を選択',
  },
];

const productCreationStructure: Array<{
  name: string;
  key: string;
  type: string;
  value: string | number | boolean | string[] | undefined;
  required: boolean;
  placeholder: string;
  options?: {
    options?: Array<{ value: string; name: string }>;
    choices?: Array<{ value: string; label: string }>;
  };
}> = [
  {
    name: '商品名',
    key: 'name',
    type: 'text',
    value: '',
    required: true,
    placeholder: 'MacBook Pro 16インチ',
  },
  {
    name: '商品説明',
    key: 'description',
    type: 'text',
    value: '',
    required: false,
    placeholder: '商品の詳細説明',
  },
  {
    name: '価格',
    key: 'price',
    type: 'number',
    value: '',
    required: true,
    placeholder: '398000',
  },
  {
    name: 'カテゴリ',
    key: 'category',
    type: 'select_single',
    value: '',
    required: true,
    placeholder: 'カテゴリを選択',
    options: {
      options: [
        { value: 'laptop', name: 'ノートパソコン' },
        { value: 'desktop', name: 'デスクトップPC' },
        { value: 'tablet', name: 'タブレット' },
        { value: 'smartphone', name: 'スマートフォン' },
      ],
    },
  },
  {
    name: '対応OS',
    key: 'supportedOS',
    type: 'checkbox_multi',
    value: [],
    required: false,
    placeholder: '対応OSを選択',
    options: {
      options: [
        { value: 'windows', name: 'Windows' },
        { value: 'macos', name: 'macOS' },
        { value: 'linux', name: 'Linux' },
        { value: 'ios', name: 'iOS' },
        { value: 'android', name: 'Android' },
      ],
    },
  },
];

export const UserRegistrationForm: Story = {
  args: {
    structure: userRegistrationStructure,
    submitAction: mockSubmitAction,
  },
};

export const ProductCreationForm: Story = {
  args: {
    structure: productCreationStructure,
    submitAction: mockSubmitAction,
  },
};

export const EditUserForm: Story = {
  args: {
    structure: [
      {
        name: '名前',
        key: 'name',
        type: 'text',
        value: '田中太郎',
        required: true,
        placeholder: '名前を入力',
      },
      {
        name: 'メールアドレス',
        key: 'email',
        type: 'text',
        value: 'tanaka@example.com',
        required: true,
        placeholder: 'メールアドレスを入力',
      },
      {
        name: '部署',
        key: 'department',
        type: 'select_single',
        value: 'engineering',
        required: true,
        placeholder: '部署を選択',
        options: {
          options: [
            { value: 'engineering', name: '開発部' },
            { value: 'sales', name: '営業部' },
            { value: 'marketing', name: 'マーケティング部' },
          ],
        },
      },
      {
        name: 'スキル',
        key: 'skills',
        type: 'checkbox_multi',
        value: ['javascript', 'react'],
        required: false,
        placeholder: 'スキルを選択',
        options: {
          options: [
            { value: 'javascript', name: 'JavaScript' },
            { value: 'typescript', name: 'TypeScript' },
            { value: 'react', name: 'React' },
            { value: 'vue', name: 'Vue.js' },
          ],
        },
      },
    ],
    submitAction: mockSubmitAction,
  },
};

export const FormWithoutSubmitAction: Story = {
  args: {
    structure: [
      {
        name: 'タイトル',
        key: 'title',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'タイトルを入力',
      },
      {
        name: '説明',
        key: 'description',
        type: 'text',
        value: '',
        required: false,
        placeholder: '説明を入力',
      },
    ],
    submitAction: defaultSubmitAction,
  },
};

export const MinimalForm: Story = {
  args: {
    structure: [
      {
        name: 'メッセージ',
        key: 'message',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'メッセージを入力してください',
      },
    ],
    submitAction: mockSubmitAction,
  },
};

export const FormWithAllFieldTypes: Story = {
  args: {
    structure: [
      {
        name: 'テキスト',
        key: 'text',
        type: 'text',
        value: 'サンプルテキスト',
        required: true,
        placeholder: 'テキストを入力',
      },
      {
        name: 'パスワード',
        key: 'password',
        type: 'password',
        value: '',
        required: true,
        placeholder: 'パスワードを入力',
      },
      {
        name: '数値',
        key: 'number',
        type: 'number',
        value: '100',
        required: false,
        placeholder: '数値を入力',
      },
      {
        name: 'セレクト',
        key: 'select',
        type: 'select_single',
        value: 'option2',
        required: true,
        placeholder: '選択してください',
        options: {
          options: [
            { value: 'option1', name: 'オプション1' },
            { value: 'option2', name: 'オプション2' },
            { value: 'option3', name: 'オプション3' },
          ],
        },
      },
      {
        name: 'チェックボックス',
        key: 'checkbox',
        type: 'checkbox_multi',
        value: ['check1', 'check3'],
        required: false,
        placeholder: 'チェックボックス',
        options: {
          options: [
            { value: 'check1', name: 'チェック1' },
            { value: 'check2', name: 'チェック2' },
            { value: 'check3', name: 'チェック3' },
          ],
        },
      },
      {
        name: '日時',
        key: 'datetime',
        type: 'datetime',
        value: undefined,
        required: false,
        placeholder: '日時を選択',
      },
    ],
    submitAction: mockSubmitAction,
  },
};