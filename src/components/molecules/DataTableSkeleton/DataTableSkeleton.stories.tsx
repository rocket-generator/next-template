import type { Meta, StoryObj } from '@storybook/nextjs';
import DataTableSkeleton from './index';

const meta: Meta<typeof DataTableSkeleton> = {
  title: 'Molecules/DataTableSkeleton',
  component: DataTableSkeleton,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columnCount: 5,
    rowCount: 5,
  },
};

export const WideTable: Story = {
  args: {
    columnCount: 8,
    rowCount: 5,
  },
};

export const NarrowTable: Story = {
  args: {
    columnCount: 3,
    rowCount: 5,
  },
};

export const FewRows: Story = {
  args: {
    columnCount: 5,
    rowCount: 2,
  },
};

export const ManyRows: Story = {
  args: {
    columnCount: 5,
    rowCount: 10,
  },
};

export const MinimalTable: Story = {
  args: {
    columnCount: 2,
    rowCount: 1,
  },
};

export const LargeTable: Story = {
  args: {
    columnCount: 10,
    rowCount: 15,
  },
};