---
name: adding-storage-provider
description: Use when modifying src/libraries/storage.ts, adding a new StorageProvider implementation, or changing STORAGE_PROVIDER environment variables. Covers S3/S3-compatible/GCS patterns, forcePathStyle handling, SYSTEM_AWS_* env, and image display CSP/EXTRA_REMOTE_IMAGE_URLS separation.
---

# Adding Storage Provider

## Overview

ストレージ層 (`src/libraries/storage.ts`) に新しい `StorageProvider` を追加・変更するときに使う。正本は `docs/guides/storage-provider.md`。

## When to Use

- `src/libraries/storage.ts` を編集する
- 新しいストレージプロバイダーを追加する（R2 / MinIO / Azure Blob 等）
- `STORAGE_PROVIDER` の許可値を変える
- `forcePathStyle` 周辺の挙動を変える

**When NOT to use**: 画像の **表示だけ** 通らない問題は `EXTRA_REMOTE_IMAGE_URLS` と `src/libraries/security-headers.ts` の CSP を確認する（保存実装ではない）。

## Must-Follow Rules

1. **S3 互換は専用 provider を乱立させず `S3Provider` 再利用を最初に検討**（`S3_COMPATIBLE_*` env で吸収）
2. **不正な `STORAGE_PROVIDER` は silent fallback せず throw**
3. **`SYSTEM_AWS_*` 命名を維持**（`AWS_*` は使わない）
4. **`S3_COMPATIBLE_FORCE_PATH_STYLE` は `"true"` / `"false"` のみ受付**。それ以外は throw
5. **`UploadResult.url` の意味を明確化**（公開 URL / CDN URL / signed URL は同義ではない）。変更時は表示側・CSP・`next/image` 許可も見直す
6. **env は fail fast**。起動時検証で throw

## Key Files

- `src/libraries/storage.ts` — 実装（`StorageService` / `StorageProvider` / `S3Provider` / `GCSProvider` / `StorageServiceImpl` / `createStorageServiceInstance`）
- `src/libraries/security-headers.ts` — CSP（表示側）
- `src/libraries/remote-image-patterns.ts` — `next/image` 許可パターン
- `.env.example` — env 追記先
- `__tests__/libraries/storage.test.ts` — provider 選択・env validation・URL 生成・upload/download/delete/list/signed URL
- `README.md` / `docs/guides/storage-provider.md`

## Reference

- **正本**: `docs/guides/storage-provider.md`
- S3 / S3 Compatible / GCS の env は `docs/guides/storage-provider.md §現在サポートしている env`
- `AGENTS.md §ストレージプロバイダー追加`

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
