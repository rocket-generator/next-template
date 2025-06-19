import type { Meta, StoryObj } from '@storybook/react';
import DataDateTimeInputField from './index';
// Mock function for onChange handlers
const mockOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('DateTime changed:', event.target.value);
};

const meta: Meta<typeof DataDateTimeInputField> = {
  title: 'Molecules/DataDateTimeInputField',
  component: DataDateTimeInputField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;


export const EmptyDateTime: Story = {
  args: {
    name: '予約日時',
    data_key: 'appointmentTime',
    value: undefined,
    placeholder: '日時を選択してください',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const WithCurrentTime: Story = {
  args: {
    name: '作成日時',
    data_key: 'createdAt',
    value: Math.floor(Date.now() / 1000), // 現在時刻のUnixタイムスタンプ
    placeholder: '作成日時',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const PastDate: Story = {
  args: {
    name: '入社日',
    data_key: 'joinDate',
    value: 1640991600, // 2022-01-01T00:00:00Z
    placeholder: '入社日を選択',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const FutureDate: Story = {
  args: {
    name: '期限',
    data_key: 'deadline',
    value: 1735689600, // 2025-01-01T00:00:00Z
    placeholder: '期限を設定',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const MeetingTime: Story = {
  args: {
    name: '会議時間',
    data_key: 'meetingTime',
    value: 1704135600, // 2024-01-01T22:00:00Z
    placeholder: '会議時間を選択',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const Disabled: Story = {
  args: {
    name: '更新日時',
    data_key: 'updatedAt',
    value: Math.floor(Date.now() / 1000),
    placeholder: '更新日時',
    required: false,
    disabled: true,
    options: {},
    onChange: mockOnChange,
  },
};

export const Optional: Story = {
  args: {
    name: '備考日時',
    data_key: 'noteDate',
    value: undefined,
    placeholder: '日時を選択（任意）',
    required: false,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const BirthDate: Story = {
  args: {
    name: '生年月日',
    data_key: 'birthDate',
    value: 694310400, // 1992-01-01T00:00:00Z
    placeholder: '生年月日を選択',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};

export const EventStart: Story = {
  args: {
    name: 'イベント開始時刻',
    data_key: 'eventStart',
    value: 1704088800, // 2024-01-01T06:00:00Z
    placeholder: 'イベント開始時刻',
    required: true,
    disabled: false,
    options: {},
    onChange: mockOnChange,
  },
};