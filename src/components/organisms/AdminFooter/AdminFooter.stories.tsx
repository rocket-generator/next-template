import type { Meta, StoryObj } from '@storybook/react';
import AdminFooter from './index';

const meta: Meta<typeof AdminFooter> = {
  title: 'Organisms/AdminFooter',
  component: AdminFooter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};