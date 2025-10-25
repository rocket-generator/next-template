
# add-email-provider

日本語で回答すること

---
description: メール送信で、新しい送信プロバイダを追加する時に参照する
alwaysApply: false
---
# メールプロバイダー追加ガイド

このファイルは、既存のメールサービスに新しいプロバイダーを追加する方法を説明します。

## 現在のアーキテクチャ

メールサービスはProvider パターンで設計されており、以下の構造になっています：

```
src/libraries/email.ts
├── EmailService (interface) - メール送信の抽象化
├── EmailProvider (interface) - プロバイダーの抽象化
├── SESProvider (class) - AWS SES実装
└── EmailServiceImpl (class) - メインのサービス実装
```

## 新しいプロバイダーの追加手順

### 1. プロバイダー設定インターフェースの定義

```typescript
// 例: Resend プロバイダーの場合
export interface ResendProviderConfig {
  apiKey: string;
  fromEmail?: string; // 省略可能な設定
}
```

### 2. プロバイダークラスの実装

```typescript
export class ResendProvider implements EmailProvider {
  private config: ResendProviderConfig;

  constructor(config: ResendProviderConfig) {
    this.config = config;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Dynamic import for Edge Runtime compatibility (必要に応じて)
      const { Resend } = await import("resend");
      
      const resend = new Resend(this.config.apiKey);
      
      const result = await resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      console.error("Resend email sending failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

### 3. 設定ファクトリー関数の追加

```typescript
export function createResendProviderConfig(): ResendProviderConfig {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL,
  };
}
```

### 4. メインファクトリー関数の更新

```typescript
export function createEmailServiceInstance(): EmailService {
  const providerType = process.env.EMAIL_PROVIDER || "ses"; // デフォルトはSES
  
  let provider: EmailProvider;
  let fromEmail: string;
  
  switch (providerType) {
    case "resend":
      const resendConfig = createResendProviderConfig();
      provider = new ResendProvider(resendConfig);
      fromEmail = resendConfig.fromEmail || process.env.SES_FROM_EMAIL || "noreply@localhost";
      break;
      
    case "ses":
    default:
      const sesConfig = createSESProviderConfig();
      provider = new SESProvider(sesConfig);
      fromEmail = process.env.SES_FROM_EMAIL || 
        (process.env.NODE_ENV === "production" ? "noreply@example.com" : "noreply@localhost");
      break;
  }
  
  return new EmailServiceImpl(provider, fromEmail);
}
```

### 5. 環境変数の追加

`.env.sample` に新しいプロバイダー用の環境変数を追加：

```bash
# Email Provider Selection
EMAIL_PROVIDER=ses # ses, resend, sendgrid, etc.

# Resend Configuration
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 6. package.json の依存関係追加

```bash
npm install resend
# または
npm install @sendgrid/mail
```

## プロバイダー実装の注意点

### Edge Runtime 対応

Next.js Edge Runtime で使用する場合：

1. **Dynamic Import を使用**: Node.js 固有のモジュールは dynamic import で読み込む
2. **HTTP ベースの API を選択**: Node.js ネイティブモジュール（crypto, fs など）を使わないライブラリを選ぶ
3. **fetch() を活用**: 可能であれば、ライブラリの代わりに fetch() で直接 API を呼び出す

### エラーハンドリング

- 常に `EmailResult` 形式で結果を返す
- エラーは適切にログ出力し、`success: false` で返す
- ネットワークエラー、認証エラーなど様々なエラーケースを考慮

### 設定の検証

```typescript
constructor(config: ResendProviderConfig) {
  if (!config.apiKey) {
    throw new Error("Resend API key is required");
  }
  this.config = config;
}
```

## テスト方法

### 1. 単体テスト

```typescript
// __tests__/libraries/email.test.ts
describe("ResendProvider", () => {
  it("should send email successfully", async () => {
    const provider = new ResendProvider({
      apiKey: "test-api-key"
    });
    
    const result = await provider.sendEmail({
      from: "test@example.com",
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>"
    });
    
    expect(result.success).toBe(true);
  });
});
```

### 2. 統合テスト

1. `.env` ファイルで `EMAIL_PROVIDER=resend` を設定
2. パスワードリセット機能で実際にメール送信をテスト
3. ログでメッセージIDが正しく出力されることを確認

## 利用可能なプロバイダーの例

### Edge Runtime 対応

- **Resend**: HTTP API、Edge Runtime 対応
- **SendGrid Web API**: HTTP API、Edge Runtime 対応  
- **Postmark**: HTTP API、Edge Runtime 対応

### Node.js Runtime のみ

- **Nodemailer**: SMTP、Node.js 専用
- **AWS SES (SDK)**: 現在の実装、Node.js 推奨

## 既存コードへの影響

新しいプロバイダーを追加しても、以下は変更不要：

- `EmailService` インターフェース
- `EmailServiceImpl` クラス
- 既存の `SESProvider`
- パスワードリセット機能の実装 (`auth_repository.ts`)

プロバイダーの切り替えは環境変数 `EMAIL_PROVIDER` の設定のみで可能です。

---


# admin-pages

---
description: 管理画面を作成する（ /admin/ 以下のページ ) 時に参照する
alwaysApply: false
---
# 管理画面構築ガイド

このドキュメントは、Next.js App Routerを使用した管理画面の構築方法について、現在のユーザー管理画面の実装をベースに説明します。

`/src/app/(site)/(authorized)/admin/users` ディレクトリは、ユーザー管理画面の実装例です。ここでの書き方を参考にして、新しい管理画面を追加してください。

このドキュメントでは、AIプロトタイプ生成サービスの管理画面を構築する際のルールとパターンについて説明します。

## 1. ディレクトリ構造とファイル構成

### 基本構造
```
/src/app/(site)/(authorized)/admin/
├── layout.tsx                          # 共通レイアウト
├── dashboard/
│   └── page.tsx                        # ダッシュボード
└── [entity-name]/                      # 各エンティティの管理画面
    ├── page.tsx                        # 一覧画面
    ├── create/                         # 新規作成（必要な場合のみ）
    │   ├── page.tsx
    │   └── actions.ts
    └── [id]/                          # 個別エンティティ
        ├── page.tsx                   # 詳細表示
        ├── actions.ts                 # 削除などのアクション
        └── edit/                      # 編集（必要な場合のみ）
            ├── page.tsx
            └── actions.ts
```

### 関連ファイル
```
/src/repositories/admin/
└── [entity]_repository.ts              # データアクセス層

/src/requests/admin/
├── [entity]_create_request.ts          # 作成用バリデーション
└── [entity]_update_request.ts          # 更新用バリデーション

/messages/
├── ja.json                            # 日本語翻訳
└── en.json                            # 英語翻訳
```

## 2. 命名規則

### URLパス
- 複数形のkebab-case: `/admin/billing-records`, `/admin/project-shares`
- IDパラメータ: `/admin/subscriptions/[id]`
- アクション: `/admin/subscriptions/[id]/edit`, `/admin/subscriptions/create`

### ファイル名
- ページファイル: `page.tsx`
- アクションファイル: `actions.ts`
- リポジトリ: `[entity]_repository.ts`
- リクエスト: `[entity]_[action]_request.ts`

### コンポーネント名
- Repository: `[Entity]Repository` (例: `SubscriptionRepository`)
- リクエストスキーマ: `[Entity][Action]RequestSchema`

## 3. 実装パターン

### 3.1 一覧画面 (`page.tsx`)

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

interface PageProps {
  searchParams: SearchParams;
}

async function EntityTable({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort || "createdAt";
  const direction = params.direction || "desc";
  const search = params.search || "";

  const t = await getTranslations("Entity");
  const repository = new EntityRepository();
  const { entities, total } = await repository.findAll({
    page,
    sort,
    direction,
    search,
  });

  const structure = [
    // カラム定義（詳細は後述）
  ];

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

export default async function EntitiesPage({ searchParams }: PageProps) {
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
        buttons={[
          {
            label: t("create"),
            href: "/admin/entities/create",
            variant: "primary",
          },
        ]}
      />

      <Suspense fallback={<div>{t("loading")}</div>}>
        <EntityTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}
```

### 3.2 詳細表示画面 (`[id]/page.tsx`)

```typescript
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DataView from "@/components/admin/DataView";
import { EntityRepository } from "@/repositories/admin/entity_repository";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("Entity");
  const repository = new EntityRepository();
  const entity = await repository.findById(id);

  if (!entity) {
    notFound();
  }

  const breadcrumbs = [
    { label: t("admin"), href: "/admin/dashboard" },
    { label: t("entities"), href: "/admin/entities" },
    { label: entity.name, href: `/admin/entities/${entity.id}` },
  ];

  const actions = [
    {
      label: t("edit"),
      href: `/admin/entities/${entity.id}/edit`,
      variant: "primary" as const,
    },
    {
      label: t("delete"),
      action: "delete",
      variant: "danger" as const,
    },
  ];

  const structure = [
    // フィールド定義（詳細は後述）
  ];

  return (
    <>
      <AdminPageHeader
        title={entity.name}
        breadcrumbLinks={breadcrumbs}
        buttons={actions}
      />

      <DataView data={entity} structure={structure} />
    </>
  );
}
```

### 3.3 編集画面 (`[id]/edit/page.tsx`)

```typescript
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import DataForm from "@/components/admin/DataForm";
import { EntityRepository } from "@/repositories/admin/entity_repository";
import { updateEntity } from "./actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityEditPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations("Entity");
  const repository = new EntityRepository();
  const entity = await repository.findById(id);

  if (!entity) {
    notFound();
  }

  const breadcrumbs = [
    { label: t("admin"), href: "/admin/dashboard" },
    { label: t("entities"), href: "/admin/entities" },
    { label: entity.name, href: `/admin/entities/${entity.id}` },
    { label: t("edit"), href: `/admin/entities/${entity.id}/edit` },
  ];

  const structure = [
    // フォームフィールド定義
  ];

  return (
    <>
      <AdminPageHeader
        title={t("edit_entity")}
        breadcrumbLinks={breadcrumbs}
      />

      <DataForm
        action={updateEntity.bind(null, entity.id)}
        structure={structure}
        submitLabel={t("update")}
        cancelHref={`/admin/entities/${entity.id}`}
      />
    </>
  );
}
```

### 3.4 Repository (`repositories/admin/entity_repository.ts`)

```typescript
import { prisma } from "@/lib/prisma";

interface FindAllParams {
  page: number;
  sort: string;
  direction: string;
  search: string;
}

export class EntityRepository {
  private readonly pageSize = 20;

  async findAll({ page, sort, direction, search }: FindAllParams) {
    const skip = (page - 1) * this.pageSize;
    
    const where = search
      ? {
          OR: [
            // 検索対象フィールドを定義
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            // 関連エンティティでの検索
            { user: { name: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {};

    const orderBy = this.getOrderBy(sort, direction);

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: this.pageSize,
        orderBy,
        include: {
          // 必要な関連データをinclude
          user: true,
          relatedEntities: true,
        },
      }),
      prisma.entity.count({ where }),
    ]);

    return { entities, total };
  }

  async findById(id: string) {
    return prisma.entity.findUnique({
      where: { id },
      include: {
        // 詳細表示に必要な関連データ
        user: true,
        relatedEntities: true,
      },
    });
  }

  async create(data: EntityCreateData) {
    return prisma.entity.create({ data });
  }

  async update(id: string, data: EntityUpdateData) {
    return prisma.entity.update({
      where: { id },
      data,
    });
  }
  async delete(id: string) {
    return prisma.entity.delete({
      where: { id },
    });
  }

  private getOrderBy(sort: string, direction: string) {
    const dir = direction === "desc" ? "desc" : "asc";
    
    switch (sort) {
      case "user.name":
        return { user: { name: dir } };
      case "name":
        return { name: dir };
      case "createdAt":
      default:
        return { createdAt: dir };
    }
  }
}
```

### 3.5 Server Actions (`actions.ts`)

```typescript
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { EntityRepository } from "@/repositories/admin/entity_repository";
import { EntityUpdateRequestSchema } from "@/requests/admin/entity_update_request";

export async function updateEntity(id: string, formData: FormData) {
  const repository = new EntityRepository();
  
  const data = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    // その他のフィールド
  };

  try {
    const validatedData = EntityUpdateRequestSchema.parse(data);
    await repository.update(id, validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors[0].message);
    }
    console.error("Error updating entity:", error);
    throw new Error("Failed to update entity");
  }
  
  redirect(`/admin/entities/${id}`);
}

export async function deleteEntity(id: string) {
  const repository = new EntityRepository();
  
  try {
    await repository.delete(id);
  } catch (error) {
    console.error("Error deleting entity:", error);
    throw new Error("Failed to delete entity");
  }
  
  redirect("/admin/entities");
}
```

## 4. データ構造定義

### 4.1 一覧テーブルの構造定義

```typescript
const structure = [
  // テキストフィールド
  {
    name: t("field_name"),
    key: "fieldName",
    type: undefined,
    options: undefined,
    isSortable: true,
  },
  
  // リンクフィールド（関連エンティティ）
  {
    name: t("user"),
    key: "user",
    type: "link",
    options: {
      key: "id",
      base_url: "/admin/users/",
      display: "name",
    },
    isSortable: true,
  },
  
  // 日時フィールド
  {
    name: t("created_at"),
    key: "createdAt",
    type: "datetime",
    options: undefined,
    isSortable: true,
  },
  
  // ブールフィールド
  {
    name: t("is_active"),
    key: "isActive",
    type: "boolean",
    options: undefined,
    isSortable: false,
  },
];
```

### 4.2 詳細表示の構造定義

```typescript
const structure = [
  {
    name: t("id"),
    key: "id",
    value: entity.id,
  },
  {
    name: t("name"),
    key: "name",
    value: entity.name,
  },
  {
    name: t("description"),
    key: "description",
    value: entity.description || t("none"),
  },
  {
    name: t("created_at"),
    key: "createdAt",
    value: entity.createdAt,
    type: "date",
  },
  {
    name: t("settings"),
    key: "settings",
    value: JSON.stringify(entity.settings, null, 2),
    type: "code",
  },
];
```

### 4.3 フォームの構造定義

```typescript
const structure = [
  {
    name: t("name"),
    key: "name",
    type: "text",
    value: entity.name,
    required: true,
  },
  {
    name: t("description"),
    key: "description",
    type: "textarea",
    value: entity.description || "",
    required: false,
  },
  {
    name: t("status"),
    key: "status",
    type: "select",
    value: entity.status,
    required: true,
    options: {
      choices: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  },
  {
    name: t("settings"),
    key: "settings",
    type: "json",
    value: JSON.stringify(entity.settings, null, 2),
    required: false,
  },
];
```

## 5. 翻訳設定

### メッセージファイル (`messages/ja.json`, `messages/en.json`)

```json
{
  "Menu": {
    "Admin": {
      "entities": "エンティティ"
    }
  },
  "Entity": {
    "entities": "エンティティ",
    "name": "名前",
    "description": "説明",
    "status": "ステータス",
    "created_at": "作成日時",
    "updated_at": "更新日時",
    "admin": "管理画面",
    "loading": "読み込み中...",
    "create": "新規作成",
    "edit": "編集",
    "delete": "削除",
    "update": "更新",
    "none": "なし",
    "create_entity": "エンティティを作成",
    "edit_entity": "エンティティを編集"
  }
}
```

## 6. バリデーション定義

### 作成用 (`requests/admin/entity_create_request.ts`)

```typescript
import { z } from "zod";

export const EntityCreateRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]),
  // その他のフィールド
});

