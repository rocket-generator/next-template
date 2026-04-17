# 管理画面構築ガイド

Next.js App Router を使った管理画面（`/admin/` 配下）の構築方法。

参照実装は `/src/app/(site)/(authorized)/admin/users`。

## ディレクトリ構造

### 基本構造

```text
/src/app/(site)/(authorized)/admin/
├── layout.tsx
├── dashboard/
│   └── page.tsx
└── [entity]/
    ├── page.tsx
    ├── create/
    │   ├── page.tsx
    │   └── actions.ts
    └── [id]/
        ├── page.tsx
        ├── actions.ts
        └── edit/
            ├── page.tsx
            └── actions.ts
```

### 関連ファイル

```text
/src/repositories/[entity]_repository.ts
/src/requests/admin/[entity]_create_request.ts
/src/requests/admin/[entity]_update_request.ts
/src/components/molecules/AdminPageHeader/
/src/components/organisms/DataTable/
/src/components/organisms/DataView/
/src/components/organisms/DataForm/
/messages/ja.json
/messages/en.json
```

## 命名規則

### URL

- 一覧: `/admin/users`
- 詳細: `/admin/users/[id]`
- 新規作成: `/admin/users/create`
- 編集: `/admin/users/[id]/edit`

### ファイル・型

- ページ: `page.tsx`
- Server Action: `actions.ts`
- Repository: `src/repositories/[entity]_repository.ts`
- Request schema: `src/requests/admin/[entity]_[action]_request.ts`

## レイアウトと認可

`/src/app/(site)/(authorized)/admin/layout.tsx` が管理画面共通レイアウト。

- `requireAdminSession()` で admin 権限を確認する
- 必要に応じて `UserRepository` からログインユーザーを読み直す
- メニューやサイドバーは layout 側で構築する

新しい管理画面ページでは、各ページで認可を重複実装する前に layout 側で吸収できないかを確認する。

## 主要コンポーネント

### `AdminPageHeader`

`src/components/molecules/AdminPageHeader`

- `breadcrumbLinks`
- `title`
- `buttons`

ボタンは `href` 付きリンクか、`action` を持つ server action form のどちらでも使える。

### `DataTable`

`src/components/organisms/DataTable`

一覧ページでは以下の props を揃える。

- `basePath`
- `count`
- `offset`
- `limit`
- `order`
- `direction`
- `query`
- `data`
- `structure`

検索・並び替えのクエリ名は実装上 `offset` / `limit` / `order` / `direction` / `query` を使う。

### `DataView`

`src/components/organisms/DataView`

- `data`
- `structure`

詳細ページの description list 表示に使う。

### `DataForm`

`src/components/organisms/DataForm`

- `structure`
- `submitAction`

`submitAction` は `Promise<boolean>` を返す async function を渡す。`DataForm<T>` の generic は request type と合わせる。

## 実装パターン

### 一覧画面

```ts
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataTableSkeleton from "@/components/molecules/DataTableSkeleton";
import DataTable from "@/components/organisms/DataTable";
import { EntityRepository } from "@/repositories/entity_repository";

type SearchParams = {
  offset?: string;
  limit?: string;
  order?: string;
  direction?: string;
  query?: string;
  [key: string]: string | string[] | undefined;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const offset = params.offset ? parseInt(params.offset, 10) : 0;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;
  const order = params.order ? String(params.order) : "name";
  const direction = params.direction ? String(params.direction) : "asc";
  const query = params.query ? String(params.query) : "";

  const tMenu = await getTranslations("Menu.Admin");
  const tEntity = await getTranslations("Entities");
  const tCrud = await getTranslations("Crud");

  const repository = new EntityRepository();
  const result = await repository.get(offset, limit, order, direction, query);

  const structure = [
    { name: tEntity("name"), key: "name", type: "text", options: {}, isSortable: true },
    { name: tEntity("created_at"), key: "createdAt", type: "datetime", options: {}, isSortable: true },
  ];

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={structure.length} />}>
      <AdminPageHeader
        breadcrumbLinks={[{ href: "/admin/dashboard", label: tMenu("dashboard") }]}
        title={tEntity("title")}
        buttons={[
          {
            href: "/admin/entities/create",
            label: tCrud("create"),
            icon: <Plus className="w-5 h-5" />,
          },
        ]}
      />
      <DataTable
        basePath="/admin/entities"
        count={result.count}
        offset={offset}
        limit={limit}
        order={order}
        direction={direction}
        query={query}
        data={result.data}
        structure={structure}
      />
    </Suspense>
  );
}
```

### 詳細画面

