import type { Meta, StoryObj } from '@storybook/nextjs';
import HeaderUserMenu from './index';
import type { User } from '@/models/user';

const meta: Meta<typeof HeaderUserMenu> = {
  title: 'Molecules/HeaderUserMenu',
  component: HeaderUserMenu,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '200px', display: 'flex', justifyContent: 'flex-end', paddingTop: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser: User = {
  id: '1',
  email: 'tanaka@example.com',
  password: 'password',
  name: '田中太郎',
  permissions: ['read', 'write'],
};

const mockAdminUser: User = {
  id: '2',
  email: 'admin@example.com',
  password: 'password',
  name: '管理者',
  permissions: ['read', 'write', 'admin', 'delete'],
};

const mockUserWithLongName: User = {
  id: '3',
  email: 'verylongname@example.com',
  password: 'password',
  name: 'とても長い名前のユーザー山田花子田中',
  permissions: ['read'],
};

const mockManagerUser: User = {
  id: '4',
  email: 'manager@example.com',
  password: 'password',
  name: '山田マネージャー',
  permissions: ['read', 'write', 'manage'],
};

export const WithUser: Story = {
  args: {
    signInUser: mockUser,
  },
};

export const WithAdmin: Story = {
  args: {
    signInUser: mockAdminUser,
  },
};

export const WithLongName: Story = {
  args: {
    signInUser: mockUserWithLongName,
  },
};

export const WithManager: Story = {
  args: {
    signInUser: mockManagerUser,
  },
};

export const WithoutUser: Story = {
  args: {
    signInUser: null,
  },
};