export type EntityCreateRequest = z.infer<typeof EntityCreateRequestSchema>;
```

### 更新用 (`requests/admin/entity_update_request.ts`)

```typescript
import { z } from "zod";

export const EntityUpdateRequestSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  // その他のフィールド
});

export type EntityUpdateRequest = z.infer<typeof EntityUpdateRequestSchema>;
```

## 7. レイアウト設定

### メニュー追加 (`layout.tsx`)

```typescript
const menuItems = [
  // 既存のメニュー項目...
  {
    icon: <IconComponent className="w-5 h-5" />,
    label: t("entities"),
    href: "/admin/entities",
  },
];
```

## 8. 重要なルールとベストプラクティス

### 8.1 認証・認可
- 全ての管理画面で管理者権限チェックを実施（`layout.tsx`で実装済み）

### 8.2 エラーハンドリング
- try-catchでエラーを適切に処理
- ユーザーフレンドリーなエラーメッセージを表示
- コンソールに詳細なエラーログを出力

### 8.3 型安全性
- TypeScriptの厳密な型付けを使用
- `any`型の使用は避け、適切な型を定義
- Zodスキーマによるバリデーション

### 8.4 パフォーマンス
- Suspenseを使用したローディング状態の表示
- ページネーション必須（pageSize: 20）
- 適切なデータベースインデックス

### 8.5 URL設計
- RESTfulな設計に従う
- kebab-caseを使用
- 階層構造を明確にする

### 8.6 データ表示
- 日付フィールドは`type: "datetime"`を使用
- リンクフィールドは`type: "link"`でオプション設定
- null値は適切に処理（"なし"/"None"表示）

### 8.7 国際化
- 全てのテキストは翻訳キーを使用
- 日本語・英語の両方をサポート

### 8.8 UI/UX
- パンくずリストで現在位置を明確化
- 一貫したボタンラベルと色使い
- レスポンシブデザイン対応

## 9. チェックリスト

新しい管理画面を追加する際のチェックリスト：

- [ ] ディレクトリとファイル構造の作成
- [ ] Repository実装（findAll, findById, create, update, delete）
- [ ] 一覧画面実装（DataTable使用）
- [ ] 詳細画面実装（DataView使用）
- [ ] 編集画面実装（DataForm使用、必要な場合のみ）
- [ ] 新規作成画面実装（必要な場合のみ）
- [ ] Server Actions実装
- [ ] バリデーションスキーマ定義
- [ ] 翻訳メッセージ追加（日本語・英語）
- [ ] レイアウトメニューに追加
- [ ] breadcrumbsにhref設定
- [ ] 日付フィールドのtype設定
- [ ] リンクフィールドの設定
- [ ] エラーハンドリング実装
- [ ] 動作テスト

このガイドラインに従うことで、一貫性があり保守性の高い管理画面を効率的に構築できます。


---


# auth-db-design

---
description: 認証機能の DB 設計とデータ整合性を確認するためのガイド
alwaysApply: false
---
# Better Auth 対応 認証データベース設計ガイド

本リポジトリの認証基盤は **Better Auth + Prisma** を採用しており、ユーザー／セッション／検証トークンを PostgreSQL で管理します。本書では現行スキーマの役割、カラム仕様、アプリケーションコードとの結びつきを整理します。

## スキーマ全体像

`prisma/schema.prisma` で定義している主要モデルは以下のとおりです。

| モデル | 役割 | 主な関連 |
| ------ | ---- | -------- |
| `User` | エンドユーザー情報の中核。プロファイル／権限を保持 | `Session`, `Account`, `PasswordReset`, `EmailVerification` |
| `Session` | Better Auth のセッショントークンと付加情報 | `User` (多対1) |
| `Account` | 認証プロバイダー単位のクレデンシャル管理。Credential プロバイダーで PBKDF2 ハッシュも保持 | `User` |
| `Verification` | Better Auth が利用する汎用検証トークン（主にメール検証） | なし |
| `PasswordReset` | ドメインサービスが発行するパスワードリセットトークン | `User` |
| `EmailVerification` | サービス独自のメール検証トークン（再送・状態管理用） | `User` |

以降では各モデルを詳しく解説します。コメントは schema.prisma の内容に準じます。

## User モデル

```prisma
model User {
  id            String   @id @default(uuid()) @db.Uuid
  name          String
  email         String   @unique
  password      String
  permissions   Json
  language      String   @default("")
  avatarKey     String?  @map("avatar_key")
  isActive      Boolean  @default(true) @map("is_active")
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  passwordResets     PasswordReset[]
  emailVerifications EmailVerification[]
  sessions           Session[]
  accounts           Account[]

  @@map("users")
}
```

- `permissions` は JSON 配列で格納し、Better Auth セッション書き戻し時にマージされます。
- `language` は UI の既定言語。`hooks/useAuthSession` から参照されることがあります。
- `emailVerified` はドメイン側（`AuthService.verifyEmail*`）と Better Auth 両方で利用され、ミドルウェアのアクセス制御にも関与します。

## Session モデル

```prisma
model Session {
  id          String   @id @default(cuid())
  userId      String   @map("user_id") @db.Uuid
  token       String   @unique
  expiresAt   DateTime @map("expires_at")
  accessToken String?  @map("access_token")
  permissions Json?    @map("permissions")
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}
```

- Better Auth の `session.additionalFields` と同期しており、`accessToken` / `permissions` はサーバーアクションで付与されます。
- `cookieCache` 機能を有効にしているため、`updatedAt` の更新頻度に注意（`updateAge`=4h）。
- 監査ログや IP 制限が必要になった場合は `ipAddress` / `userAgent` を参照し、集計できるようにしています。

## Account モデル

```prisma
model Account {
  id                    String    @id @default(cuid())
  userId                String    @map("user_id") @db.Uuid
  providerId            String    @map("provider_id")
  accountId             String    @map("account_id")
  accessToken           String?   @map("access_token")
  refreshToken          String?   @map("refresh_token")
  idToken               String?   @map("id_token")
  accessTokenExpiresAt  DateTime? @map("access_token_expires_at")
  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at")
  scope                 String?   @map("scope")
  password              String?   @map("password")
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@index([userId])
  @@map("accounts")
}
```

- 現状は `providerId = "credential"` のみを想定し、`password` カラムに PBKDF2 ハッシュを保持。`syncCredentialAccount()` で同期します。
- 外部 IdP を追加する際は `providerId` / `accountId` ペアで一意制約となるようにしてください。

## Verification モデル

```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String   @map("token")
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([identifier])
  @@map("verifications")
}
```

- Better Auth の内部 API が利用する汎用トークンテーブルです。メール検証やパスワードレスログインなどで使用される可能性があります。
- アプリ側で直接参照するケースは現状ありませんが、クリーンアップを予定する場合は `expiresAt` を条件に削除してください。

## PasswordReset モデル

```prisma
model PasswordReset {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique
  expiresAt BigInt   @map("expires_at")
  usedAt    BigInt?  @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("password_resets")
}
```

- `AuthService.createResetToken()` が生成・保存。`expiresAt` / `usedAt` は `BigInt`（UNIX time）で管理します。
- 有効期限切れトークンのクリーンアップは `AuthService.cleanupExpiredTokens()` を参照。

## EmailVerification モデル

```prisma
model EmailVerification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  token     String   @unique
  expiresAt BigInt   @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
  @@map("email_verifications")
}
```

- メール認証の再送や状態表示に使用します。Better Auth 標準の `Verification` とは別個に管理する点に注意してください（ドメイン都合のため）。
- `AuthService.sendVerificationEmail()` が新規レコードを作成し、使用後は `deleteUserTokens()` で削除します。

## モデル間の関係と整合性

- すべての従属テーブルは `onDelete: Cascade` を設定しているため、ユーザー削除時には関連データがまとめて消去されます。
- サインイン時は `AuthService.signIn()` → `establishSession()` の流れで `Session` と `Account` が更新されるため、トランザクション整合性を保ちたい場合は今後 `prisma.$transaction` への拡張を検討してください。
- 追加の外部プロバイダーを実装する際は `Account` テーブルに必要なカラム（refresh token 等）が揃っているか確認し、不足があればマイグレーションを作成します。

## マイグレーション運用

- Prisma のマイグレーションは `prisma/migrations/` に記録されます。Better Auth 関連のスキーマ変更を行った場合は、マイグレーションファイルに **意図とリスク** をコメント等で残すことを推奨します。
- 本番環境へデプロイする際は `prisma migrate deploy` を使用してください。ローカル検証では `prisma migrate dev` を利用し、`npm run docker:db:setup` で LocalStack/DB と合わせて初期化できます。

## 開発時のチェックリスト

1. **新しいフィールドを追加したら** `src/models/user.ts` や `AuthSchema` を同期し、サーバーアクション／テストが型チェックを通るようにする。
2. **Better Auth の追加フィールドを増やす場合** は `Session` モデルと `session.additionalFields` の両方を更新し、`jest.setup.ts` のモックも忘れずに。
3. **削除やデータ移行を行う場合**、`syncCredentialAccount()` や `AuthService` のロジックが期待通り動作するか E2E (`e2e/auth.spec.ts`) を通して確認する。

---

このドキュメントを更新した際は、README や環境変数テンプレートも合わせて見直し、開発者体験を揃えてください。


---


# auth

---
description: 認証まわりの実装・改修時に参照するガイド
alwaysApply: false
---
# Better Auth + Prisma 認証システム実装ガイド

このドキュメントでは、本リポジトリで採用している **Better Auth** と **Prisma** を組み合わせた認証基盤の構成・運用方法をまとめます。サーバー／クライアントのエントリポイント、DB スキーマ、サーバーアクション連携までを俯瞰し、改修時に必要な判断材料を提供することを目的としています。

## 目次

- [Better Auth + Prisma 認証システム実装ガイド](#better-auth--prisma-認証システム実装ガイド)
  - [目次](#目次)
  - [全体像](#全体像)
  - [主要依存関係](#主要依存関係)
  - [ディレクトリ構造](#ディレクトリ構造)
  - [環境変数](#環境変数)
  - [サーバー実装](#サーバー実装)
  - [クライアント実装](#クライアント実装)
  - [サーバーアクションとフロー](#サーバーアクションとフロー)
    - [サインイン (`src/app/(site)/(unauthorized)/auth/signin/actions.ts`)](#サインイン-srcappsiteunauthorizedauthsigninactionsts)
    - [サインアップ (`src/app/(site)/(unauthorized)/auth/signup/actions.ts`)](#サインアップ-srcappsiteunauthorizedauthsignupactionsts)
    - [サインアウト (`src/app/(site)/(authorized)/(app)/actions.ts` など)](#サインアウト-srcappsiteauthorizedappactionsts-など)
  - [ミドルウェアとルーティング制御](#ミドルウェアとルーティング制御)
  - [セキュリティと監査ポイント](#セキュリティと監査ポイント)
  - [テスト戦略](#テスト戦略)

## 全体像

- 認証は **Better Auth** の `betterAuth()` を用いてサーバー側に常駐させ、Prisma アダプターで PostgreSQL の `Session` / `Account` / `Verification` テーブルを管理します。
- ログインフォームなどの UI は Server Action 経由で `AuthService`（既存のドメインサービス）に委譲し、アクセストークンや権限情報を Better Auth セッションに書き戻します。
- クライアント側でセッション状態を取得する箇所は `better-auth/react` のクライアントを薄くラップした `src/libraries/auth-client.ts` と `hooks/useAuthSession.ts` を使用します。
- 既存の API クライアントや権限チェックは `session.permissions` / `session.accessToken` を使用するよう統一されています。

## 主要依存関係

`package.json` から認証に直結するものを抜粋します。

```jsonc
{
  "dependencies": {
    "better-auth": "^1.3.29",
    "@better-fetch/fetch": "^1.1.18",
    "@prisma/client": "^6.8.2",
    "next-intl": "^3.26.3"
  },
  "devDependencies": {
    "prisma": "^6.8.2",
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```

`better-auth/adapters/prisma` を利用するため、Prisma の生成物は `src/generated/prisma` に配置しています。

## ディレクトリ構造

```
src/
├── app/
│   ├── api/auth/[...all]/route.ts    # Better Auth の Next.js ルートハンドラ
│   ├── (site)/(unauthorized)/auth/   # サインイン/アップ等の公開エリア
│   │   └── signin/actions.ts         # Server Action から AuthService と better-auth を連携
│   └── middleware.ts                 # getSessionCookie() を用いた保護ロジック
├── libraries/
│   ├── auth.ts                       # betterAuth() のサーバー設定・ヘルパー群
│   ├── auth-client.ts                # better-auth/react クライアントラッパー
│   └── hash.ts                       # PBKDF2 によるハッシュ/検証
├── hooks/
│   └── useAuthSession.ts             # セッション情報を安全に抽出
├── services/
│   └── auth_service.ts               # 既存 AuthService（DBとSES/メール機能を統括）
├── repositories/                     # Prisma ベースのデータアクセス
└── models/                           # Zod スキーマ（AuthSchema, UserSchema など）

prisma/
├── schema.prisma                     # Better Auth 用 Session / Account / Verification を含む
└── seed.ts                           # 初期データ投入スクリプト
```

## 環境変数

必須となるキーを整理します。全シーンで `.env.sample` / `.env.docker` を参照してください。

| 変数 | 用途 | 備考 |
| ---- | ---- | ---- |
| `BETTER_AUTH_BASE_URL` | Better Auth が生成するリンクのベース URL | dev では `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | セッション暗号化用の秘密鍵 | 旧 `AUTH_SECRET` でも互換を維持（`auth.ts` 側でフォールバック） |
| `NEXT_PUBLIC_BETTER_AUTH_BASE_PATH` | クライアントからの API パス | 既定値 `/api/auth` |
| `ENABLE_EMAIL_VERIFICATION` | メール検証の有効／無効フラグ | サインアップ時の動作切り替え |
| `LOCALSTACK_ENDPOINT` 等 | SES/S3 のエミュレーション | LocalStack 利用時 |

`src/libraries/auth.ts` では `BETTER_AUTH_SECRET` → `AUTH_SECRET` の順で解決し、NextAuth 用のキーには依存しません。

## サーバー実装

`src/libraries/auth.ts` のポイントを押さえます。

```ts
const authInstance = betterAuth({
  baseURL,
  secret,
  database: prismaAdapter(prisma, { transaction: true, usePlural: false }),
  plugins: [nextCookies()],
  session: {
    additionalFields: {
      accessToken: { type: "string", fieldName: "accessToken", returned: true },
      permissions: { type: "json", fieldName: "permissions", returned: true, defaultValue: () => [] }
    },
    cookieCache: { enabled: true, maxAge: 60 * 5 },
    storeSessionInDatabase: true,
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 4
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // サインアップは AuthService 側で制御
    requireEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === "true",
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash)
    }
  }
});
```

公開される主なヘルパー：

- `auth(options)` – `authInstance.api.getSession` を包んだユーティリティ。`disableCookieCache` や `disableRefresh` を切り替え可能。
- `signIn(options)` / `signOut()` – `establishSession` や API 経由で Better Auth セッションを制御。
- `establishSession()` – `signInEmail` 呼び出し後、`Session` テーブルに `accessToken` / `permissions` を書き戻す。
- `syncCredentialAccount()` – Prisma 経由で `Account` テーブルと `User` を同期（既存 AuthService で生成したハッシュを保持）。
- `handlers` – `/api/auth/[...all]` で利用する Next.js ルートハンドラ。

## クライアント実装

`src/libraries/auth-client.ts` では `better-auth/react` の `createAuthClient` を初期化し、`signIn`, `signOut`, `useSession` をエクスポートしています。サーバーと同じベース URL／パスを共有する点が重要です。

`hooks/useAuthSession.ts` は `useSession()` の戻り値を正規化し、

- `session` / `user`
- 最終的な `permissions` 配列（セッション優先）
- `accessToken`

をまとめて返すヘルパーです。UI コンポーネントはこの hook を通じて Better Auth のレスポンス構造を意識せずに済みます。

## サーバーアクションとフロー

### サインイン (`src/app/(site)/(unauthorized)/auth/signin/actions.ts`)

1. `AuthService.signIn()` で資格情報の検証とアクセストークン発行。
2. `syncCredentialAccount()` で `Account` テーブルを更新し Better Auth と認証情報を合わせる。
3. `signIn()` で Better Auth セッションを確立し、`Session` レコードに `accessToken` / `permissions` を保存。
4. エラー時は `invalid_credentials` や `email_not_verified` にマッピングして UI に返却。

### サインアップ (`src/app/(site)/(unauthorized)/auth/signup/actions.ts`)

- `AuthService.signUp()` によりドメインルールに沿ってユーザー作成。
- `ENABLE_EMAIL_VERIFICATION` が有効な場合はアクセストークンを返さずメール検証を要求。
- アクセストークンが返るケースでは、そのまま `signIn()` で Better Auth セッションを作成。

### サインアウト (`src/app/(site)/(authorized)/(app)/actions.ts` など)

- `signOut()` は `authInstance.api.signOut` を呼び出し、クッキーと DB セッションを無効化します。

## ミドルウェアとルーティング制御

`src/middleware.ts` では Better Auth の `getSessionCookie()` と `auth()` を組み合わせ、以下を実装しています。

- `PUBLIC_PAGES` リストに含まれる URL は常に許可。
- 認証が必要なパスかつ未ログインの場合、サインインページへリダイレクト。
- セッション更新を最小化するため、Cookie キャッシュを尊重。

新しい保護ページを追加する際は `PUBLIC_PAGES` の確認と route グループの構成を必ず見直してください。

## セキュリティと監査ポイント

- パスワードは `hash.ts` 内の PBKDF2 実装でハッシュ化されています。Salt/iterations は変更する場合でも `verifyPassword` と整合するようにすること。
- `Session` テーブルに保存する `accessToken` は API 認証で使用されるため、再生成時のインバリデーションポリシーをドキュメント化してください。
- メール検証は `EmailVerification` テーブルで Unix タイムスタンプ (`BigInt`) を使用。LocalStack を利用する場合は `LOCALSTACK_ENDPOINT` が適切に設定されているか確認します。
- `permissions` は JSON 配列で保持されるため、UI 側でも `Array<string>` への正規化を忘れないこと。

## テスト戦略

- Jest のセットアップ (`jest.setup.ts`) で better-auth の主要モジュールをモックし、ESM 由来の取り込み問題を回避しています。構造を変える場合はモックの戻り値 (`useSession` の shape など) を同時に更新してください。
- ユニットテストでは `@/libraries/auth` を直接モックするケースが多いので、`signIn`/`auth` など新しいヘルパーを追加した場合はモックも拡張する必要があります。
- Playwright の E2E (`e2e/auth.spec.ts`) は `/auth/signin` → `/dashboard` のフローで Better Auth のクッキーを検証します。リダイレクト先を変更した場合はテストも合わせて更新してください。

---

Better Auth 周りの変更を実施した際は、

1. 環境変数テンプレートとドキュメントを更新
2. Prisma マイグレーション（セッション構造）を確認
3. Jest/E2E のモック・期待値を同期

することを忘れないでください。


---


# checklist

---
description: 
globs: 
alwaysApply: true
---
# 実装完了後のチェックリスト

実装が完了したら、以下の点について実装が正しく行われているのかを確認し、間違っている場合は修正を行う

- ビルドがエラーなく通る
- モックデータやダミーデータを使った仮実装などがなく、すべて完全に実装されている
- 全てのpage.tsx （App Routerのページファイル）は Server Side Componentになっている
- ページやコンポーネントに書かれている全ての文字列は、国際化の対応がなされている
- 言語ファイルが正しくJSONとしてフォーマットされ、キーの重複がない
- 全てのコンポーネントは、/src/components 以下に置かれ、/src/page には置かれていない
- /src/components/atoms には ShadCN のコンポーネントだけを入れ、カスタマイズなどは行っていない
- 新たに作成したコンポーネントは全てStorybookのコードが存在している
- 全ての新しいコードにUnitTestのコードが書かれている
- 全ての新しいページや機能に対してE2Eテストのコードが書かれている
- 書き換えたコードに関係するUnitTest / E2Eテスト / Storybookがきちんと更新されている
- 全てのUnitTestのコードが正しくPassする
- 全てのE2Eテストのコードが正しくPassする
- テストで screen.getByLabelText() や screen.getByText() を使わず、きちんとテストIDを使ってテストを行っている



---


# component-test

---
description: 
globs: *.tsx
alwaysApply: false
---
# コンポーネントテスト作成ガイドライン

## 概要

本プロジェクトでは、すべてのUIコンポーネントに対して必須でテストを作成します。このガイドラインでは、国際化（i18n）に対応し、アクセシビリティを考慮したテストの作成方法を詳細に説明します。

## 基本原則

### 1. テスト作成の義務化

- **新規コンポーネント作成時**: 必ずテストファイルを同時に作成すること
- **既存コンポーネント改修時**: 対応するテストも必ず更新すること
- **削除時**: コンポーネントを削除する際は、対応するテストも削除すること

### 2. 国際化（i18n）対応の原則

- **日本語テキストを直接使用禁止**: `screen.getByText("設定")` のような記述は禁止
- **表示テキストに依存しない**: 言語変更に影響されないテスト設計
- **data-testid、aria-label、roleを活用**: 言語に依存しない識別子を使用

### 3. アクセシビリティファースト

- **セマンティックHTML**: 適切なHTML要素とロールを使用
- **aria属性の活用**: aria-label、aria-expanded等を適切に設定
- **キーボードナビゲーション**: フォーカス管理とキーボード操作を考慮

## テスト識別子の使用方法

### 1. data-testid属性

最も確実で言語に依存しない要素識別方法です。

#### コンポーネント側の実装

```tsx
// ✅ 良い例
export default function UserMenu() {
  return (
    <div data-testid="user-menu-container">
      <button data-testid="user-menu-button">
        <User className="w-5 h-5" />
        <span>{user.name}</span>
      </button>
      {isOpen && (
        <div data-testid="user-menu-dropdown">
          <button data-testid="settings-button">
            <Settings className="w-4 h-4" />
            {t("settings")}
          </button>
          <button data-testid="logout-button">
            <LogOut className="w-4 h-4" />
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
```

#### テスト側での使用

```tsx
describe("UserMenu", () => {
  it("should toggle menu when button is clicked", () => {
    render(<UserMenu />);
    
    const menuButton = screen.getByTestId("user-menu-button");
    fireEvent.click(menuButton);
    
    expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
  });
});
```

#### data-testid命名規則

- **ケバブケース**: `user-menu-button`（単語をハイフンで区切り）
- **階層構造**: `parent-child-element`の形式
- **意味のある名前**: 機能や役割を表現する名前を使用

```tsx
// 命名例
data-testid="pagination-info"           // 情報表示
data-testid="pagination-start"          // 開始番号
data-testid="pagination-end"            // 終了番号
data-testid="pagination-total"          // 合計数
data-testid="no-results-message"        // 結果なしメッセージ
data-testid="search-form-container"     // 検索フォーム
data-testid="search-input-field"        // 検索入力フィールド
data-testid="search-submit-button"      // 検索実行ボタン
```

### 2. aria-label属性

アクセシビリティとテストの両方に有効です。

#### コンポーネント側の実装

```tsx
export default function HeaderUserMenu() {
  return (
    <button
      data-testid="user-menu-button"
      aria-label="User menu"
      aria-expanded={isMenuOpen}
    >
      <Settings data-testid="settings-icon" />
      {user.name}
    </button>
  );
}
```

#### テスト側での使用

```tsx
it("should have proper accessibility attributes", () => {
  render(<HeaderUserMenu />);
  
  // aria-labelを使用したテスト
  const menuButton = screen.getByRole("button", { name: "User menu" });
  expect(menuButton).toHaveAttribute("aria-expanded", "false");
  
  fireEvent.click(menuButton);
  expect(menuButton).toHaveAttribute("aria-expanded", "true");
});
```

### 3. アイコンのdata-testid

視覚的要素のテストに重要です。

#### アイコンのモック設定

```tsx
// lucide-reactアイコンのモック
jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">Chevron Down</div>,
}));
```

#### アイコンテスト

```tsx
it("should render correct icons", () => {
  render(<UserMenu />);
  
  expect(screen.getByTestId("user-icon")).toBeInTheDocument();
  
  fireEvent.click(screen.getByTestId("user-menu-button"));
  
  expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
  expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
});
```

### 4. getByRoleによるアクセシビリティテスト

セマンティックHTMLとアクセシビリティの検証に使用します。

```tsx
it("should test functionality using semantic roles", () => {
  render(<UserMenu />);
  
  // roleベースの要素取得
  const menuButton = screen.getByRole("button", { name: "User menu" });
  const navigation = screen.getByRole("navigation", { name: "Pagination" });
  const heading = screen.getByRole("heading", { level: 1 });
  
  // インタラクションテスト
  fireEvent.click(menuButton);
  
  const settingsButton = screen.getByRole("button", { name: "Settings" });
  expect(settingsButton).toBeInTheDocument();
});
```

## 実装パターンとベストプラクティス

### 1. コンポーネントの構造化

```tsx
// ✅ 推奨パターン
export default function DataTable({ data }: Props) {
  return (
    <div data-testid="data-table-container">
      <div data-testid="data-table-header">
        <h2 data-testid="data-table-title">{title}</h2>
        <button 
          data-testid="data-table-refresh-button"
          aria-label="Refresh data"
        >
          <RefreshIcon data-testid="refresh-icon" />
        </button>
      </div>
      
      <table data-testid="data-table" role="table">
        <thead data-testid="data-table-head">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                data-testid={`data-table-header-${column.key}`}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody data-testid="data-table-body">
          {data.map((row) => (
            <tr 
              key={row.id}
              data-testid={`data-table-row-${row.id}`}
            >
              {/* セル内容 */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 2. 動的testidの使用

```tsx
// リスト要素やデータドリブンコンポーネント
{items.map((item) => (
  <div 
    key={item.id}
    data-testid={`item-${item.id}`}
    aria-label={`Item ${item.name}`}
  >
    <button data-testid={`item-${item.id}-edit-button`}>
      Edit
    </button>
    <button data-testid={`item-${item.id}-delete-button`}>
      Delete  
    </button>
  </div>
))}
```

### 3. 条件分岐のテスト対応

```tsx
export default function StatusIndicator({ status }: Props) {
  return (
    <div data-testid="status-indicator">
      {status === "loading" && (
        <div data-testid="loading-indicator" aria-label="Loading">
          <Spinner data-testid="loading-spinner" />
        </div>
      )}
      {status === "error" && (
        <div data-testid="error-indicator" role="alert">
          <AlertIcon data-testid="error-icon" />
          <span data-testid="error-message">Error occurred</span>
        </div>
      )}
      {status === "success" && (
        <div data-testid="success-indicator" role="status">
          <CheckIcon data-testid="success-icon" />
          <span data-testid="success-message">Success</span>
        </div>
      )}
    </div>
  );
}
```

## テストファイルのベストプラクティス

### 1. テストファイルの基本構造

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import ComponentName from "@/components/path/ComponentName";

// モックの設定
jest.mock("lucide-react", () => ({
  IconName: () => <div data-testid="icon-name">Icon</div>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe("ComponentName", () => {
  const defaultProps = {
    // デフォルトprops
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render component with required elements", () => {
      render(<ComponentName {...defaultProps} />);
      
      expect(screen.getByTestId("component-container")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should handle button click", () => {
      const mockCallback = jest.fn();
      render(<ComponentName {...defaultProps} onAction={mockCallback} />);
      
      fireEvent.click(screen.getByTestId("action-button"));
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ComponentName {...defaultProps} />);
      
      const button = screen.getByRole("button", { name: "Action" });
      expect(button).toHaveAttribute("aria-label", "Action");
    });
  });

  describe("States", () => {
    it("should handle loading state", () => {
      render(<ComponentName {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });
  });
});
```

### 2. 必須モック一覧

#### Next.jsコンポーネント

```tsx
// next/link
jest.mock("next/link", () => {
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  return MockLink;
});

// next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    return <img {...restProps} />;
  },
}));

// next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/current/path",
  useSearchParams: () => new URLSearchParams(),
}));
```

#### 国際化（next-intl）

```tsx
// next-intl/server
const mockTranslation = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    "button.save": "Save",
    "button.cancel": "Cancel",
    "message.success": "Success",
    "message.error": "Error",
  };
  return translations[key] || key;
});

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => Promise.resolve(mockTranslation)),
}));

// next-intl (client)
jest.mock("next-intl", () => ({
  useTranslations: () => mockTranslation,
  useFormatter: () => ({
    dateTime: (date: Date) => date.toLocaleDateString(),
    number: (num: number) => num.toLocaleString(),
  }),
}));
```

#### アイコンライブラリ

```tsx
// lucide-react
jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon">User</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash: () => <div data-testid="trash-icon">Trash</div>,
  ChevronLeft: () => <div data-testid="chevron-left">←</div>,
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
  ChevronUp: () => <div data-testid="chevron-up">↑</div>,
  ChevronDown: () => <div data-testid="chevron-down">↓</div>,
}));
```

### 3. 複雑なコンポーネントのテスト

#### フォームコンポーネント

```tsx
describe("ContactForm", () => {
  it("should validate form inputs", async () => {
    const mockSubmit = jest.fn();
    render(<ContactForm onSubmit={mockSubmit} />);
    
    // 必須フィールドのテスト
    const submitButton = screen.getByTestId("form-submit-button");
    fireEvent.click(submitButton);
    
    expect(screen.getByTestId("name-error-message")).toBeInTheDocument();
    expect(screen.getByTestId("email-error-message")).toBeInTheDocument();
    
    // 正常な入力のテスト
    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "John Doe" }
    });
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "john@example.com" }
    });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com"
      });
    });
  });
});
```

#### データテーブルコンポーネント

```tsx
describe("DataTable", () => {
  const mockData = [
    { id: "1", name: "Item 1", status: "active" },
    { id: "2", name: "Item 2", status: "inactive" },
  ];

  it("should render table with data", () => {
    render(<DataTable data={mockData} />);
    
    expect(screen.getByTestId("data-table")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("data-table-row-2")).toBeInTheDocument();
  });

  it("should handle row actions", () => {
    const mockEdit = jest.fn();
    const mockDelete = jest.fn();
    
    render(
      <DataTable 
        data={mockData} 
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );
    
    fireEvent.click(screen.getByTestId("data-table-row-1-edit-button"));
    expect(mockEdit).toHaveBeenCalledWith("1");
    
    fireEvent.click(screen.getByTestId("data-table-row-1-delete-button"));
    expect(mockDelete).toHaveBeenCalledWith("1");
  });
});
```

## アクセシビリティテストのガイドライン

### 1. 基本的なアクセシビリティチェック

```tsx
describe("Accessibility", () => {
  it("should have proper heading hierarchy", () => {
    render(<PageComponent />);
    
    const headings = screen.getAllByRole("heading");
    expect(headings[0]).toHaveAttribute("aria-level", "1"); // h1
    expect(headings[1]).toHaveAttribute("aria-level", "2"); // h2
  });

  it("should have alt text for all images", () => {
    render(<ImageGallery />);
    
    const images = screen.getAllByRole("img");
    images.forEach((image) => {
      expect(image).toHaveAttribute("alt");
      expect(image.getAttribute("alt")).not.toBe("");
    });
  });

  it("should have proper form labels", () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("should support keyboard navigation", () => {
    render(<DropdownMenu />);
    
    const menuButton = screen.getByRole("button", { name: "Menu" });
    
    // Enterキーでメニューを開く
    fireEvent.keyDown(menuButton, { key: "Enter" });
    expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    
    // Escapeキーでメニューを閉じる
    fireEvent.keyDown(menuButton, { key: "Escape" });
    expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
  });
});
```

### 2. ARIA属性のテスト

```tsx
it("should have proper ARIA attributes", () => {
  render(<TabPanel />);
  
  const tablist = screen.getByRole("tablist");
  expect(tablist).toHaveAttribute("aria-label", "Navigation tabs");
  
  const tabs = screen.getAllByRole("tab");
  tabs.forEach((tab, index) => {
    expect(tab).toHaveAttribute("aria-selected");
    expect(tab).toHaveAttribute("aria-controls");
  });
  
  const tabpanels = screen.getAllByRole("tabpanel");
  tabpanels.forEach((panel) => {
    expect(panel).toHaveAttribute("aria-labelledby");
  });
});
```

## よくある間違いと対策

### 1. ❌ 避けるべきパターン

```tsx
// ❌ 日本語テキストに依存
expect(screen.getByText("設定")).toBeInTheDocument();
expect(screen.getByText("ログアウト")).toBeInTheDocument();

// ❌ 曖昧なセレクタ
expect(screen.getByText("Submit")).toBeInTheDocument();
expect(container.querySelector("button")).toBeInTheDocument();

// ❌ 実装詳細への依存
expect(component.state.isOpen).toBe(true);
expect(wrapper.find('.menu-item')).toHaveLength(3);

// ❌ 不適切なwait
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 2. ✅ 推奨パターン

```tsx
// ✅ data-testidを使用
expect(screen.getByTestId("settings-button")).toBeInTheDocument();
expect(screen.getByTestId("logout-button")).toBeInTheDocument();

// ✅ 意味のあるロールとラベル
expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "Main menu" })).toBeInTheDocument();

