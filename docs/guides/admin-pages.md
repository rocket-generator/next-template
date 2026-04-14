# 管理画面構築ガイド

Next.js App Router を使った管理画面（`/admin/` 配下）の構築方法。

`/src/app/(site)/(authorized)/admin/users` を参考実装として参照すること。

## ディレクトリ構造

### 基本構造

```
/src/app/(site)/(authorized)/admin/
├── layout.tsx                          # 共通レイアウト
├── dashboard/
│   └── page.tsx                        # ダッシュボード
└── [entity-name]/                      # 各エンティティ
    ├── page.tsx                        # 一覧
    ├── create/
    │   ├── page.tsx
    │   └── actions.ts
    └── [id]/
        ├── page.tsx                    # 詳細
        ├── actions.ts                  # 削除等
        └── edit/
            ├── page.tsx
            └── actions.ts
```

### 関連ファイル

```
/src/repositories/admin/
└── [entity]_repository.ts

/src/requests/admin/
├── [entity]_create_request.ts
└── [entity]_update_request.ts

/messages/
├── ja.json
└── en.json
```

## 命名規則

### URL

- 複数形の kebab-case: `/admin/billing-records`
- ID パラメータ: `/admin/subscriptions/[id]`
- アクション: `/admin/subscriptions/[id]/edit`, `/admin/subscriptions/create`

### ファイル・型

- ページ: `page.tsx`
- アクション: `actions.ts`
- Repository: `[entity]_repository.ts` / `[Entity]Repository`
- Request: `[entity]_[action]_request.ts` / `[Entity][Action]RequestSchema`

## 実装パターン

### 一覧画面

```typescript
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import DataTable from "@/components/admin/DataTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { EntityRepository } from "@/repositories/admin/entity_repository";

type SearchParams = Promise<{
  page?: string;
  sort?: string;
  direction?: string;
  search?: string;
}>;

async function EntityTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort || "createdAt";
  const direction = params.direction || "desc";
  const search = params.search || "";

  const t = await getTranslations("Entity");
  const repository = new EntityRepository();
  const { entities, total } = await repository.findAll({ page, sort, direction, search });

  const structure = [ /* カラム定義 */ ];
  const limit = 20;
  const offset = (page - 1) * limit;

  return (
    <DataTable
      data={entities}
      structure={structure}
      count={total}
      offset={offset}
      limit={limit}
      order={sort}
      direction={direction}
      query={search}
      basePath="/admin/entities"
    />
  );
}

export default async function EntitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("Entity");
  const breadcrumbs = [
    { label: t("admin"), href: "/admin/dashboard" },
    { label: t("entities"), href: "/admin/entities" },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("entities")}
        breadcrumbLinks={breadcrumbs}
        buttons={[{ label: t("create"), href: "/admin/entities/create", variant: "primary" }]}
      />
      <Suspense fallback={<div>{t("loading")}</div>}>
        <EntityTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}
```

### 詳細画面

```typescript
import { notFound } from "next/navigation";
import DataView from "@/components/admin/DataView";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function EntityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Entity");
  const entity = await new EntityRepository().findById(id);
  if (!entity) notFound();

  const breadcrumbs = [ /* ... */ ];
  const actions = [
    { label: t("edit"), href: `/admin/entities/${entity.id}/edit`, variant: "primary" as const },
    { label: t("delete"), action: "delete", variant: "danger" as const },
  ];
  const structure = [ /* フィールド定義 */ ];

  return (
    <>
      <AdminPageHeader title={entity.name} breadcrumbLinks={breadcrumbs} buttons={actions} />
      <DataView data={entity} structure={structure} />
    </>
  );
}
```

### 編集画面

```typescript
import DataForm from "@/components/admin/DataForm";
import { updateEntity } from "./actions";

export default async function EntityEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("Entity");
  const entity = await new EntityRepository().findById(id);
  if (!entity) notFound();

  return (
    <>
      <AdminPageHeader title={t("edit_entity")} breadcrumbLinks={breadcrumbs} />
      <DataForm
        action={updateEntity.bind(null, entity.id)}
        structure={[ /* フォームフィールド */ ]}
        submitLabel={t("update")}
        cancelHref={`/admin/entities/${entity.id}`}
      />
    </>
  );
}
```

### Repository

