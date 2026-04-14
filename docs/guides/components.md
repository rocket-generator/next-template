# ページ・コンポーネント作成ガイド

Next.js (App Router) でのページ・コンポーネント作成に関するルールとベストプラクティス。

## 基本原則

- **TypeScript**: 全コードを TypeScript で記述。`any` 禁止
- **Server Components First**: 可能な限り Server Component を使い、インタラクティブ性が必要な部分のみ Client Component を使う
- **関心の分離**: UI・状態管理・データフェッチのロジックを分離する
- **PWA 対応**: `env(safe-area-inset-*)` をヘッダー・フッター等に適用
- **Server Actions の利用**: DB アクセスは API ではなく Server Actions で。`page.tsx` と同階層に `actions.ts` を配置

## ディレクトリ構造

### ページ（App Router）

- `src/app` 配下に配置
- ルートセグメントのディレクトリ名は小文字ケバブケース、もしくはグループ括弧 `(groupName)`
- 各ページのメインファイルは `page.tsx`
- ページに関連する Server Actions は同階層の `actions.ts`

### コンポーネント（`src/components`）

Atomic Design に基づき、以下のサブディレクトリに分類する。

- **atoms**: 最小単位の UI 要素（Button, Input, Icon など）。**Shadcn/UI のもののみ配置**。原則ここにカスタムコンポーネントを新規作成しない（`src/components/ui` は使用しない）
- **molecules**: 複数の atom を組み合わせた UI 部品（SearchInput, UserAvatarMenu など）
- **organisms**: ページセクションや独立した UI 領域（AppHeader, RecordList など）

### ファイル構成

molecules・organisms は以下の構造を取る：

```
src/components/
├── molecules/
│   └── PetFilter/
│       └── index.tsx
└── organisms/
    └── AppHeader/
        └── index.tsx
```

- コンポーネント名は `PascalCase` のディレクトリ
- 直下に `index.tsx` を配置

### 型定義

- プロジェクト共通型: `src/types/index.ts`
- コンポーネント固有型（Props 等）: コンポーネントファイル（`index.tsx`）内に記述

## Server Components と Client Components

### Server Component

- データフェッチ、状態を持たない UI レンダリング
- イベントハンドラを直接持てない
- `async/await` でデータ取得可能
- `page.tsx` は基本すべて Server Component

### Client Component

- ファイル先頭に `"use client";` を記述
- `useState`・`useEffect`・`useRouter` 等のフック使用可
- イベントハンドラ使用可

### 原則

- Server Component で完結できるものは Server Component で実装
- インタラクティブ性が必要な部分のみ最小限の Client Component に切り出す
- **NG**: ページ全体を大きな Client Component でラップする
- **OK**: `page.tsx` は静的レイアウトとデータ取得、個々のインタラクティブ要素だけを独立した小さな Client Component として呼ぶ

## データフローと状態管理

- **データ取得**: Server Actions (`actions.ts`) 経由。Client からの再取得・更新も Server Actions を呼び出す
- **ローカル UI 状態**: Client Component 内で `useState`
- **URL による状態管理**: ページ全体に影響するフィルタ条件（選択中のペット、表示月など）はクエリパラメータで管理
  - Client Component (`PetFilter`, `MonthNavigator` 等) が `next/navigation` の `useRouter` でクエリ更新
  - URL 変更で `page.tsx` が再実行され Server Actions がデータ再取得
- **Props Drilling の回避**: 複雑な状態共有が必要なら React Context や Zustand も検討するが、まず Server Component + URL + Server Actions で対応できないか検討する

## Props

- Props の型は明確に定義する
- Server Component から Client Component へ関数を渡すことは不可。Client が必要なインタラクションはその Client 内で完結させるか、Server Actions を呼ぶ

## スタイリング

- Tailwind CSS を使用
- JSX に直接クラス名を記述
- 共通の色・テーマは `tailwind.config.js` の定義を使用

## Server Actions (`actions.ts`)

- 先頭に `"use server";`
- DB アクセス・外部 API 呼び出しなどのサーバーサイドロジックを記述
- データ取得／CRUD 関数を定義
- Server Component・Client Component の両方から呼び出し可能

## サイドメニューのアクティブ判定

- 対象: `src/components/organisms/AppSidebar/index.tsx`, `AdminSidebar/index.tsx`
- `next/navigation` の `usePathname()` で現在パスを取得し、`href` との前方一致でアクティブ判定する
- 配下ページ（例: `/admin/users/123`）でも親メニューをアクティブにする

### 実装例

```ts
const normalizePath = (path: string) => {
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "");
};

const isActivePath = (pathname: string, href: string) => {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);
  if (targetPath === "/") return currentPath === "/";
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};
```

### 太字スタイル

`src/components/atoms/sidebar.tsx` の `SidebarMenuButton` / `SidebarMenuSubButton` に `data-[active=true]:font-semibold` を付与する。

### テスト時の注意

- `usePathname` のモックが必要
- 完全一致と配下ページの両方で `data-active` が付くことを検証する