// ✅ ユーザーの動作に基づいたテスト
fireEvent.click(screen.getByTestId("menu-button"));
expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

// ✅ 適切な非同期処理
await waitFor(() => {
  expect(screen.getByTestId("success-message")).toBeInTheDocument();
});
```

## 非同期処理とモーダルテスト

### 1. 非同期データローディング

```tsx
it("should handle async data loading", async () => {
  const mockFetch = jest.fn().mockResolvedValue([
    { id: 1, name: "Item 1" }
  ]);
  
  render(<AsyncDataComponent fetchData={mockFetch} />);
  
  // ローディング状態の確認
  expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  
  // データロード完了の待機
  await waitFor(() => {
    expect(screen.getByTestId("data-item-1")).toBeInTheDocument();
  });
  
  expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
});
```

### 2. モーダルダイアログ

```tsx
it("should handle modal dialog", async () => {
  render(<ModalComponent />);
  
  // モーダルを開く
  fireEvent.click(screen.getByTestId("open-modal-button"));
  
  await waitFor(() => {
    expect(screen.getByTestId("modal-dialog")).toBeInTheDocument();
  });
  
  expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  
  // モーダルを閉じる
  fireEvent.click(screen.getByTestId("modal-close-button"));
  
  await waitFor(() => {
    expect(screen.queryByTestId("modal-dialog")).not.toBeInTheDocument();
  });
});
```

## テストカバレッジの目標

### 1. 必須テストケース

すべてのコンポーネントで以下をテストする：

- **基本レンダリング**: コンポーネントが正常に表示される
- **Props受け渡し**: 異なるPropsでの動作確認
- **イベントハンドリング**: クリック、入力などのインタラクション
- **状態変化**: ローディング、エラー、成功状態
- **アクセシビリティ**: ARIA属性、キーボードナビゲーション
- **エッジケース**: 空データ、エラー条件、境界値

### 2. カバレッジ目標

- **コンポーネント**: 90%以上
- **重要な機能**: 100%
- **エラーハンドリング**: 85%以上

## チェックリスト

コンポーネント作成時は以下を確認：

### コンポーネント実装

- [ ] すべてのインタラクティブ要素にdata-testidが設定されている
- [ ] ボタンやリンクに適切なaria-labelが設定されている
- [ ] アイコンにdata-testidが設定されている
- [ ] セマンティックHTMLが使用されている
- [ ] ARIA属性が適切に設定されている

### テスト実装

- [ ] テストファイルが作成されている
- [ ] 必要なモックが設定されている
- [ ] 基本レンダリングテストがある
- [ ] インタラクションテストがある
- [ ] アクセシビリティテストがある
- [ ] エラー状態のテストがある
- [ ] data-testidを使用してテストしている
- [ ] 日本語テキストに依存していない
- [ ] getByRoleでアクセシビリティを確認している

### 国際化対応

- [ ] 表示テキストがハードコードされていない
- [ ] テストが言語に依存していない
- [ ] 翻訳キーが適切に使用されている

## 参考リソース

- [React Testing Library Documentation](mdc:https:/testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](mdc:https:/testing-library.com/docs/queries/about)
- [Jest Documentation](mdc:https:/jestjs.io/docs/getting-started)
- [Web Accessibility Guidelines](mdc:https:/www.w3.org/WAI/WCAG21/quickref)

このガイドラインに従って、保守性が高く、言語に依存せず、アクセシビリティに配慮したコンポーネントテストを作成してください。


---


# data-access

---
description: This is a specification of this service. Need to refer every time. Apply this rule to the entire repository
globs: *
alwaysApply: true
---
# データアクセス

データアクセスには、`src/repositories` に格納されているリポジトリクラスを必ず利用する。

## リポジトリのルール

リポジトリ層はデータの種類ごとに作られる。例えばユーザー情報を取得するためのユーザー向けアプリケーション用のリポジトリは `src/repositories/user_repositories.ts` に作成することになる。これは、バックエンドがローカルやAirTableなどでも変わらない。

すべてのリポジトリは [base_repository.ts](mdc:src/repositories/base_repository.ts) にある BaseRepository を継承する。ただし、そのデータの種類によって BaseRepositoryを継承した別のクラスを継承する場合がある。たとえば、Prismaを利用する場合は、

なお、リクエストやレスポンスなどのスキーマをRepositoryのファイルに書くことは禁止する。レスポンスのモデルは `/src/models` 以下に、リクエストは `/src/requests` に書くこと。

### 1. Prismaにアクセスする場合

データベースにはPrismaを利用する。この場合は、 [prisma_repository.ts](mdc:src/repositories/prisma_repository.ts) を継承してリポジトリを作成する。

### 2. APIサーバを別途用意している場合

BaseRepositoryを直接継承して作成する。

### 3. ローカルデータにアクセスする場合

プロトタイプを作る際には、別途サーバを用意するのでは無く、`public/data` 下にJSONデータや画像などを置き、それに直接アクセスさせる場合がある。その際には、 [local_repository.ts](mdc:src/repositories/local_repository.ts) のLocalRepositoryを継承して利用する。データは `public/data/[モデル名]/index.json` に一覧、`public/data/[モデル名]/[id].json` にデータを格納しておく。ローカルデータアクセスの場合は、データのアップデートや作成、削除は対応しない。

### 4. AirTableにアクセスする場合

プロトタイプを作る際でも、データを作成、保存、削除がしたい場合には、AirTableをバックエンドとして利用する。この場合は、 [airtable_repository.ts](mdc:src/repositories/airtable_repository.ts) を継承してリポジトリを作成する。

### 5. Difyにアクセスする場合

AIを利用する際に、AIのワークフロー実行にはDifyを利用する。チャットのために利用する場合は、 [chat_repository.ts](mdc:src/repositories/chat_repository.ts) を利用する。それ以外のワークフローを利用する場合は、 [workflow_repository.ts](mdc:src/repositories/workflow_repository.ts) を利用する。


## 新たにAPIサーバ以外のサードパーティAPIにアクセスするRepositoryを作成する場合

[airtable_repository.ts](mdc:src/repositories/airtable_repository.ts) と同様に、`/src/repositories/' に、 [base_repository.ts](mdc:src/repositories/base_repository.ts) のBaseRepositoryを継承したモデルを作成する。そして、そのサードパーティAPIを使うデータアクセスは、その新しいリポジトリを継承して作成する必要がある。

