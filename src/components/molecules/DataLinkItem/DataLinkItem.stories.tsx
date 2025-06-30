import type { Meta, StoryObj } from "@storybook/nextjs";
import DataLinkItem from "./index";

const meta: Meta<typeof DataLinkItem> = {
  title: "Molecules/DataLinkItem",
  component: DataLinkItem,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const UserProfileLink: Story = {
  args: {
    record: {
      user: {
        id: "123",
        name: "田中太郎",
        email: "tanaka@example.com",
      },
    },
    name: "ユーザー",
    columnKey: "user",
    options: {
      key: "id",
      base_url: "/admin/users/",
      display: "name",
    },
  },
};

export const ProductLink: Story = {
  args: {
    record: {
      product: {
        id: "P001",
        name: "MacBook Pro 16インチ",
        price: 398000,
      },
    },
    name: "商品",
    columnKey: "product",
    options: {
      key: "id",
      base_url: "/admin/products/",
      display: "name",
    },
  },
};

export const ProjectLink: Story = {
  args: {
    record: {
      project: {
        id: "proj-456",
        name: "ウェブサイトリニューアル",
        status: "active",
      },
    },
    name: "プロジェクト",
    columnKey: "project",
    options: {
      key: "id",
      base_url: "/app/projects/",
      display: "name",
    },
  },
};

export const CompanyLink: Story = {
  args: {
    record: {
      company: {
        id: "comp-789",
        name: "株式会社サンプル",
        website: "https://example.com",
      },
    },
    name: "会社",
    columnKey: "company",
    options: {
      key: "id",
      base_url: "/admin/companies/",
      display: "name",
    },
  },
};

export const DefaultOptions: Story = {
  args: {
    record: {
      category: {
        id: "cat-001",
        name: "ノートパソコン",
      },
    },
    name: "カテゴリ",
    columnKey: "category",
    options: {}, // デフォルトオプション使用
  },
};

export const EmptyLink: Story = {
  args: {
    record: {
      manager: null,
    },
    name: "マネージャー",
    columnKey: "manager",
    options: {
      key: "id",
      base_url: "/admin/users/",
      display: "name",
    },
  },
};

export const NestedPath: Story = {
  args: {
    record: {
      department: {
        head: {
          id: "u-123",
          name: "山田花子",
          title: "部長",
        },
      },
    },
    name: "部長",
    columnKey: "department.head",
    options: {
      key: "id",
      base_url: "/admin/users/",
      display: "name",
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    record: {
      primaryContact: {
        id: "contact-456",
        name: "鈴木三郎",
        role: "メインコンタクト",
      },
    },
    name: "メインコンタクト",
    columnKey: "primaryContact",
    className: "text-purple-600 hover:text-purple-800 font-semibold",
    options: {
      key: "id",
      base_url: "/admin/contacts/",
      display: "name",
    },
  },
};
