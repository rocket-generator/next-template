import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataBooleanItem from ".";

const meta: Meta<typeof DataBooleanItem> = {
  title: "Molecules/DataBooleanItem",
  component: DataBooleanItem,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TrueValue: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: true,
      hasPermission: true,
    },
    name: "アクティブ",
    columnKey: "isActive",
  },
};

export const FalseValue: Story = {
  args: {
    record: {
      isActive: false,
      isVerified: false,
      hasPermission: false,
    },
    name: "アクティブ",
    columnKey: "isActive",
  },
};

export const Verified: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: true,
      hasPermission: false,
    },
    name: "認証済み",
    columnKey: "isVerified",
  },
};

export const NotVerified: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: false,
      hasPermission: false,
    },
    name: "認証済み",
    columnKey: "isVerified",
  },
};

export const HasPermission: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: true,
      hasPermission: true,
    },
    name: "権限あり",
    columnKey: "hasPermission",
  },
};

export const NoPermission: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: true,
      hasPermission: false,
    },
    name: "権限あり",
    columnKey: "hasPermission",
  },
};

export const UndefinedValue: Story = {
  args: {
    record: {
      isActive: true,
      isVerified: true,
    },
    name: "権限あり",
    columnKey: "hasPermission",
  },
};

export const WithCustomClassName: Story = {
  args: {
    record: {
      isPremium: true,
    },
    name: "プレミアム",
    columnKey: "isPremium",
    className: "text-yellow-600 font-bold text-lg",
  },
};