### データモデル

リポジトリによって返されるデータは、 `app/models/` の下に定義される。Repositoryと同様、管理画面用のモデルは `src/models` に、ユーザー向けアプリケーション用のモデルは `src/models` に定義される。その名前は `users` のようにモデルの複数形となる（Snake Caseを利用）。モデルは以下のように、zod を利用して定義される。

```typescript
import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  permissions: z.array(z.string()),
});

export type User = z.infer<typeof UserSchema>;
```

リクエストは、`app/requests` の下に定義される。Repositoryと同様、管理画面用のモデルは `src/requests/admin` に、ユーザー向けアプリケーション用のモデルは `src/requests/app` に定義される。 [user_create_request.ts](mdc:src/requests/admin/user_create_request.ts) と [user_update_request.ts](mdc:src/requests/admin/user_update_request.ts) のように、[モデル名（単数形）]_[アクション名]_request.ts という名称で定義し、こちらも zod を使って定義する。

```typescript
export const UserCreateRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  permissions: permissionsSchema,
});

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
```



---


# how-to-add-page-and-component

---
description: React page and component create/update guideline, need alyways check when you build pages / components.
globs: *
alwaysApply: true
---
# ページ・コンポーネント作成ガイドライン

このドキュメントは、本プロジェクトにおけるNext.js (App Router) を使用したページおよびコンポーネントの作成方法に関するルールとベストプラクティスをまとめたものです。

## 1. 基本原則

-   **TypeScript の徹底**: 全てのコードはTypeScriptで記述します。`any` 型の使用は原則禁止です。
-   **Server Components First**:可能な限りServer Componentsを使用し、インタラクティブ性が必要な場合にのみClient Componentsを導入します。
-   **関心の分離**: UI、状態管理、データフェッチのロジックを適切に分離します。
-   **命名規則**: ファイル名、ディレクトリ名、コンポーネント名、変数名などは一貫性のある命名規則に従います。（詳細は後述）
-   **ディレクトリ構造**: 機能ごと、またコンポーネントの種類（atoms, molecules, organisms）ごとに整理されたディレクトリ構造を維持します。（詳細は後述）
-   **PWA対応**: PWAとしての動作を意識し、必要な箇所（ヘッダー、フッターなど）には `env(safe-area-inset-*)` を適用します。
-   **Server Side Actionの利用**: DBへのアクセスなど、サーバでの処理が必要なものは、APIを作るのではなく、サーバ再度アクションで行う。`page.tsx` と同じディレクトリに、そのページで使うアクションをまとめた `actions.ts` を配置する。

## 2. ディレクトリ構造とファイル命名規則

### 2.1. ページ (App Router)

-   ページは `src/app` ディレクトリ以下に配置します。
-   ルートセグメントのディレクトリ名（例: `(site)`, `(authorized)`, `(app)`）は小文字ケバブケース（例: `my-page`）または括弧で囲まれたグループ名を使用します。
-   各ページのメインファイルは `page.tsx` とします。
-   ページに関連するServer Actionsは、同階層または専用の `actions.ts` ファイルに記述します。
    -   例: `src/app/(site)/(authorized)/(app)/actions.ts`
-   `src/app/api` は Authのために作られたAPIを置くが、新たにAPIを作成することは**禁止**する。代わりにServer Side Actionを使う。

### 2.2. コンポーネント (`src/components`)

-   全てのUIコンポーネントは `src/components` ディレクトリ以下に配置します。
-   コンポーネントはAtomic Designの考え方に基づき、`atoms`, `molecules`, `organisms` のいずれかのサブディレクトリに分類します。
    -   **atoms**: それ以上分割できない最小単位のUI要素（例: `Button`, `Input`, `Icon`）。Shadcn/UIから提供されるコンポーネントが主にここに該当します。原則として、このディレクトリにカスタムコンポーネントを新規作成することは避け、Shadcn/UIのものをそのまま利用するか、ラッパーを作成する場合は `molecules` 以上に配置します。
    -   **molecules**: 複数のatomを組み合わせて作られる、より具体的な機能を持つUI部品（例: `SearchInput` (Input atom + Button atom), `UserAvatarMenu`）。
    -   **organisms**: 複数のmoleculeやatomを組み合わせて作られる、ページのセクションや独立したUI領域（例: `AppHeader`, `RecordList`, `ProductCardGrid`）。
-   **各コンポーネントのファイル構成**: `molecules` および `organisms` に属するコンポーネントは、以下の構造を取ります。
    -   コンポーネント名を `PascalCase` としたディレクトリを作成します。
    -   そのディレクトリ直下に `index.tsx` を作成し、コンポーネントのメインロジックを記述します。
    -   例:
        ```
        src/components/
        ├── molecules/
        │   └── PetFilter/
        │       └── index.tsx  // PetFilterコンポーネント本体
        └── organisms/
            └── AppHeader/
                └── index.tsx  // AppHeaderコンポーネント本体
        ```
-   **`atoms` のコンポーネント**: Shadcn/UIから提供されるものは、通常 `src/components/ui` に配置されることが多いですが、本プロジェクトでは既存の `src/components/atoms` をShadcn/UIコンポーネントの格納場所として扱います。これらは直接編集せず、拡張する場合は `molecules` 以上でラップします。

### 2.3. 型定義

-   プロジェクト全体で使用する型定義は `src/types/index.ts` に集約します。
-   コンポーネント固有の型定義（Propsの型など）は、そのコンポーネントファイル (`index.tsx`) 内に記述します。

## 3. コンポーネント設計

### 3.1. Server Components と Client Components の使い分け

-   **Server Components (`page.tsx` や `organisms` の一部など)**:
    -   データフェッチ（Server Actions経由または直接的なDBアクセス）や、状態を持たないUIのレンダリングを担当します。
    -   イベントハンドラ（`onClick` など）を直接持つことはできません。
    -   `async/await` を使用してデータ取得が可能です。
-   **Client Components (`molecules` の一部やインタラティブな `organisms` の一部など)**:
    -   ファイルの先頭に `'use client';` ディレクティブを記述します。
    -   `useState`, `useEffect`, `useRouter` などのReactフックを使用できます。
    -   イベントハンドラを持つことができます。
    -   状態管理やクライアントサイドルーティング、ブラウザAPIへのアクセスが必要な場合に使用します。
