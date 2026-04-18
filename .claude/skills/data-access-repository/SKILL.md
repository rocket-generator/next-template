---
name: data-access-repository
description: Use when creating or modifying files under src/repositories/, src/models/, or src/requests/. Covers BaseRepository inheritance (Prisma/API/Local/Airtable/Dify), Zod schema placement, and separation between repository and schema files.
---

# Data Access Repository

## Overview

このプロジェクトのデータアクセスは **必ず `src/repositories/` 配下の Repository クラス経由**。Repository はバックエンドに応じて適切な基底クラスを継承する。正本は `docs/guides/data-access.md`。

## When to Use

- `src/repositories/` に新しい Repository を追加・変更
- `src/models/` の Zod レスポンスモデルを追加・変更
- `src/requests/` の Zod リクエストスキーマを追加・変更
- 新しいサードパーティ API 用の基底 Repository を作る

**When NOT to use**: 管理画面の CRUD 全体は `admin-page-scaffolding`（Repository 配置も説明されている）。

## Must-Follow Rules

1. **データアクセスは Repository 経由のみ**。Server Actions や Page から Prisma を直接叩かない
2. **すべての Repository は `src/repositories/base_repository.ts` の `BaseRepository` を継承**（またはその派生）
3. **スキーマを Repository ファイルに書かない**。レスポンスは `src/models/`、リクエストは `src/requests/`
4. **ファイル名の命名規則を遵守**:
   - Repository: `src/repositories/user_repository.ts`（単数形スネークケース）
   - Model: `src/models/user.ts`
   - Request: `src/requests/user_create_request.ts`（`[entity]_[action]_request.ts`）
5. **管理画面用リクエストは `src/requests/admin/` 配下**

## 継承ツリー

| バックエンド | 継承元 |
|------------|--------|
| Prisma（DB） | `PrismaRepository` (`src/repositories/prisma_repository.ts`) |
| 独立 API サーバ | `BaseRepository` を直接 |
| ローカル JSON | `LocalRepository` (`src/repositories/local_repository.ts`) |
| AirTable | `AirtableRepository` (`src/repositories/airtable_repository.ts`) |
| Dify チャット | `ChatRepository` (`src/repositories/chat_repository.ts`) |
| Dify ワークフロー | `WorkflowRepository` (`src/repositories/workflow_repository.ts`) |

## Key Files

- `src/repositories/base_repository.ts` — すべての基底
- `src/repositories/prisma_repository.ts` / `airtable_repository.ts` / `local_repository.ts` / `chat_repository.ts` / `workflow_repository.ts` — 派生基底
- `src/repositories/user_repository.ts` / `auth_repository.ts` — 実例
- `src/models/` / `src/requests/` — スキーマ配置

## Reference

- **正本**: `docs/guides/data-access.md`
- `AGENTS.md §データアクセス`
- `prisma/schema.prisma` — DB スキーマの起点

## Checklist

- [ ] Repository ファイルが `src/repositories/[entity]_repository.ts`
- [ ] 適切な基底クラスを継承している
- [ ] Zod スキーマが Repository ファイル内に混入していない
- [ ] Model が `src/models/[entity].ts`
- [ ] Request が `src/requests/[entity]_[action]_request.ts`（管理画面は `admin/` 配下）
- [ ] 対応する `__tests__/repositories/[entity]_repository.test.ts` を追加
