import type { Meta, StoryObj } from '@storybook/react';
import Header from '.';
import type { User } from '@/models/user';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  password: 'password',
  name: '田中太郎',
  permissions: ['read', 'write'],
};

const mockUserWithLongName: User = {
  id: '2',
  email: 'verylongname@example.com',
  password: 'password',
  name: 'とても長い名前のユーザー山田花子田中',
  permissions: ['read', 'write', 'admin'],
};

export const WithSignedInUser: Story = {
  args: {
    signInUser: mockUser,
  },
};

export const WithoutSignedInUser: Story = {
  args: {
    signInUser: null,
  },
};

export const WithLongUserName: Story = {
  args: {
    signInUser: mockUserWithLongName,
  },
};