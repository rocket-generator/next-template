# データアクセスガイド

データアクセスには `src/repositories` 配下のリポジトリクラスを必ず利用する。

## 基本方針

リポジトリ層はデータの種類ごとに作成する。ユーザー情報用リポジトリは `src/repositories/user_repository.ts` のように配置する。バックエンドがローカル・AirTable・Prisma などに変わっても配置方針は同じ。

すべてのリポジトリは `src/repositories/base_repository.ts` の `BaseRepository` を継承する。データソースに応じて、それを継承した別クラスをさらに継承する場合がある。

**注意**: リクエスト/レスポンスのスキーマを Repository のファイルに書くことは禁止。

- レスポンスのモデル: `src/models/`
- リクエスト: `src/requests/`

## バックエンド別の実装

### 1. Prisma（DB）アクセス

`src/repositories/prisma_repository.ts` を継承してリポジトリを作成する。

### 2. 独立した API サーバ

`BaseRepository` を直接継承して作成する。

### 3. ローカルデータ

プロトタイプ時に `public/data` 配下の JSON にアクセスする場合、`src/repositories/local_repository.ts` の `LocalRepository` を継承する。
データ配置: `public/data/[モデル名]/index.json` に一覧、`public/data/[モデル名]/[id].json` に個別データ。
ローカルデータアクセスでは作成・更新・削除は対応しない。

### 4. AirTable

プロトタイプで保存・削除も必要な場合は AirTable を使う。`src/repositories/airtable_repository.ts` を継承する。

### 5. Dify

- チャット用: `src/repositories/chat_repository.ts`
- ワークフロー実行用: `src/repositories/workflow_repository.ts`

## 新しいサードパーティ API 用リポジトリの追加

`AirtableRepository` と同様に、`src/repositories/` に `BaseRepository` を継承した基底クラスを作成し、個別アクセスはそれをさらに継承して実装する。

## モデル定義

### レスポンスモデル（`src/models/`）

ユーザー向けモデルを `src/models/` に配置する。ファイル名は単数形スネークケース（例: `user.ts`）。zod でスキーマ定義する。

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

### リクエスト定義（`src/requests/`）

ファイル名は `[モデル名（単数形）]_[アクション名]_request.ts`（例: `user_create_request.ts`, `user_update_request.ts`）。

```typescript
export const UserCreateRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  permissions: permissionsSchema,
});

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>;
```

管理画面用は `src/requests/admin/` 配下に配置する。