-   **原則**: Server Component内で完結できるものはServer Componentとして実装します。インタラクティブ性が必要な部分のみを最小限のClient Componentに切り出します。
    -   **NG例**: ページ全体を1つの大きなClient Componentでラップする。
    -   **OK例**: `page.tsx` (Server Component) が静的なレイアウトとデータ取得を行い、ヘッダー内の検索ボタンやフィルタードロップダウン、メインコンテンツ内の月ナビゲーションボタンなど、個々のインタラクティブな要素をそれぞれ独立した小さなClient Componentとして呼び出す。

### 3.2. データフローと状態管理

-   **データ取得**: Server Componentsでは、Server Actions (`actions.ts` に定義) を介してデータを取得します。Client Componentsからデータを再取得・更新する場合も、Server Actionsを呼び出します。
-   **状態管理**: Client Components内のローカルなUI状態は `useState` を使用します。
-   **URLによる状態管理**: ページ全体に影響するフィルター条件（例：選択されたペットID、表示月）は、URLのクエリパラメータで管理することを推奨します。
    -   Client Component（例: `PetFilter`, `MonthNavigator`）がユーザー操作に応じて `next/navigation` の `useRouter` を使ってクエリパラメータを更新します。
    -   URLの変更により `page.tsx` が再実行され、新しいクエリパラメータに基づいてServer Actionsがデータを再取得し、ページが更新されます。
-   **Props Drilling の回避**: 複雑な状態共有が必要な場合は、React Contextや状態管理ライブラリ（Zustandなど）の導入を検討しますが、まずはServer ComponentsとURLによる状態管理、Server Actionsによるデータ更新で対応できないか検討します。

### 3.3. Props

-   コンポーネント間で渡すPropsの型は明確に定義します。
-   Server ComponentsからClient Componentsへ関数（イベントハンドラなど）を渡すことはできません。Client Componentが必要とするインタラクションは、そのClient Component内部で完結させるか、Server Actionsを呼び出す形にします。

### 3.4. スタイリング

-   Tailwind CSS を使用します。
-   コンポーネントのスタイルは、そのコンポーネントファイル内のJSXに直接クラス名を記述します。
-   共通の色やテーマは `tailwind.config.js` で定義されているものを利用します。

## 4. Server Actions (`actions.ts`)

-   ファイルの先頭に `'use server';` ディレクティブを記述します。
-   データベースアクセスや外部API呼び出しなど、サーバーサイドで実行すべきビジネスロジックをここに記述します。
-   データ取得用の関数や、データの作成・更新・削除を行う関数を定義します。
-   Server ComponentsからもClient Componentsからも呼び出し可能です。

## 5. 具体的な実装例 (ホーム画面の場合)

-   `src/app/(site)/(authorized)/(app)/page.tsx` (Server Component):
    -   URLのクエリパラメータ (`petId`, `month`) を読み取ります。
    -   `getPetsServerAction`, `getRecordsServerAction` を呼び出して初期データを取得します。
    -   `AppHeader` (Organism, Server Component) を呼び出し、`leftContent` と `rightContent` にそれぞれ `PetFilter` (Molecule, Client Component) と `SearchButton` (Molecule, Client Component) を `<Suspense>` でラップして配置します。
    -   メインコンテンツエリアに `MonthNavigator` (Molecule, Client Component) と `RecordList` (Organism, Server Component) を配置します。`MonthNavigator` も `<Suspense>` でラップします。
    -   `FloatingActionButton` (Molecule, Client Component) と `TabBar` (Organism, Server Component) を配置します。
-   `src/components/molecules/PetFilter/index.tsx` (Client Component):
    -   `pets` (ペットリスト) をpropsとして受け取ります。
    -   `useState` で選択中のペットIDを管理します。
    -   `useEffect` でURLのクエリパラメータ `petId` を監視し、内部状態と同期します。
    -   ペット選択UI（例: ボタンやShadcn/UIのSelect）をレンダリングし、選択が変更されたら `useRouter` を使ってURLの `petId` クエリパラメータを更新します。
-   `src/components/molecules/MonthNavigator/index.tsx` (Client Component):
    -   Propsは受け取りません（あるいは初期表示月に関するpropsを受け取ることも可能）。
    -   `useState` で現在の表示月 (`Date` オブジェクト) を管理します。
    -   `useEffect` でURLのクエリパラメータ `month` を監視し、内部状態と同期します。
    -   「前月」「次月」ボタンを持ち、クリックされると内部状態を更新し、`useRouter` を使ってURLの `month` クエリパラメータを更新します。
-   `src/components/molecules/SearchButton/index.tsx` (Client Component):
    -   クリックハンドラを持ち、クライアント側での検索UIの表示などを担当します。
-   `src/components/molecules/FloatingActionButton/index.tsx` (Client Component):
    -   クリックハンドラを持ち、クライアント側での新規記録作成ページへの遷移などを担当します。
-   `src/components/organisms/RecordList/index.tsx` (Server Component):
    -   `records` (記録リスト) をpropsとして受け取り、`RecordCard` (Molecule, Server Component) を使って一覧表示します。

## 6. Storybook 対応

-   コンポーネントを `CamelCaseディレクトリ/index.tsx` の形式で作成することにより、将来的にStorybookの`*.stories.tsx` ファイルを各コンポーネントディレクトリ内に配置しやすくなります。
    -   例: `src/components/molecules/PetFilter/PetFilter.stories.tsx`

このガイドラインに従って、一貫性があり、メンテナンスしやすく、パフォーマンスの高いアプリケーションを構築してください。


---


# i18n

---
description: 
globs: 
alwaysApply: true
---
# Next.js + next-intl 国際化システム実装ガイド

このドキュメントは、Next.js 15.3.3とnext-intl 3.26.3を使用した国際化（i18n）システムの実装方法を詳細に説明します。

## 目次

