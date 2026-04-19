# Storybook ガイド

このプロジェクトの Storybook は **Storybook 10 + `@storybook/nextjs-vite`** を前提とする。Story ファイルの型 import は `@storybook/nextjs` ではなく、必ず `@storybook/nextjs-vite` から行う。

## 基本原則

### Story 作成の義務

- 新規コンポーネント作成時: 必ず Story も作成
- 既存コンポーネント改修時: 対応する Story も更新
- コンポーネント削除時: 対応する Story も削除

### コンポーネントの純粋性

- **ビジネスロジックを排除**: API 呼び出し、グローバル状態、ルーティング等の副作用を含まない
- **Props 経由で機能注入**: アクション、イベントハンドラ、データは全て Props で受け取る

## ディレクトリ構造

```
src/components/
├── molecules/
│   └── AwesomeButton/
│       ├── index.tsx
│       └── AwesomeButton.stories.tsx
```

Story ファイルは `[ComponentName].stories.tsx` の形式でコンポーネントと同じディレクトリに配置する。

## Story の基本テンプレート

```typescript
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ComponentName } from "./ComponentName";

const meta = {
  title: "カテゴリ/ComponentName",
  component: ComponentName,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    // Props 制御設定
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { /* ... */ } };
```

## 必須 Story パターン

- **Default**: 最も一般的な使用例
- **各状態のバリエーション**: loading, error, empty, disabled など
- **エッジケース**: 長文、特殊文字、境界値など

## アクションとモックデータ

```typescript
import { action } from "@storybook/addon-actions";

export const WithActions: Story = {
  args: {
    onClick: action("clicked"),
    onSubmit: action("submitted"),
    data: { id: "1", name: "サンプルデータ" },
  },
};
```

## セットアップ上の注意

- Next.js runtime 依存（`next/image`, `next/link`, `next/navigation` など）は `.storybook/main.ts` の Vite alias で Storybook 用 mock に寄せる。
- Server Actions や repository など、ブラウザ Storybook で直接実行できない依存は `.storybook/mocks/` に分離して alias する。
- Storybook 10 の test addon は Vitest 4 と組み合わせる。ブラウザ provider は `@vitest/browser-playwright` を使う。
- Tailwind CSS は Next.js / Storybook の両方で PostCSS 経路を正とし、Storybook 側だけ `@tailwindcss/vite` に寄せない。

## 網羅性の例

```typescript
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { user: null, loading: false } };
export const WithData: Story = {
  args: {
    user: { id: "1", name: "山田太郎", email: "yamada@example.com" },
    loading: false,
  },
};
export const LongName: Story = {
  args: {
    user: { id: "2", name: "非常に長い名前のユーザーさん", email: "..." },
  },
};
```

## インタラクティブな Story

```typescript
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

## 悪い例と良い例

```typescript
// ❌ ビジネスロジックを含む
export const UserProfile = () => {
  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  return <div>{user?.name}</div>;
};

// ✅ 純粋なコンポーネント
interface Props {
  user: User | null;
  onRefresh?: () => void;
  loading?: boolean;
}
export const UserProfile = ({ user, onRefresh, loading }: Props) => {
  if (loading) return <Spinner />;
  if (!user) return <EmptyState />;
  return (
    <div>
      <h2>{user.name}</h2>
      <button onClick={onRefresh}>更新</button>
    </div>
  );
};
```

## コマンド

```bash
npm run storybook        # 起動
npm run build-storybook  # ビルド
npx vitest --run --project storybook
npm run test:e2e:storybook
```

## チェックリスト

- [ ] ビジネスロジックを含まない
- [ ] 外部依存は Props として注入
- [ ] Story ファイルが作成されている
- [ ] Default Story が存在
- [ ] 主要な状態を網羅
- [ ] エッジケースが含まれる
- [ ] アクションを `action()` でモック
- [ ] エラーなく表示される
