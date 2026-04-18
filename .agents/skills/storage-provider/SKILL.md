---
name: storage-provider
description: Use when changing this template's object storage backend, reviewing storage env setup, switching between `s3`, `s3-compatible`, and `gcs`, or adding a new provider such as R2, MinIO, Spaces, Azure Blob, or GCS. Covers STORAGE_PROVIDER routing, S3Provider reuse for compatible services, forcePathStyle handling, SYSTEM_AWS_* env, and separation from image-display CSP/EXTRA_REMOTE_IMAGE_URLS.
---

# Storage Provider

Read [`docs/guides/storage-provider.md`](../../../docs/guides/storage-provider.md) first — it is the authoritative source.

## Current State

- Implemented providers: `s3`, `s3-compatible`, `gcs`
- Provider selection: `STORAGE_PROVIDER`
- Shared AWS-style env names use `SYSTEM_AWS_*`
- S3-compatible services reuse `S3Provider`; **do not add a dedicated provider unless the API is actually non-S3**

## Current Env Map

### `s3`

- `STORAGE_PROVIDER=s3`
- `SYSTEM_AWS_S3_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `SYSTEM_AWS_S3_BUCKET`
- `USE_LOCALSTACK`
- `LOCALSTACK_ENDPOINT`
- `LOCALSTACK_PUBLIC_ENDPOINT`

### `s3-compatible`

- `STORAGE_PROVIDER=s3-compatible`
- `SYSTEM_AWS_S3_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `SYSTEM_AWS_S3_BUCKET`
- `S3_COMPATIBLE_ENDPOINT`（必須）
- `S3_COMPATIBLE_PUBLIC_ENDPOINT`
- `S3_COMPATIBLE_FORCE_PATH_STYLE`（`"true"` / `"false"` のみ）

### `gcs`

- `STORAGE_PROVIDER=gcs`
- `GCS_PROJECT_ID`
- `GCS_BUCKET`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`（`\n` は実改行へ復元される）
- `GCS_REGION`

## Must-Follow Rules

1. **S3 互換は専用 provider を乱立させず `S3Provider` 再利用を最初に検討**
2. **不正な `STORAGE_PROVIDER` は silent fallback せず throw**
3. **`SYSTEM_AWS_*` 命名を維持**（`AWS_*` は使わない）
4. **`S3_COMPATIBLE_FORCE_PATH_STYLE` は `"true"` / `"false"` のみ受付**。回帰テストあり
5. **`UploadResult.url` の意味を明確化**（公開 URL / CDN URL / signed URL は同義ではない）。変更時は表示側・CSP・`next/image` 許可も見直す
6. **env は fail fast**。起動時検証で throw
7. **ストレージプロバイダーを追加しても、ブラウザ表示は自動で通らない**。`EXTRA_REMOTE_IMAGE_URLS` と CSP は別途要確認

## Workflow

1. リクエストを切り分け：
   - 表示のみ（`next/image` / CSP / remote host allowlist）
   - フル統合（upload / download / signed URL / delete / list）
2. `src/libraries/storage.ts` を確認し、`StorageProvider` / `StorageService` 契約を破らないか判断
3. S3 互換なら `S3Provider` の env/config 拡張で済ませられないかを先に検討
4. 専用 provider が必要な場合：
   - provider config validation を追加
   - provider class を追加
   - `createStorageServiceInstance()` を更新
   - typo を fail-fast に保つ
5. 設定 / ドキュメント更新：`.env.example`, `README.md`, `docs/guides/storage-provider.md`
6. テスト更新：`__tests__/libraries/storage.test.ts` と consumer smoke

## Key Files

- `src/libraries/storage.ts` — 実装（`StorageService` / `StorageProvider` / `S3Provider` / `GCSProvider` / `StorageServiceImpl` / `createXxxProviderConfig()` / `createStorageServiceInstance()`）
- `src/libraries/security-headers.ts` — CSP
- `src/libraries/remote-image-patterns.ts` — `next/image` 許可パターン
- `.env.example`
- `__tests__/libraries/storage.test.ts`
- `__tests__/repositories/user_repository.storage-provider.test.ts`
- `README.md` / `docs/guides/storage-provider.md`

## Quick Decisions

- R2 / MinIO / Spaces / Wasabi: まず `s3-compatible` で吸収できるか検討
- GCS / Azure Blob: 通常は専用 provider
- 表示のみのリクエスト: `storage.ts` ではなく `EXTRA_REMOTE_IMAGE_URLS` と CSP

## Reference

- **正本**: `docs/guides/storage-provider.md`
- `AGENTS.md §ストレージプロバイダー追加`
- 関連 skill: `email-provider`

## Checklist

- [ ] `StorageProvider` を満たす class を追加（または `S3Provider` 再利用で済むか先に検討）
- [ ] `createXxxProviderConfig()` を追加
- [ ] `createStorageServiceInstance()` の `switch` に分岐を追加
- [ ] `.env.example` を更新
- [ ] `forcePathStyle=false` が維持されることのテストを追加（S3 互換の場合）
- [ ] URL 生成・upload/download/delete/list/signed URL のテストを追加
- [ ] consumer smoke test（`UserRepository` 初期化が壊れていないこと）
- [ ] 画像表示が必要なら `EXTRA_REMOTE_IMAGE_URLS` と CSP を見直す
- [ ] `README.md` / `docs/guides/storage-provider.md` を更新