1. [概要](mdc:#概要)
2. [必要な依存関係](mdc:#必要な依存関係)
3. [ディレクトリ構造](mdc:#ディレクトリ構造)
4. [実装手順](mdc:#実装手順)
5. [ファイル別実装詳細](mdc:#ファイル別実装詳細)
6. [使用方法](mdc:#使用方法)
7. [高度な機能](mdc:#高度な機能)
8. [ベストプラクティス](mdc:#ベストプラクティス)

## 概要

このi18nシステムは以下の特徴を持ちます：

- **next-intl** を使用した型安全な国際化
- **日本語と英語**の多言語対応
- **Server Components**と**Client Components**の両方に対応
- **階層的なメッセージ構造**による管理しやすい翻訳
- **TypeScript**による型安全性
- **自動的な言語検出**とフォールバック
- **タイムゾーン対応**（Asia/Tokyo）

## 必要な依存関係

```json
{
  "dependencies": {
    "next": "15.3.3",
    "next-intl": "^3.26.3",
    "react": "19.1.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "typescript": "^5"
  }
}
```

## ディレクトリ構造

```
project/
├── src/
│   ├── i18n/
│   │   ├── request.ts           # next-intl設定
│   │   └── routing.ts           # ルーティング設定
│   ├── app/
│   │   ├── layout.tsx           # ルートレイアウト
│   │   └── providers.tsx        # Providers設定
│   └── ...
├── messages/
│   ├── ja.json                  # 日本語メッセージ
│   └── en.json                  # 英語メッセージ
└── next.config.ts               # Next.js設定
```

## 実装手順

### 1. Next.js設定の更新

```typescript
// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
```

### 2. ルーティング設定

```typescript
// src/i18n/routing.ts
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ja", "en"],
  defaultLocale: "ja",
  pathnames: {
    "/": "/",
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export const { Link, getPathname, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

### 3. リクエスト設定

```typescript
// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // 有効なlocaleかチェック
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: "Asia/Tokyo",
    messages: (
      await (locale === "en"
        ? // Turbopack使用時にHMRを有効にするため
          import("../../messages/en.json")
        : import(`../../messages/${locale}.json`))
    ).default,
  };
});
```

## ファイル別実装詳細

### 1. ルートレイアウト (`src/app/layout.tsx`)

```typescript
import type { Metadata } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Great App",
  description: "The best app in the world",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  return (
    <html
      lang={locale}
      suppressHydrationWarning={true}
      className="h-full bg-white"
    >
      <body>
        <Providers messages={messages} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Providers設定 (`src/app/providers.tsx`)

```typescript
"use client";
import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "use-intl";

export function Providers({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}) {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Asia/Tokyo"
    >
      {children}
    </NextIntlClientProvider>
  );
}
```

### 3. メッセージファイル構造

#### 日本語メッセージ (`messages/ja.json`)

```json
{
  "Auth": {
    "signin": "ログイン",
    "signup": "新規登録",
    "signout": "ログアウト",
    "email": "メールアドレス",
    "password": "パスワード",
    "invalid_input": "入力内容が不正です",
    "invalid_credentials": "メールアドレスまたはパスワードが不正です"
  },
  "Crud": {
    "create": "新規作成",
    "save": "保存",
    "cancel": "キャンセル",
    "edit": "編集",
    "delete": "削除",
    "saving": "保存中..."
  },
  "Menu": {
    "App": {
      "dashboard": "ダッシュボード"
    },
    "Admin": {
      "dashboard": "ダッシュボード",
      "users": "ユーザー"
    }
  },
  "Components": {
    "Pagination": {
      "previous": "前へ",
      "next": "次へ",
      "no_result_found": "該当するデータがありません"
    }
  }
}
```

#### 英語メッセージ (`messages/en.json`)

```json
{
  "Auth": {
    "signin": "Sign In",
    "signup": "Sign Up", 
    "signout": "Sign Out",
    "email": "Email",
    "password": "Password",
    "invalid_input": "Invalid input",
    "invalid_credentials": "Invalid credentials"
  },
  "Crud": {
    "create": "Create",
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "saving": "Saving..."
  },
  "Menu": {
    "App": {
      "dashboard": "Dashboard"
    },
    "Admin": {
      "dashboard": "Dashboard",
      "users": "Users"
    }
  },
  "Components": {
    "Pagination": {
      "previous": "Previous",
      "next": "Next",
      "no_result_found": "No results found"
    }
  }
}
```

## 使用方法

### Server Componentsでの使用

```typescript
import { getTranslations } from "next-intl/server";

export default async function AdminLayout({ children }: Props) {
  const t = await getTranslations("Menu.Admin");
  
  const menuItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: t("dashboard"),
      href: "/admin/dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: t("users"),
      href: "/admin/users",
    },
  ];

  return (
    <div>
      {/* レイアウトコンテンツ */}
    </div>
  );
}
```

### Client Componentsでの使用

```typescript
"use client";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const tAuth = useTranslations("Auth");
  const tCrud = useTranslations("Crud");

  return (
    <div>
      <h1>{tAuth("signin")}</h1>
      <button>{tAuth("email")}</button>
      <button>{tCrud("save")}</button>
    </div>
  );
}
```

### フォームでの使用例

```typescript
"use client";
import { useTranslations } from "next-intl";

export default function ContactForm() {
  const tAuth = useTranslations("Auth");
  
  const onSubmit = async (data) => {
    try {
      // フォーム送信処理
    } catch (error) {
      setError(tAuth("system_error"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>{tAuth("email")}</label>
      <input type="email" />
      
      <label>{tAuth("password")}</label>
      <input type="password" />
      
      <button type="submit">
        {isLoading ? tAuth("signing_in") : tAuth("signin")}
      </button>
    </form>
  );
}
```

## 高度な機能

### 1. 動的な翻訳

```typescript
// メッセージファイル
{
  "welcome": "こんにちは、{name}さん！",
  "itemCount": "あなたは {count, plural, =0 {アイテムがありません} =1 {1つのアイテム} other {#個のアイテム}} を持っています"
}

// 使用例
const t = useTranslations("Messages");
<p>{t("welcome", { name: "山田太郎" })}</p>
<p>{t("itemCount", { count: 5 })}</p>
```

### 2. Rich Textフォーマット

```typescript
// メッセージファイル
{
  "description": "詳細は<link>こちら</link>をご覧ください"
}

// 使用例
const t = useTranslations("Messages");
<p>{t.rich("description", {
  link: (chunks) => <Link href="/details">{chunks}</Link>
})}</p>
```

### 3. 日付・時間のフォーマット

```typescript
import { useFormatter } from "next-intl";

export default function DateComponent() {
  const format = useFormatter();
  const now = new Date();

  return (
    <div>
      <p>日付: {format.dateTime(now, "short")}</p>
      <p>時刻: {format.dateTime(now, "medium")}</p>
      <p>数値: {format.number(1234.5)}</p>
    </div>
  );
}
```

### 4. 言語切り替えコンポーネント

```typescript
"use client";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // URL のロケールプレフィックスを更新
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <select 
      value={locale} 
      onChange={(e) => handleLocaleChange(e.target.value)}
    >
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
```
### 5. 型安全な翻訳キー

```typescript
// types/i18n.ts
type Messages = typeof import("../../messages/ja.json");
type IntlMessages = Messages;

declare global {
  interface IntlMessages extends Messages {}
}

// 使用時に型安全性が確保される
const t = useTranslations("Auth");
t("signin"); // ✅ 有効
t("invalid_key"); // ❌ TypeScriptエラー
```

### 6. ミドルウェアでの言語検出

```typescript
// middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
```

## ベストプラクティス

### 1. メッセージ構造の組織化

```json
{
  "FeatureName": {
    "ComponentName": {
      "action": "翻訳テキスト",
      "description": "説明文"
    }
  },
  "Common": {
    "buttons": {
      "save": "保存",
      "cancel": "キャンセル"
    },
    "messages": {
      "loading": "読み込み中...",
      "error": "エラーが発生しました"
    }
  }
}
```

### 2. フックの分離

```typescript
// hooks/useAuthTranslations.ts
import { useTranslations } from "next-intl";

export function useAuthTranslations() {
  const t = useTranslations("Auth");
  
  return {
    signin: t("signin"),
    signup: t("signup"),
    email: t("email"),
    password: t("password"),
  };
}

// 使用例
const auth = useAuthTranslations();
<button>{auth.signin}</button>
```

### 3. 翻訳キーの定数化

```typescript
// constants/translationKeys.ts
export const TRANSLATION_KEYS = {
  AUTH: {
    SIGNIN: "signin",
    SIGNUP: "signup",
    EMAIL: "email",
  },
  CRUD: {
    SAVE: "save",
    CANCEL: "cancel",
  },
} as const;

// 使用例
const t = useTranslations("Auth");
<button>{t(TRANSLATION_KEYS.AUTH.SIGNIN)}</button>
```

### 4. 条件付き翻訳

```typescript
export default function StatusMessage({ status }: { status: string }) {
  const t = useTranslations("Status");
  
  const getMessage = () => {
    switch (status) {
      case "success":
        return t("success");
      case "error":
        return t("error");
      case "loading":
        return t("loading");
      default:
        return t("unknown");
    }
  };

  return <div>{getMessage()}</div>;
}
```

### 5. フォームエラーメッセージ

```typescript
// バリデーションスキーマで翻訳を使用
import { useTranslations } from "next-intl";

export function useFormSchema() {
  const t = useTranslations("Validation");
  
  return z.object({
    email: z
      .string()
      .min(1, t("required"))
      .email(t("invalidEmail")),
    password: z
      .string()
      .min(8, t("passwordMinLength")),
  });
}
```

## 注意事項

AIがやりがちな間違いとして、以下のものが挙げられる

- JSONに重複したキーがある
- JSONのフォーマットが正しくない

これらのことが起こらないよう、JSONのフォーマットに正しく従うこと。

## 開発環境での設定

### 1. 翻訳ファイルの自動監視

開発環境では、メッセージファイルの変更が自動的に反映されます：

```typescript
// next.config.ts で Turbopack を有効化
const nextConfig: NextConfig = {
  experimental: {
    turbopack: true, // 開発環境でのHMR改善
  },
};
```

### 2. 翻訳の検証

```bash
# パッケージ追加
npm install --save-dev @formatjs/cli

# スクリプト追加（package.json）
{
  "scripts": {
    "i18n:extract": "formatjs extract 'src/**/*.{ts,tsx}' --out-file messages/extracted.json",
    "i18n:validate": "formatjs validate messages/ja.json messages/en.json"
  }
}
```

## トラブルシューティング

### よくある問題

1. **"useTranslations can only be used in Client Components"エラー**
   - Server Componentでは `getTranslations` を使用
   - Client Componentでは `useTranslations` を使用

2. **翻訳が表示されない**
   - メッセージファイルのJSONが正しい形式か確認
   - キーの階層が正しいか確認
   - import パスが正しいか確認

3. **型エラーが発生する**
   - `@types/node` がインストールされているか確認
   - TypeScript設定でモジュール解決が正しいか確認

## まとめ

このドキュメントでは、next-intlを使用したNext.jsアプリケーションの国際化実装方法を説明しました。この実装により以下が実現できます：

- **型安全性**: TypeScriptによる翻訳キーの検証
- **パフォーマンス**: 必要な言語のメッセージのみロード
- **開発効率**: Server/Client Componentsでの統一されたAPI
- **保守性**: 階層的で管理しやすいメッセージ構造
- **拡張性**: 新しい言語の追加が容易

このガイドに従って実装することで、多言語対応の堅牢なアプリケーションを構築できます。


---


# instructions

---
description: This is a specification of this service. Need to refer every time. Apply this rule to the entire repository
globs: *
alwaysApply: true
---
あなたは高度な問題解決能力を持つAIアシスタントです。以下の指示に従って、効率的かつ正確にタスクを遂行してください。

まず、ユーザーから受け取った指示を必ず以下のように確認します：

<指示>
{{instructions}}
</指示>

この指示を元に、以下のプロセスに従って作業を進めてください：

1. 指示の分析と計画
   <タスク分析>
   - 主要なタスクを簡潔に要約してください。
   - 記載された技術スタックを確認し、その制約内での実装方法を検討してください。  
     **※ 技術スタックに記載のバージョンは変更せず、必要があれば必ず承認を得てください。**
   - 重要な要件と制約を特定してください。
   - 潜在的な課題をリストアップしてください。
   - タスク実行のための具体的なステップを詳細に列挙してください。
   - それらのステップの最適な実行順序を決定してください。
   
   ### 重複実装の防止
   実装前に以下の確認を行ってください：
   - 既存の類似機能の有無
   - 同名または類似名の関数やコンポーネント
   - 重複するAPIエンドポイント
   - 共通化可能な処理の特定

   このセクションは、後続のプロセス全体を導くものなので、時間をかけてでも、十分に詳細かつ包括的な分析を行ってください。
   </タスク分析>

2. タスクの実行
   - 特定したステップを一つずつ実行してください。
   - 各ステップの完了後、簡潔に進捗を報告してください。
   - 実装時は以下の点に注意してください：
     - 適切なディレクトリ構造の遵守
     - 命名規則の一貫性維持
     - 共通処理の適切な配置

3. 品質管理と問題対応
   - 各タスクの実行結果を迅速に検証してください。
   - エラーや不整合が発生した場合は、以下のプロセスで対応してください：
     a. 問題の切り分けと原因特定（ログ分析、デバッグ情報の確認）
     b. 対策案の作成と実施
     c. 修正後の動作検証
     d. デバッグログの確認と分析
   
   - 検証結果は以下の形式で記録してください：
     a. 検証項目と期待される結果
     b. 実際の結果と差異
     c. 必要な対応策（該当する場合）

4. 最終確認
   - すべてのタスクが完了したら、成果物全体を評価してください。
   - 当初の指示内容との整合性を確認し、必要に応じて調整を行ってください。
   - 実装した機能に重複がないことを最終確認してください。

5. 結果報告
   以下のフォーマットで最終的な結果を報告してください：
   ```markdown
   # 実行結果報告

   ## 概要
   [全体の要約を簡潔に記述]

   ## 実行ステップ
   1. [ステップ1の説明と結果]
   2. [ステップ2の説明と結果]
   ...

   ## 最終成果物
   [成果物の詳細や、該当する場合はリンクなど]

   ## 課題対応（該当する場合）
   - 発生した問題と対応内容
   - 今後の注意点

   ## 注意点・改善提案
   - [気づいた点や改善提案があれば記述]

   ## コミットメッセージ
   - [git diffと新規作成したファイルを確認し、修正内容を要約したコミットメッセージを1行で記述]
   ```

## 重要な注意事項

- 不明点がある場合は、作業開始前に必ず確認を取ってください。
- 重要な判断が必要な場合は、その都度報告し、承認を得てください。
- 予期せぬ問題が発生した場合は、即座に報告し、対応策を提案してください。
- **明示的に指示されていない変更は行わないでください。** 必要と思われる変更がある場合は、まず提案として報告し、承認を得てから実施してください。
- **特に UI/UXデザインの変更（レイアウト、色、フォント、間隔など）は禁止**とし、変更が必要な場合は必ず事前に理由を示し、承認を得てから行ってください。
- **技術スタックに記載のバージョン（APIやフレームワーク、ライブラリ等）を勝手に変更しないでください。** 変更が必要な場合は、その理由を明確にして承認を得るまでは変更を行わないでください。
- `.env` は変更しないでください。環境変数の追加が必要な場合は、 `.env.example` に追加をしてください。環境変数の削除や変更は絶対にしないでください。
- /components/atoms は ShadCN コンポーネントのみをおきます（/components/ui は使用しないでください）
- タスクが終わったら、必ず `checklist.mdc` を参照して、タスクが完了しているか確認してください。
- Serena MCPを利用して、コードの理解や分析などを行なってください。
----


---


# specifications

---
description: This is a specification of this service. Need to refer every time. Apply this rule to the entire repository
globs: *
alwaysApply: true
---

# Web Service テンプレート

This is a template for a web service. It includes the following features:

## 提供される機能
- 認証システム
  - ログイン
  - ユーザー登録
  - パスワードリセット
  - メール認証

- 管理画面
  - ユーザー管理
  - アバター登録

- 単独機能
  - メール送信
  - オンラインストレージ保存

## 技術スタック

- システム
  - Next.js
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
- データベース
  - PostgreSQL


---


# storage-provider

---
description: ファイルをストレージに保存する、あるいは新たなストレージプロバイダを追加する際に参照する
globs:
alwaysApply: false
---

# ストレージプロバイダー追加ガイド

このファイルは、既存のストレージサービスに新しいプロバイダーを追加する方法を説明します。

## 現在のアーキテクチャ

ストレージサービスはProvider パターンで設計されており、以下の構造になっています：

```
src/libraries/storage.ts
├── StorageService (interface) - ストレージ操作の抽象化
├── StorageProvider (interface) - プロバイダーの抽象化
├── S3Provider (class) - AWS S3実装
├── LocalStorageProvider (class) - ローカルファイルシステム実装
└── StorageServiceImpl (class) - メインのサービス実装
```

## 新しいプロバイダーの追加手順

### 1. プロバイダー設定インターフェースの定義

```typescript
// 例: Google Cloud Storage プロバイダーの場合
export interface GCSProviderConfig {
  projectId: string;
  bucket: string;
  credentials: {
    clientEmail: string;
    privateKey: string;
  };
  region?: string;
}
```

### 2. プロバイダークラスの実装

```typescript
export class GCSProvider implements StorageProvider {
  private config: GCSProviderConfig;

  constructor(config: GCSProviderConfig) {
    this.config = config;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      // Dynamic import for Edge Runtime compatibility
      const { Storage } = await import("@google-cloud/storage");
      
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      
      const bucket = storage.bucket(this.config.bucket);
      const file = bucket.file(options.key);
      
      await file.save(options.data, {
        metadata: {
          contentType: options.contentType || "application/octet-stream",
          ...options.metadata,
        },
      });

      const url = `https://storage.googleapis.com/${this.config.bucket}/${options.key}`;

      return {
        success: true,
        key: options.key,
        url,
      };
    } catch (error) {
      console.error("GCS upload failed:", error);
      return {
        success: false,
        key: options.key,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async download(key: string): Promise<DownloadResult> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      
      const bucket = storage.bucket(this.config.bucket);
      const file = bucket.file(key);
      
      const [data] = await file.download();
      const [metadata] = await file.getMetadata();

      return {
        success: true,
        data: Buffer.from(data),
        contentType: metadata.contentType,
        contentLength: parseInt(metadata.size),
        lastModified: new Date(metadata.updated),
      };
    } catch (error) {
      console.error("GCS download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      
      const bucket = storage.bucket(this.config.bucket);
      const file = bucket.file(key);
      
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expiresIn * 1000,
      });

      return signedUrl;
    } catch (error) {
      console.error("GCS signed URL generation failed:", error);
      throw new Error(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      
      const bucket = storage.bucket(this.config.bucket);
      const file = bucket.file(key);
      
      await file.delete();
    } catch (error) {
      console.error("GCS delete failed:", error);
      throw new Error(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async list(prefix?: string, maxKeys: number = 1000): Promise<ListResult> {
    try {
      const { Storage } = await import("@google-cloud/storage");
      
      const storage = new Storage({
        projectId: this.config.projectId,
        credentials: this.config.credentials,
      });
      
      const bucket = storage.bucket(this.config.bucket);
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: maxKeys,
      });

      const storageFiles: StorageFile[] = files.map((file) => ({
        key: file.name,
        size: parseInt(file.metadata.size),
        lastModified: new Date(file.metadata.updated),
        etag: file.metadata.etag,
      }));

      return {
        success: true,
        files: storageFiles,
        hasMore: files.length === maxKeys,
      };
    } catch (error) {
      console.error("GCS list failed:", error);
      return {
        success: false,
        files: [],
        hasMore: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
```

### 3. 設定ファクトリー関数の追加

```typescript
export function createGCSProviderConfig(): GCSProviderConfig {
  return {
    projectId: process.env.GCS_PROJECT_ID || "",
    bucket: process.env.GCS_BUCKET || "",
    credentials: {
      clientEmail: process.env.GCS_CLIENT_EMAIL || "",
      privateKey: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    },
    region: process.env.GCS_REGION,
  };
}
```

### 4. メインファクトリー関数の更新

```typescript
export function createStorageServiceInstance(): StorageService {
  // Edge Runtime環境の検出を改善
  const isEdgeRuntime =
    process.env.NEXT_RUNTIME === "edge" ||
    typeof process === "undefined" ||
    typeof process.versions === "undefined" ||
    typeof process.versions.node === "undefined";

  // Node.js Runtime環境の検出
  const isNodeRuntime =
    !isEdgeRuntime &&
    typeof process !== "undefined" &&
    typeof process.versions !== "undefined" &&
    typeof process.versions.node !== "undefined";

  // Edge Runtime環境では常にS3を使用
  if (isEdgeRuntime) {
    console.log("Edge Runtime detected, using S3 provider");
    const s3Config = createS3ProviderConfig();
    return new StorageServiceImpl(new S3Provider(s3Config));
  }

  // Node.js環境でのみローカルストレージの選択を許可
  const storageType = isNodeRuntime
    ? process.env.STORAGE_PROVIDER || "s3"
    : "s3";

  let provider: StorageProvider;

  switch (storageType) {
    case "gcs":
      const gcsConfig = createGCSProviderConfig();
      provider = new GCSProvider(gcsConfig);
      break;

    case "local":
      if (!isNodeRuntime || !LocalStorageProvider) {
        console.warn(
          "LocalStorageProvider is not supported in non-Node.js runtime, falling back to S3"
        );
        const s3Config = createS3ProviderConfig();
        provider = new S3Provider(s3Config);
      } else {
        const localPath = process.env.LOCAL_STORAGE_PATH || "./uploads";
        provider = new LocalStorageProvider(localPath);
      }
      break;

    case "s3":
    default:
      const s3Config = createS3ProviderConfig();
      provider = new S3Provider(s3Config);
      break;
  }

  return new StorageServiceImpl(provider);
}
```

### 5. 環境変数の追加

`.env.sample` に新しいプロバイダー用の環境変数を追加：

```bash
# Storage Provider Selection
STORAGE_PROVIDER=s3 # s3, gcs, local, etc.

# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET=your-gcs-bucket-name
GCS_CLIENT_EMAIL=your-service-account-email
GCS_PRIVATE_KEY=your-private-key
GCS_REGION=us-central1
```

### 6. package.json の依存関係追加

```bash
npm install @google-cloud/storage
# または
npm install azure-storage-blob
```

## プロバイダー実装の注意点

### Edge Runtime 対応

Next.js Edge Runtime で使用する場合：

1. **Dynamic Import を使用**: Node.js 固有のモジュールは dynamic import で読み込む
2. **HTTP ベースの API を選択**: Node.js ネイティブモジュール（fs など）を使わないライブラリを選ぶ
3. **fetch() を活用**: 可能であれば、ライブラリの代わりに fetch() で直接 API を呼び出す

### エラーハンドリング

- 常に `UploadResult`, `DownloadResult`, `ListResult` 形式で結果を返す
- エラーは適切にログ出力し、`success: false` で返す
- ネットワークエラー、認証エラーなど様々なエラーケースを考慮

### 設定の検証

```typescript
constructor(config: GCSProviderConfig) {
  if (!config.projectId) {
    throw new Error("GCS project ID is required");
  }
  if (!config.bucket) {
    throw new Error("GCS bucket is required");
  }
  if (!config.credentials.clientEmail || !config.credentials.privateKey) {
    throw new Error("GCS credentials are required");
  }
  this.config = config;
}
```

### URL生成の考慮

```typescript
private generateFileUrl(key: string): string {
  // プロバイダー固有のURL形式を実装
  if (this.config.region) {
    return `https://storage.googleapis.com/${this.config.bucket}/${key}`;
  } else {
    return `https://storage.googleapis.com/${this.config.bucket}/${key}`;
  }
}
```

## テスト方法

### 1. 単体テスト

```typescript
// __tests__/libraries/storage.test.ts
describe("GCSProvider", () => {
  it("should upload file successfully", async () => {
    const provider = new GCSProvider({
      projectId: "test-project",
      bucket: "test-bucket",
      credentials: {
        clientEmail: "test@example.com",
        privateKey: "test-key",
      },
    });
    
    const result = await provider.upload({
      key: "test/file.txt",
      data: Buffer.from("test content"),
      contentType: "text/plain",
    });
    
    expect(result.success).toBe(true);
    expect(result.key).toBe("test/file.txt");
  });
});
```

### 2. 統合テスト

1. `.env` ファイルで `STORAGE_PROVIDER=gcs` を設定
2. ファイルアップロード機能で実際にストレージ操作をテスト
3. ログで操作結果が正しく出力されることを確認

## 利用可能なプロバイダーの例

### Edge Runtime 対応

- **AWS S3**: HTTP API、Edge Runtime 対応（現在実装済み）
- **Google Cloud Storage**: HTTP API、Edge Runtime 対応
- **Azure Blob Storage**: HTTP API、Edge Runtime 対応
- **Cloudflare R2**: S3互換API、Edge Runtime 対応

### Node.js Runtime のみ

- **LocalStorageProvider**: ローカルファイルシステム（現在実装済み）
- **MinIO**: S3互換ストレージ
- **DigitalOcean Spaces**: S3互換API

## 既存コードへの影響

新しいプロバイダーを追加しても、以下は変更不要：

- `StorageService` インターフェース
- `StorageServiceImpl` クラス
- 既存の `S3Provider` と `LocalStorageProvider`
- ファイルアップロード機能の実装

プロバイダーの切り替えは環境変数 `STORAGE_PROVIDER` の設定のみで可能です。

## 使用例

### 基本的な使用方法

```typescript
import { createStorageServiceInstance } from "@/libraries/storage";

const storageService = createStorageServiceInstance();

// ファイルアップロード
const uploadResult = await storageService.uploadFile(
  "documents/report.pdf",
  fileBuffer,
  "application/pdf"
);

if (uploadResult.success) {
  console.log("File uploaded:", uploadResult.url);
}

// ファイルダウンロード
const downloadResult = await storageService.downloadFile("documents/report.pdf");
if (downloadResult.success) {
  // downloadResult.data を使用
}

// Signed URL生成
const signedUrl = await storageService.generateSignedUrl("documents/report.pdf", 3600);

// ファイル削除
await storageService.deleteFile("documents/report.pdf");

// ファイル一覧取得
const listResult = await storageService.listFiles("documents/", 100);
if (listResult.success) {
  listResult.files.forEach(file => {
    console.log(file.key, file.size);
  });
}
```

### Server Actionでの使用

```typescript
// app/actions.ts
"use server";

import { createStorageServiceInstance } from "@/libraries/storage";

export async function uploadDocumentAction(formData: FormData) {
  const storageService = createStorageServiceInstance();
  
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `documents/${Date.now()}-${file.name}`;
  
  const result = await storageService.uploadFile(
    key,
    buffer,
    file.type
  );

  if (!result.success) {
    throw new Error("Failed to upload file");
  }

  return { success: true, url: result.url };
}
```

## 環境別設定例

### 開発環境（LocalStack）

```bash
STORAGE_PROVIDER=s3
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=test-bucket
LOCALSTACK_ENDPOINT=http://localhost:4566
LOCALSTACK_PUBLIC_ENDPOINT=http://localhost:4566
```

### 本番環境（AWS S3）

```bash
STORAGE_PROVIDER=s3
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-production-bucket
```

### 本番環境（Google Cloud Storage）

```bash
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GCS_REGION=us-central1
```
description:
globs:
alwaysApply: false
---


---


# storybook

---
globs: *.ts,*.tsx
alwaysApply: false
---
# Storybook運用ガイドライン

## 概要

本プロジェクトでは、UIコンポーネントの開発とテストにStorybookを活用しています。このガイドラインでは、Storybookを効果的に運用するためのルールとベストプラクティスを定めます。

## 基本原則

### 1. Story作成の義務化

- **新規コンポーネント作成時**: 必ずStorybookのStoryを同時に作成すること
- **既存コンポーネント改修時**: 対応するStoryも必ず更新すること
- **削除時**: コンポーネントを削除する際は、対応するStoryも削除すること

### 2. コンポーネントの純粋性

コンポーネントは以下の原則に従って実装する：

- **ビジネスロジックの排除**: コンポーネント内にビジネスロジックを含めない
- **外部依存性の排除**: API呼び出し、状態管理、ルーティングなどの外部依存を持たない
- **Props経由での機能注入**: アクション、イベントハンドラー、データは全てPropsとして受け取る

## ディレクトリ構造

```
src/
├── components/
│   ├── molecules/
│   │   ├── AwesomeButton/
│   │   │   ├── AwesomeButton.tsx
│   │   │   ├── AwesomeButton.stories.tsx
│   │   │   └── AwesomeButton.module.css
│   │   └── ...
│   └── organisms/
│       └── ...
```

## Story作成のルール

### 1. ファイル命名規則

- Storyファイルは `[ComponentName].stories.tsx` の形式で命名
- コンポーネントと同じディレクトリに配置

### 2. Story構成の基本テンプレート

```typescript
import type { Meta, StoryObj } from '@storybook/nextjs';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'カテゴリ/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // または 'fullscreen', 'padded'
  },
  tags: ['autodocs'],
  argTypes: {
    // Props の制御設定
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的な使用例
export const Default: Story = {
  args: {
    // デフォルトのProps
  },
};

// バリエーション
export const Variant1: Story = {
  args: {
    // バリエーション用のProps
  },
};
```

### 3. 必須のStoryパターン

各コンポーネントには最低限以下のStoryを作成する：

- **Default**: 最も一般的な使用例
- **各状態のバリエーション**: loading, error, empty, disabledなど
- **エッジケース**: 長いテキスト、特殊文字、境界値など

### 4. アクションとモックデータ

```typescript
import { action } from '@storybook/addon-actions';

export const WithActions: Story = {
  args: {
    onClick: action('clicked'),
    onSubmit: action('submitted'),
    data: {
      // モックデータ
      id: '1',
      name: 'サンプルデータ',
    },
  },
};
```

## ベストプラクティス

### 1. コンポーネントの設計

```typescript
// ❌ 悪い例: ビジネスロジックが含まれている
export const UserProfile = () => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetchUser().then(setUser); // 外部依存
  }, []);
  
  return <div>{user?.name}</div>;
};

// ✅ 良い例: 純粋なコンポーネント
interface UserProfileProps {
  user: User | null;
  onRefresh?: () => void;
  loading?: boolean;
}

export const UserProfile = ({ user, onRefresh, loading }: UserProfileProps) => {
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

### 2. Storyの網羅性

```typescript
// すべての状態をカバーする
export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    user: null,
    loading: false,
  },
};

export const WithData: Story = {
  args: {
    user: {
      id: '1',
      name: '山田太郎',
      email: 'yamada@example.com',
    },
    loading: false,
  },
};

export const LongName: Story = {
  args: {
    user: {
      id: '2',
      name: '非常に長い名前のユーザーさんの表示確認用テストデータ',
      email: 'long-name-user@example.com',
    },
  },
};
```

### 3. インタラクティブなStory

```typescript
export const Interactive: Story = {
  args: {
    onSubmit: action('form-submitted'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // ユーザーインタラクションをシミュレート
    await userEvent.type(canvas.getByLabelText('名前'), '山田太郎');
    await userEvent.click(canvas.getByRole('button', { name: '送信' }));
  },
};
```

## 運用フロー

### 1. 開発時

1. コンポーネントを作成/修正
2. 対応するStoryを作成/更新
3. Storybookで表示確認
4. 各種状態やエッジケースを確認
5. PRにStoryの更新も含める

### 2. レビュー時

- Storyが作成/更新されているか確認
- すべての重要な状態がカバーされているか確認
- コンポーネントが純粋性を保っているか確認

### 3. メンテナンス

- 定期的にStorybookビルドの成功を確認
- 使われなくなったStoryの削除
- 新しいパターンが生まれた場合のStory追加

## コマンド

```bash
# Storybookの起動
npm run storybook

# Storybookのビルド
npm run build-storybook

# Storybookのテスト
npm run test-storybook
```

## チェックリスト

コンポーネント開発時は以下を確認：

- [ ] コンポーネントにビジネスロジックが含まれていない
- [ ] 外部依存性がPropsとして注入されている
- [ ] Storyファイルが作成されている
- [ ] Default Storyが存在する
- [ ] 主要な状態のStoryが網羅されている
- [ ] エッジケースのStoryが含まれている
- [ ] アクションがaction()でモック化されている
- [ ] Storyがエラーなく表示される

## 参考資料

- [Storybook公式ドキュメント](mdc:https:/storybook.js.org/docs)
- [Component Story Format (CSF)](mdc:https:/storybook.js.org/docs/api/csf)
- [Storybook for React](mdc:https:/storybook.js.org/docs/get-started/react-vite)

---


# typescript

---
globs: *.ts,*.tsx
alwaysApply: false
---
# TypeScript Development Guidelines

## Core Requirements
- TypeScript must be used for all code generation
- Never use the `any` type as it will break the build
- Always use Shadcn and Tailwind CSS, but implement without using Card components
- Avoid typing components with React.FC
- Use const for component declarations instead of function
- Follow React's composable patterns

## State Management and Performance
- Minimize use of useState and useEffect hooks
- Prefer computed state where possible
- Use useMemo and useCallback when necessary to prevent unnecessary re-renders
- Prioritize server actions and useActionState
- Fall back to fetch and API route handlers when server actions aren't suitable
- When components need to modify data, they should receive server actions as props

## Component Architecture
- Prioritize server components whenever possible
- Create client components only when necessary
- Utilize Suspense and streaming capabilities where possible
- For components requiring specific functionality not tightly coupled to the component itself, create higher-order components
- Group related components, hooks, and functions in the same file when it makes semantic sense for easier distribution and usage

## Forms and Data Handling
- Implement forms as server-side components
- Only use client components for dynamic operations (e.g., user registration sections)
- Always validate inputs using Zod in server actions and API endpoints
- Always HTML escape text content

## Custom Hooks
- Create custom hooks to encapsulate specific logic when grouping useState and useEffect makes sense
- Custom hooks should be focused and reusable

## Best Practices
- Group related components, hooks, and functions in the same file when it makes semantic sense for easier distribution and usage
- Follow consistent naming conventions
- Maintain clear separation of concerns
- Ensure proper error handling
- Implement proper type safety throughout the codebase

---


# unittest

---
alwaysApply: true
---

# Unit Testing Guidelines

このドキュメントは、このプロジェクトにおけるユニットテストの作成・実行方法についてのガイドラインです。

## テストの義務化

- 新規コンポーネント作成時: 必ずテストファイルを同時に作成すること
- 既存コンポーネント改修時: 対応するテストも必ず更新すること
- 削除時: コンポーネントを削除する際は、対応するテストも削除すること

## テスト環境

### 使用ツール
- **Jest**: JavaScriptテストフレームワーク
- **React Testing Library**: Reactコンポーネントのテスト用ライブラリ
- **@testing-library/jest-dom**: DOM要素のアサーション用カスタムマッチャー

### テストファイルの配置
- テストファイルは `__tests__` ディレクトリに配置
- ソースコードのディレクトリ構造を反映させる
  - 例: `src/libraries/hash.ts` → `__tests__/libraries/hash.test.ts`
  - 例: `src/app/(site)/(unauthorized)/page.tsx` → `__tests__/app/(site)/(unauthorized)/page.test.tsx`

## テストの実行方法

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行（ファイル変更を監視）
npm test -- --watch

# カバレッジレポートを生成
npm test -- --coverage

# 特定のファイルのみテストを実行
npm test -- __tests__/libraries/hash.test.ts

# 特定のテストケースのみ実行
npm test -- -t "should hash password successfully"
```

## テストの書き方

### 1. 基本構造

```typescript
import { テスト対象のモジュール } from '@/path/to/module';

describe('モジュール名', () => {
  describe('関数名', () => {
    it('期待される動作の説明', async () => {
      // Arrange: テストの準備
      const input = 'テスト入力';
      
      // Act: テスト対象の実行
      const result = await targetFunction(input);
      
      // Assert: 結果の検証
      expect(result).toBe(expectedValue);
    });
  });
});
```

### 2. ライブラリ・ユーティリティ関数のテスト

```typescript
// __tests__/libraries/hash.test.ts の例
describe('Hash Library', () => {
  describe('hashPassword', () => {

    it('should hash password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate hash in correct format', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      const parts = hashedPassword.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('pbkdf2');
    });

    it('should be able to hash empty password', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
    });

    it('should be able to hash password with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete hash→verification flow correctly', async () => {
      const passwords = [
        'simplePassword',
        'Complex!Pass@123',
        '',
        '日本語パスワード',
        'a'.repeat(500),
      ];

      for (const password of passwords) {
        const hashedPassword = await hashPassword(password);
        const isValid = await verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);
      }
    });
  });
});
```

### 3. Reactコンポーネントのテスト

```typescript
// __tests__/app/(site)/(unauthorized)/page.test.tsx の例
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Component from '@/app/path/to/component';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    return <img {...restProps} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('Component名', () => {
  beforeEach(() => {
    render(<Component />);
  });

  describe('セクション名', () => {
    it('renders specific element', () => {
      const element = screen.getByTestId('page-heading');
      expect(element).toBeInTheDocument();
    });

    it('renders link with correct href', () => {
      const link = screen.getByTestId('navigation-link');
      expect(link).toHaveAttribute('href', '/expected/path');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByTestId(/^heading-/);
      // ヘッダー階層の検証
    });

    it('all images have alt text', () => {
      const images = screen.getAllByTestId(/^image-/);
      images.forEach((image) => {
        expect(image).toHaveAttribute('alt');
      });
    });
  });
});
```

## テストのベストプラクティス

### 1. テストの構造化
- `describe`でテスト対象を階層的に整理
- `it`で具体的な動作を記述（**必ず英語で書く**, 「should」で始める）
- AAA（Arrange-Act-Assert）パターンを使用

### 2. モックの使用
```typescript
// 外部モジュールのモック
jest.mock('module-name', () => ({
  functionName: jest.fn(),
}));

// Next.js特有のコンポーネントは必ずモック
jest.mock('next/image');
jest.mock('next/link');
jest.mock('next/navigation');
```

### 3. アサーションの選択
```typescript
// 基本的なアサーション
expect(value).toBe(expected);          // 厳密等価
expect(value).toEqual(expected);       // 深い等価
expect(value).toBeDefined();           // undefined でない
expect(value).toBeNull();              // null である
expect(value).toBeTruthy();            // truthy である
expect(value).toBeFalsy();             // falsy である

// 数値のアサーション
expect(number).toBeGreaterThan(value);
expect(number).toBeGreaterThanOrEqual(value);
expect(number).toBeLessThan(value);
expect(number).toBeLessThanOrEqual(value);

// 文字列のアサーション
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// 配列のアサーション
expect(array).toHaveLength(expected);
expect(array).toContain(item);

// DOM要素のアサーション（@testing-library/jest-dom）
expect(element).toBeInTheDocument();
expect(element).toHaveAttribute('href', '/path');
expect(element).toHaveTextContent('text');
expect(element).toHaveClass('className');
```

### 4. React Testing Libraryのクエリ（重要：getByTestIdを基本とする）

**⚠️ 重要: getByText や getByLabelText の使用は禁止**

国際化対応やテキスト変更の可能性を考慮し、以下のルールを厳守してください：

```typescript
// ✅ 推奨: data-testidを使用
screen.getByTestId('submit-button');
screen.getByTestId('email-input');
screen.getByTestId('error-message');

// ❌ 禁止: テキストベースのクエリ
screen.getByText('Submit');           // 禁止
screen.getByLabelText('Email');       // 禁止
screen.getByRole('button', { name: 'Submit' }); // 禁止

// 複数要素の取得
screen.getAllByTestId(/^list-item-/);

// 要素が存在しないことの確認
expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
```

### 5. data-testidの命名規則

```typescript
// 基本的な命名パターン
data-testid="component-name"           // コンポーネント名
data-testid="component-name-action"    // アクション付き
data-testid="component-name-state"     // 状態付き

// 具体例
data-testid="submit-button"            // 送信ボタン
data-testid="email-input"              // メール入力
data-testid="error-message"            // エラーメッセージ
data-testid="loading-spinner"          // ローディングスピナー
data-testid="user-avatar"              // ユーザーアバター
data-testid="navigation-menu"          // ナビゲーションメニュー
data-testid="search-form"              // 検索フォーム
data-testid="pagination-next"          // ページネーション次へ
data-testid="modal-close"              // モーダル閉じるボタン

// 動的な要素の場合
data-testid={`user-item-${userId}`}   // ユーザーID付き
data-testid={`product-card-${productId}`} // 商品ID付き

// 複数要素の場合
data-testid="list-item-1"             // リストアイテム1
data-testid="list-item-2"             // リストアイテム2
data-testid="tab-item-home"           // タブアイテム（ホーム）
data-testid="tab-item-profile"        // タブアイテム（プロフィール）
```

### 6. 非同期処理のテスト
```typescript
// Promiseを返す関数のテスト
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// 非同期レンダリングの待機
import { waitFor } from '@testing-library/react';

it('should display data after loading', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByTestId('loaded-data')).toBeInTheDocument();
  });
});
```

### 7. エラーケースのテスト
```typescript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Error message');
});

