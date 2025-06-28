import type { Meta, StoryObj } from "@storybook/nextjs";
import DataTextInputField from "./index";
// Mock function for onChange handlers
const mockOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log("Input changed:", event.target.value);
};

const meta: Meta<typeof DataTextInputField> = {
  title: "Molecules/DataTextInputField",
  component: DataTextInputField,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  args: {
    name: "名前",
    data_key: "name",
    type: "text",
    value: "",
    placeholder: "田中太郎",
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const EmailInput: Story = {
  args: {
    name: "メールアドレス",
    data_key: "email",
    type: "email",
    value: "",
    placeholder: "example@company.com",
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const PasswordInput: Story = {
  args: {
    name: "パスワード",
    data_key: "password",
    type: "password",
    value: "",
    placeholder: "8文字以上",
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const NumberInput: Story = {
  args: {
    name: "年齢",
    data_key: "age",
    type: "number",
    value: "",
    placeholder: "25",
    required: false,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const WithValue: Story = {
  args: {
    name: "会社名",
    data_key: "company",
    type: "text",
    value: "株式会社サンプル",
    placeholder: "会社名を入力",
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const Disabled: Story = {
  args: {
    name: "ユーザーID",
    data_key: "userId",
    type: "text",
    value: "USER-123",
    placeholder: "ユーザーID",
    required: true,
    disabled: true,
    options: {},
    onChange: mockOnChange,
  },
};

export const Optional: Story = {
  args: {
    name: "電話番号",
    data_key: "phone",
    type: "tel",
    value: "",
    placeholder: "090-1234-5678",
    required: false,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const WithError: Story = {
  args: {
    name: "名前",
    data_key: "name",
    type: "text",
    value: "",
    placeholder: "田中太郎",
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
    className: "border-red-500 focus:ring-red-500",
  },
};

export const URLInput: Story = {
  args: {
    name: "ウェブサイト",
    data_key: "website",
    type: "url",
    value: "",
    placeholder: "https://example.com",
    required: false,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const SearchInput: Story = {
  args: {
    name: "検索",
    data_key: "search",
    type: "search",
    value: "",
    placeholder: "キーワードを入力",
    required: false,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};