```typescript
import { prisma } from "@/lib/prisma";

export class EntityRepository {
  private readonly pageSize = 20;

  async findAll({ page, sort, direction, search }: FindAllParams) {
    const skip = (page - 1) * this.pageSize;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { user: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where, skip, take: this.pageSize,
        orderBy: this.getOrderBy(sort, direction),
        include: { user: true },
      }),
      prisma.entity.count({ where }),
    ]);

    return { entities, total };
  }

  async findById(id: string) {
    return prisma.entity.findUnique({ where: { id }, include: { user: true } });
  }

  async create(data: EntityCreateData) { return prisma.entity.create({ data }); }
  async update(id: string, data: EntityUpdateData) { return prisma.entity.update({ where: { id }, data }); }
  async delete(id: string) { return prisma.entity.delete({ where: { id } }); }

  private getOrderBy(sort: string, direction: string) {
    const dir = direction === "desc" ? "desc" : "asc";
    switch (sort) {
      case "user.name": return { user: { name: dir } };
      case "name": return { name: dir };
      default: return { createdAt: dir };
    }
  }
}
```

### Server Actions

```typescript
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EntityRepository } from "@/repositories/admin/entity_repository";
import { EntityUpdateRequestSchema } from "@/requests/admin/entity_update_request";

export async function updateEntity(id: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
  };

  try {
    const validated = EntityUpdateRequestSchema.parse(data);
    await new EntityRepository().update(id, validated);
  } catch (error) {
    if (error instanceof z.ZodError) throw new Error(error.errors[0].message);
    console.error("Error updating entity:", error);
    throw new Error("Failed to update entity");
  }
  redirect(`/admin/entities/${id}`);
}

export async function deleteEntity(id: string) {
  try {
    await new EntityRepository().delete(id);
  } catch (error) {
    console.error("Error deleting entity:", error);
    throw new Error("Failed to delete entity");
  }
  redirect("/admin/entities");
}
```

## データ構造定義

### 一覧テーブル

```typescript
const structure = [
  { name: t("field_name"), key: "fieldName", type: undefined, isSortable: true },
  {
    name: t("user"), key: "user", type: "link",
    options: { key: "id", base_url: "/admin/users/", display: "name" },
    isSortable: true,
  },
  { name: t("created_at"), key: "createdAt", type: "datetime", isSortable: true },
  { name: t("is_active"), key: "isActive", type: "boolean", isSortable: false },
];
```

### 詳細表示

```typescript
const structure = [
  { name: t("id"), key: "id", value: entity.id },
  { name: t("name"), key: "name", value: entity.name },
  { name: t("description"), key: "description", value: entity.description || t("none") },
  { name: t("created_at"), key: "createdAt", value: entity.createdAt, type: "date" },
  { name: t("settings"), key: "settings", value: JSON.stringify(entity.settings, null, 2), type: "code" },
];
```

### フォーム

```typescript
const structure = [
  { name: t("name"), key: "name", type: "text", value: entity.name, required: true },
  { name: t("description"), key: "description", type: "textarea", value: entity.description || "", required: false },
  {
    name: t("status"), key: "status", type: "select", value: entity.status, required: true,
    options: {
      choices: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  },
  { name: t("settings"), key: "settings", type: "json", value: JSON.stringify(entity.settings, null, 2) },
];
```

## バリデーション

### 作成

```typescript
import { z } from "zod";

export const EntityCreateRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]),
});

export type EntityCreateRequest = z.infer<typeof EntityCreateRequestSchema>;
```

### 更新

```typescript
export const EntityUpdateRequestSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
```

## ベストプラクティス

- 認証・認可は `layout.tsx` で実装済み
- try-catch でエラー処理し、コンソールに詳細、ユーザーにはフレンドリーなメッセージを
- Zod スキーマでバリデーション、`any` 禁止
- Suspense でローディング表示、ページネーション必須（20件）
- URL は RESTful / kebab-case
- 日付は `type: "datetime"`
- リンクは `type: "link"`
- null 値は "なし" / "None" 表示
- 全テキストに翻訳キー
- パンくずリストで現在位置を明示

## チェックリスト

- [ ] ディレクトリ・ファイル構造作成
- [ ] Repository 実装（findAll, findById, create, update, delete）
- [ ] 一覧画面（DataTable）
- [ ] 詳細画面（DataView）
- [ ] 編集画面（DataForm）※必要な場合
- [ ] 新規作成画面 ※必要な場合
- [ ] Server Actions
- [ ] バリデーションスキーマ
- [ ] 翻訳メッセージ（日英）
- [ ] レイアウトメニューに追加
- [ ] breadcrumbs の href 設定
- [ ] 日付・リンクフィールドの type 設定
- [ ] エラーハンドリング
- [ ] 動作テスト