it('should return false for invalid data', async () => {
  const result = await validateFunction(invalidData);
  expect(result).toBe(false);
});
```

### 8. フォームテストの例

```typescript
// コンポーネント側
<form data-testid="login-form">
  <input 
    type="email" 
    data-testid="email-input" 
    placeholder="Email"
  />
  <input 
    type="password" 
    data-testid="password-input" 
    placeholder="Password"
  />
  <button type="submit" data-testid="submit-button">
    Sign In
  </button>
</form>

// テスト側
it('should submit form with valid data', async () => {
  render(<LoginForm />);
  
  const emailInput = screen.getByTestId('email-input');
  const passwordInput = screen.getByTestId('password-input');
  const submitButton = screen.getByTestId('submit-button');
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByTestId('success-message')).toBeInTheDocument();
  });
});
```

## カバレッジ目標

- ライブラリ/ユーティリティ関数: 90%以上
- Reactコンポーネント: 80%以上
- 全体: 80%以上

カバレッジレポートは `coverage/lcov-report/index.html` で確認可能。

## よくあるパターン

### 1. セットアップとクリーンアップ
```typescript
describe('Test Suite', () => {
  let mockData;

  beforeAll(() => {
    // テストスイート全体の前に一度実行
  });

  beforeEach(() => {
    // 各テストの前に実行
    mockData = { id: 1, name: 'Test' };
  });

  afterEach(() => {
    // 各テストの後に実行
    jest.clearAllMocks();
  });

  afterAll(() => {
    // テストスイート全体の後に一度実行
  });
});
```

### 2. 条件付きテスト
```typescript
it.skip('temporarily disabled test', () => {
  // このテストはスキップされる
});

