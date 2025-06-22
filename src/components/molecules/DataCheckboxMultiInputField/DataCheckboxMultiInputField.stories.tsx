import type { Meta, StoryObj } from '@storybook/nextjs';
import DataCheckboxMultiInputField from './index';
// Mock function for onChange handlers
const mockOnChange = (value: string[]) => {
  console.log('Checkbox changed:', value);
};

const meta: Meta<typeof DataCheckboxMultiInputField> = {
  title: 'Molecules/DataCheckboxMultiInputField',
  component: DataCheckboxMultiInputField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;


const skillsOptions = {
  options: [
    { name: 'JavaScript', value: 'javascript' },
    { name: 'TypeScript', value: 'typescript' },
    { name: 'React', value: 'react' },
    { name: 'Next.js', value: 'nextjs' },
    { name: 'Node.js', value: 'nodejs' },
    { name: 'Python', value: 'python' },
    { name: 'Java', value: 'java' },
    { name: 'PHP', value: 'php' },
  ],
};

const featuresOptions = {
  options: [
    { name: 'ユーザー管理', value: 'user_management' },
    { name: '権限制御', value: 'permission_control' },
    { name: 'データ分析', value: 'data_analytics' },
    { name: 'レポート生成', value: 'report_generation' },
    { name: 'API連携', value: 'api_integration' },
    { name: '通知機能', value: 'notification' },
  ],
};

const hobbyOptions = {
  options: [
    { name: '読書', value: 'reading' },
    { name: '映画鑑賞', value: 'movies' },
    { name: '音楽', value: 'music' },
    { name: 'スポーツ', value: 'sports' },
    { name: '旅行', value: 'travel' },
    { name: '料理', value: 'cooking' },
  ],
};

export const Skills: Story = {
  args: {
    name: 'スキル',
    data_key: 'skills',
    value: [],
    placeholder: 'スキルを選択してください',
    required: false,
    disabled: false,
    options: skillsOptions,
    onChange: mockOnChange,
  },
};

export const WithSelectedValues: Story = {
  args: {
    name: 'スキル',
    data_key: 'skills',
    value: ['javascript', 'react', 'nextjs'],
    placeholder: 'スキルを選択してください',
    required: false,
    disabled: false,
    options: skillsOptions,
    onChange: mockOnChange,
  },
};

export const Features: Story = {
  args: {
    name: '使用機能',
    data_key: 'features',
    value: ['user_management', 'data_analytics'],
    placeholder: '機能を選択',
    required: true,
    disabled: false,
    options: featuresOptions,
    onChange: mockOnChange,
  },
};

export const Hobbies: Story = {
  args: {
    name: '趣味',
    data_key: 'hobbies',
    value: [],
    placeholder: '趣味を選択（任意）',
    required: false,
    disabled: false,
    options: hobbyOptions,
    onChange: mockOnChange,
  },
};

export const Disabled: Story = {
  args: {
    name: 'スキル',
    data_key: 'skills',
    value: ['javascript', 'react'],
    placeholder: 'スキルを選択してください',
    required: false,
    disabled: true,
    options: skillsOptions,
    onChange: mockOnChange,
  },
};

export const Required: Story = {
  args: {
    name: '必須スキル',
    data_key: 'required_skills',
    value: [],
    placeholder: '最低1つは選択してください',
    required: true,
    disabled: false,
    options: {
      options: [
        { name: 'JavaScript', value: 'javascript' },
        { name: 'TypeScript', value: 'typescript' },
        { name: 'React', value: 'react' },
        { name: 'Vue.js', value: 'vue' },
      ],
    },
    onChange: mockOnChange,
  },
};

export const FewOptions: Story = {
  args: {
    name: '通知設定',
    data_key: 'notifications',
    value: ['email'],
    placeholder: '通知方法を選択',
    required: false,
    disabled: false,
    options: {
      options: [
        { name: 'メール', value: 'email' },
        { name: 'SMS', value: 'sms' },
        { name: 'プッシュ通知', value: 'push' },
      ],
    },
    onChange: mockOnChange,
  },
};

export const AllSelected: Story = {
  args: {
    name: 'スキル',
    data_key: 'skills',
    value: ['javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'python', 'java', 'php'],
    placeholder: 'スキルを選択してください',
    required: false,
    disabled: false,
    options: skillsOptions,
    onChange: mockOnChange,
  },
};