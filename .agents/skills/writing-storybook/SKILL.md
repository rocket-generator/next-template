---
name: writing-storybook
description: Use when adding or updating *.stories.tsx files under src/components/. Covers pure-component discipline, required story variations (Default/Loading/Empty/Error/LongText), @storybook/addon-actions usage, and keeping components free of business logic.
---

# Writing Storybook

## Overview

`src/components/` 配下の molecules / organisms には Story を必ず添える。`ComponentName/index.tsx` と同ディレクトリに `ComponentName.stories.tsx` を置く。正本は `docs/guides/storybook.md`。

## When to Use

- 新規コンポーネント作成時（必須）
- 既存コンポーネント改修時（対応 Story も更新）
- コンポーネント削除時（対応 Story も削除）

**When NOT to use**: コンポーネントに純粋性がなく、副作用（API 呼出、useEffect による外部 fetch）を持つ場合は **まずコンポーネントを修正**する（Props 経由に寄せる）。

## Must-Follow Rules

1. **コンポーネントはビジネスロジックを持たない**。API 呼び出し・状態管理・ルーティング等の副作用は持たせない
2. **外部依存は Props として注入**（`onClick`, `onSubmit`, `data` など）
3. **Default Story は必須**
4. **主要な状態を網羅する Story を書く**: Loading / Empty / Error / WithData / LongText
5. **アクションは `@storybook/addon-actions` の `action()` でモック**
6. **ファイル名は `ComponentName.stories.tsx`**、コンポーネントと同ディレクトリ

## 基本テンプレ

```ts
import type { Meta, StoryObj } from "@storybook/nextjs";
import { action } from "@storybook/addon-actions";
import { ComponentName } from "./index";

const meta = {
  title: "molecules/ComponentName",
  component: ComponentName,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { /* ... */ } };
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { data: null } };
export const WithData: Story = { args: { data: { id: "1", name: "サンプル" } } };
export const LongName: Story = { args: { data: { id: "2", name: "非常に長い名前..." } } };
export const WithActions: Story = {
  args: { onClick: action("clicked"), onSubmit: action("submitted") },
};
```

## インタラクションテスト

```ts
import { within, userEvent } from "@storybook/test";

export const Interactive: Story = {
  args: { onSubmit: action("form-submitted") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByTestId("name-input"), "山田太郎");
    await userEvent.click(canvas.getByTestId("submit-button"));
  },
};
```

## Key Files

- `src/components/molecules/*/[ComponentName].stories.tsx`
- `src/components/organisms/*/[ComponentName].stories.tsx`
- `.storybook/` — Storybook 設定（必要時）

## コマンド

```bash
npm run storybook        # 起動
npm run build-storybook  # ビルド
```

## Reference

- **正本**: `docs/guides/storybook.md`
- コンポーネント作成全般: `creating-pages-components` Skill
- テスト作成全般: `writing-tests` Skill

## Checklist

- [ ] コンポーネントに副作用が含まれていない（純粋）
- [ ] 外部依存が Props として注入されている
- [ ] `ComponentName.stories.tsx` が同ディレクトリに存在
- [ ] Default Story がある
- [ ] Loading / Empty / Error / LongText などの状態を網羅
- [ ] アクションが `action()` でモックされている
- [ ] `npm run storybook` でエラーなく表示される