it.only('run only this test', () => {
  // このテストのみ実行される（デバッグ時に便利）
});
```

### 3. パラメータ化テスト
```typescript
describe.each([
  ['input1', 'expected1'],
  ['input2', 'expected2'],
  ['input3', 'expected3'],
])('functionName(%s)', (input, expected) => {
  it(`should return ${expected}`, () => {
    expect(functionName(input)).toBe(expected);
  });
});
```

## トラブルシューティング

### よくあるエラーと解決方法

1. **Module not found エラー**
   - `tsconfig.json` のパスエイリアスが Jest で認識されているか確認
   - `jest.config.js` の `moduleNameMapper` を確認

2. **Next.js コンポーネントのエラー**
   - 必要なモックが設定されているか確認
   - `next/image`, `next/link`, `next/navigation` など

3. **非同期テストのタイムアウト**
   - `async/await` を適切に使用しているか確認
   - タイムアウト時間を延長: `jest.setTimeout(10000)`

4. **DOM要素が見つからない**
   - 適切なクエリメソッドを使用しているか確認
   - 非同期レンダリングの場合は `waitFor` を使用
   - data-testidが正しく設定されているか確認

5. **data-testidが見つからない**
   - コンポーネントにdata-testid属性が設定されているか確認
   - 命名規則に従っているか確認
   - 動的な要素の場合は正しい値が設定されているか確認

## 追加リソース

- [Jest Documentation](mdc:https:/jestjs.io/docs/getting-started)
- [React Testing Library Documentation](mdc:https:/testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](mdc:https:/testing-library.com/docs/queries/about)
- [Jest DOM Matchers](mdc:https:/github.com/testing-library/jest-dom)

- [React Testing Library Documentation](mdc:https:/testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](mdc:https:/testing-library.com/docs/queries/about)
- [Jest DOM Matchers](mdc:https:/github.com/testing-library/jest-dom)
# Unit Testing Guidelines

このドキュメントは、このプロジェクトにおけるユニットテストの作成・実行方法についてのガイドラインです。

## テストの義務化

- 新規コンポーネント作成時: 必ずテストファイルを同時に作成すること
- 既存コンポーネント改修時: 対応するテストも必ず更新すること
- 削除時: コンポーネントを削除する際は、対応するテストも削除すること

## テスト環境

### 使用ツール
- **Jest**: JavaScriptテストフレームワーク
- **React Testing Library**: Reactコンポーネントのテスト用ライブラリ
- **@testing-library/jest-dom**: DOM要素のアサーション用カスタムマッチャー

### テストファイルの配置
- テストファイルは `__tests__` ディレクトリに配置
- ソースコードのディレクトリ構造を反映させる
  - 例: `src/libraries/hash.ts` → `__tests__/libraries/hash.test.ts`
  - 例: `src/app/(site)/(unauthorized)/page.tsx` → `__tests__/app/(site)/(unauthorized)/page.test.tsx`

## テストの実行方法

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行（ファイル変更を監視）
npm test -- --watch

# カバレッジレポートを生成
npm test -- --coverage

# 特定のファイルのみテストを実行
npm test -- __tests__/libraries/hash.test.ts

# 特定のテストケースのみ実行
npm test -- -t "should hash password successfully"
```

## テストの書き方

### 1. 基本構造

```typescript
import { テスト対象のモジュール } from '@/path/to/module';

describe('モジュール名', () => {
  describe('関数名', () => {
    it('期待される動作の説明', async () => {
      // Arrange: テストの準備
      const input = 'テスト入力';
      
      // Act: テスト対象の実行
      const result = await targetFunction(input);
      
      // Assert: 結果の検証
      expect(result).toBe(expectedValue);
    });
  });
});
```

### 2. ライブラリ・ユーティリティ関数のテスト

```typescript
// __tests__/libraries/hash.test.ts の例
describe('Hash Library', () => {
  describe('hashPassword', () => {

    it('should hash password successfully', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate hash in correct format', async () => {
      const password = 'testPassword123';
      const hashedPassword = await hashPassword(password);

      const parts = hashedPassword.split(':');
      expect(parts).toHaveLength(4);
      expect(parts[0]).toBe('pbkdf2');
    });

    it('should be able to hash empty password', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
    });

    it('should be able to hash password with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete hash→verification flow correctly', async () => {
      const passwords = [
        'simplePassword',
        'Complex!Pass@123',
        '',
        '日本語パスワード',
        'a'.repeat(500),
      ];

      for (const password of passwords) {
        const hashedPassword = await hashPassword(password);
        const isValid = await verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);
      }
    });
  });
});
```

### 3. Reactコンポーネントのテスト

```typescript
// __tests__/app/(site)/(unauthorized)/page.test.tsx の例
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Component from '@/app/path/to/component';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...restProps } = props;
    return <img {...restProps} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('Component名', () => {
  beforeEach(() => {
    render(<Component />);
  });

  describe('セクション名', () => {
    it('renders specific element', () => {
      const element = screen.getByTestId('page-heading');
      expect(element).toBeInTheDocument();
    });

    it('renders link with correct href', () => {
      const link = screen.getByTestId('navigation-link');
      expect(link).toHaveAttribute('href', '/expected/path');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      const headings = screen.getAllByTestId(/^heading-/);
      // ヘッダー階層の検証
    });

    it('all images have alt text', () => {
      const images = screen.getAllByTestId(/^image-/);
      images.forEach((image) => {
        expect(image).toHaveAttribute('alt');
      });
    });
  });
});
```

## テストのベストプラクティス

### 1. テストの構造化
- `describe`でテスト対象を階層的に整理
- `it`で具体的な動作を記述（**必ず英語で書く**, 「should」で始める）
- AAA（Arrange-Act-Assert）パターンを使用

### 2. モックの使用
```typescript
// 外部モジュールのモック
jest.mock('module-name', () => ({
  functionName: jest.fn(),
}));

// Next.js特有のコンポーネントは必ずモック
jest.mock('next/image');
jest.mock('next/link');
jest.mock('next/navigation');
```

### 3. アサーションの選択
```typescript
// 基本的なアサーション
expect(value).toBe(expected);          // 厳密等価
expect(value).toEqual(expected);       // 深い等価
expect(value).toBeDefined();           // undefined でない
expect(value).toBeNull();              // null である
expect(value).toBeTruthy();            // truthy である
expect(value).toBeFalsy();             // falsy である

// 数値のアサーション
expect(number).toBeGreaterThan(value);
expect(number).toBeGreaterThanOrEqual(value);
expect(number).toBeLessThan(value);
expect(number).toBeLessThanOrEqual(value);

// 文字列のアサーション
expect(string).toMatch(/regex/);
expect(string).toContain('substring');

// 配列のアサーション
expect(array).toHaveLength(expected);
expect(array).toContain(item);

// DOM要素のアサーション（@testing-library/jest-dom）
expect(element).toBeInTheDocument();
expect(element).toHaveAttribute('href', '/path');
expect(element).toHaveTextContent('text');
expect(element).toHaveClass('className');
```

### 4. React Testing Libraryのクエリ（重要：getByTestIdを基本とする）

**⚠️ 重要: getByText や getByLabelText の使用は禁止**

国際化対応やテキスト変更の可能性を考慮し、以下のルールを厳守してください：

```typescript
// ✅ 推奨: data-testidを使用
screen.getByTestId('submit-button');
screen.getByTestId('email-input');
screen.getByTestId('error-message');

// ❌ 禁止: テキストベースのクエリ
screen.getByText('Submit');           // 禁止
screen.getByLabelText('Email');       // 禁止
screen.getByRole('button', { name: 'Submit' }); // 禁止

// 複数要素の取得
screen.getAllByTestId(/^list-item-/);

// 要素が存在しないことの確認
expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
```

### 5. data-testidの命名規則

```typescript
// 基本的な命名パターン
data-testid="component-name"           // コンポーネント名
data-testid="component-name-action"    // アクション付き
data-testid="component-name-state"     // 状態付き

// 具体例
data-testid="submit-button"            // 送信ボタン
data-testid="email-input"              // メール入力
data-testid="error-message"            // エラーメッセージ
data-testid="loading-spinner"          // ローディングスピナー
data-testid="user-avatar"              // ユーザーアバター
data-testid="navigation-menu"          // ナビゲーションメニュー
data-testid="search-form"              // 検索フォーム
data-testid="pagination-next"          // ページネーション次へ
data-testid="modal-close"              // モーダル閉じるボタン

// 動的な要素の場合
data-testid={`user-item-${userId}`}   // ユーザーID付き
data-testid={`product-card-${productId}`} // 商品ID付き

// 複数要素の場合
data-testid="list-item-1"             // リストアイテム1
data-testid="list-item-2"             // リストアイテム2
data-testid="tab-item-home"           // タブアイテム（ホーム）
data-testid="tab-item-profile"        // タブアイテム（プロフィール）
```

### 6. 非同期処理のテスト
```typescript
// Promiseを返す関数のテスト
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// 非同期レンダリングの待機
import { waitFor } from '@testing-library/react';

it('should display data after loading', async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByTestId('loaded-data')).toBeInTheDocument();
  });
});
```

### 7. エラーケースのテスト
```typescript
it('should throw error for invalid input', async () => {
  await expect(functionThatThrows()).rejects.toThrow('Error message');
});

it('should return false for invalid data', async () => {
  const result = await validateFunction(invalidData);
  expect(result).toBe(false);
});
```

### 8. フォームテストの例

```typescript
// コンポーネント側
<form data-testid="login-form">
  <input 
    type="email" 
    data-testid="email-input" 
    placeholder="Email"
  />
  <input 
    type="password" 
    data-testid="password-input" 
    placeholder="Password"
  />
  <button type="submit" data-testid="submit-button">
    Sign In
  </button>
</form>

// テスト側
it('should submit form with valid data', async () => {
  render(<LoginForm />);
  
  const emailInput = screen.getByTestId('email-input');
  const passwordInput = screen.getByTestId('password-input');
  const submitButton = screen.getByTestId('submit-button');
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByTestId('success-message')).toBeInTheDocument();
  });
});
```

## カバレッジ目標

- ライブラリ/ユーティリティ関数: 90%以上
- Reactコンポーネント: 80%以上
- 全体: 80%以上

カバレッジレポートは `coverage/lcov-report/index.html` で確認可能。

## よくあるパターン

### 1. セットアップとクリーンアップ
```typescript
describe('Test Suite', () => {
  let mockData;

  beforeAll(() => {
    // テストスイート全体の前に一度実行
  });

  beforeEach(() => {
    // 各テストの前に実行
    mockData = { id: 1, name: 'Test' };
  });

  afterEach(() => {
    // 各テストの後に実行
    jest.clearAllMocks();
  });

  afterAll(() => {
    // テストスイート全体の後に一度実行
  });
});
```

### 2. 条件付きテスト
```typescript
it.skip('temporarily disabled test', () => {
  // このテストはスキップされる
});

it.only('run only this test', () => {
  // このテストのみ実行される（デバッグ時に便利）
});
```

### 3. パラメータ化テスト
```typescript
describe.each([
  ['input1', 'expected1'],
  ['input2', 'expected2'],
  ['input3', 'expected3'],
])('functionName(%s)', (input, expected) => {
  it(`should return ${expected}`, () => {
    expect(functionName(input)).toBe(expected);
  });
});
```

## トラブルシューティング

### よくあるエラーと解決方法

1. **Module not found エラー**
   - `tsconfig.json` のパスエイリアスが Jest で認識されているか確認
   - `jest.config.js` の `moduleNameMapper` を確認

2. **Next.js コンポーネントのエラー**
   - 必要なモックが設定されているか確認
   - `next/image`, `next/link`, `next/navigation` など

3. **非同期テストのタイムアウト**
   - `async/await` を適切に使用しているか確認
   - タイムアウト時間を延長: `jest.setTimeout(10000)`

4. **DOM要素が見つからない**
   - 適切なクエリメソッドを使用しているか確認
   - 非同期レンダリングの場合は `waitFor` を使用
   - data-testidが正しく設定されているか確認

5. **data-testidが見つからない**
   - コンポーネントにdata-testid属性が設定されているか確認
   - 命名規則に従っているか確認
   - 動的な要素の場合は正しい値が設定されているか確認

## 追加リソース

- [Jest Documentation](mdc:https:/jestjs.io/docs/getting-started)
- [React Testing Library Documentation](mdc:https:/testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](mdc:https:/testing-library.com/docs/queries/about)
- [Jest DOM Matchers](mdc:https:/github.com/testing-library/jest-dom)

- [React Testing Library Documentation](mdc:https:/testing-library.com/docs/react-testing-library/intro)
- [Testing Library Queries](mdc:https:/testing-library.com/docs/queries/about)
- [Jest DOM Matchers](mdc:https:/github.com/testing-library/jest-dom)


---