```ts
import { notFound, redirect } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataView from "@/components/organisms/DataView";
import { EntityRepository } from "@/repositories/entity_repository";
import { deleteEntity } from "./actions";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const repository = new EntityRepository();
  const data = await repository.findById(id).catch(() => null);

  if (!data) {
    return notFound();
  }

  const tMenu = await getTranslations("Menu.Admin");
  const tEntity = await getTranslations("Entities");
  const tCrud = await getTranslations("Crud");

  return (
    <>
      <AdminPageHeader
        breadcrumbLinks={[
          { href: "/admin/dashboard", label: tMenu("dashboard") },
          { href: "/admin/entities", label: tMenu("entities") },
        ]}
        title={data.name}
        buttons={[
          {
            href: `/admin/entities/${id}/edit`,
            label: tCrud("edit"),
            icon: <Pencil className="w-5 h-5" />,
          },
          {
            action: async () => {
              "use server";
              await deleteEntity(id);
              redirect("/admin/entities");
            },
            label: tCrud("delete"),
            variant: "danger",
            icon: <Trash2 className="w-5 h-5" />,
          },
        ]}
      />
      <DataView
        data={data}
        structure={[
          { name: tEntity("name"), key: "name", type: "text", options: {} },
          { name: tEntity("created_at"), key: "createdAt", type: "datetime", options: {} },
        ]}
      />
    </>
  );
}
```

### 作成 / 編集画面

```ts
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataForm from "@/components/organisms/DataForm";
import { createEntity } from "./actions";
import { EntityCreateRequest } from "@/requests/admin/entity_create_request";

export default async function Page() {
  const tMenu = await getTranslations("Menu.Admin");
  const tEntity = await getTranslations("Entities");

  const structure = [
    {
      name: tEntity("name"),
      key: "name",
      type: "text",
      value: "",
      required: true,
      placeholder: tEntity("name"),
    },
  ];

  return (
    <>
      <AdminPageHeader
        breadcrumbLinks={[{ href: "/admin/dashboard", label: tMenu("dashboard") }]}
        title={tEntity("title")}
        buttons={[]}
      />
      <DataForm<EntityCreateRequest>
        structure={structure}
        submitAction={async (data) => {
          "use server";
          const id = await createEntity(data);
          if (id) {
            redirect(`/admin/entities/${id}`);
          }
          return false;
        }}
      />
    </>
  );
}
```

## `structure` 定義の考え方

### 一覧 / 詳細用

```ts
const structure = [
  { name: tEntity("name"), key: "name", type: "text", options: {}, isSortable: true },
  { name: tEntity("owner"), key: "owner", type: "link", options: { key: "id", base_url: "/admin/users/", display: "name" } },
  { name: tEntity("created_at"), key: "createdAt", type: "datetime", options: {}, isSortable: true },
  { name: tEntity("is_active"), key: "isActive", type: "boolean", options: {} },
];
```

### フォーム用

```ts
const structure = [
  {
    name: tEntity("name"),
    key: "name",
    type: "text",
    value: data.name,
    required: true,
    placeholder: tEntity("name"),
  },
  {
    name: tEntity("permissions"),
    key: "permissions",
    type: "checkbox_multi",
    value: data.permissions,
    required: true,
    placeholder: tEntity("permissions"),
    options: {
      options: [{ name: "Admin", value: "admin" }],
    },
  },
];
```

`DataForm` が現在サポートしている代表的な type は `text` / `password` / `select_single` / `checkbox_multi` / `datetime`。

## Repository の置き場所

Repository は `src/repositories/` 直下に置く。`src/repositories/admin/` は現行構成では使っていない。

DB-backed な管理画面では、既存の `PrismaRepository` / `AuthRepository` パターンに合わせる。

- 通常の Prisma entity: `PrismaRepository`
- 認証ユーザーに近い entity: `AuthRepository`

## Server Actions

管理画面の `actions.ts` では以下を徹底する。

- 先頭に `"use server";`
- request schema で入力検証
- repository / service を経由して更新
- UI に返す値はシンプルに保つ（`string | null`, `boolean`, `Status` など）

例:

```ts
"use server";

import { EntityUpdateRequest } from "@/requests/admin/entity_update_request";
import { EntityService } from "@/services/entity_service";

export async function updateEntity(
  id: string,
  data: EntityUpdateRequest
): Promise<boolean> {
  const service = new EntityService();

  try {
    await service.updateEntity(id, data);
    return true;
  } catch (error) {
    console.error("Failed to update entity:", error);
    throw new Error("Failed to update entity");
  }
}
```

## ベストプラクティス

- 権限チェックは admin layout 側を基本にする
- 一覧は `offset` / `limit` / `order` / `direction` / `query` を共通で使う
- 表示コンポーネントは `AdminPageHeader` + `DataTable` / `DataView` / `DataForm` を組み合わせる
- 文字列はすべて `next-intl` から取得する
- request schema は `src/requests/admin/` 配下に置く
- 詳細ページの削除ボタンは `AdminPageHeader.buttons[].action` で server action を渡せる
- 既存の `users` 実装に寄せ、独自 UI を増やしすぎない

## チェックリスト

- [ ] `src/app/(site)/(authorized)/admin/[entity]` 配下に一覧 / 詳細 / create / edit を配置した
- [ ] `src/repositories/[entity]_repository.ts` を追加 / 更新した
- [ ] `src/requests/admin/[entity]_create_request.ts` / `_update_request.ts` を追加 / 更新した
- [ ] `messages/ja.json` / `messages/en.json` を更新した
- [ ] 一覧ページが `DataTable` のクエリ契約（`offset`, `limit`, `order`, `direction`, `query`）に従っている
- [ ] 詳細ページが `DataView` を使っている
- [ ] create / edit ページが `DataForm` と `submitAction` を使っている
- [ ] admin layout のメニューに導線を追加した
