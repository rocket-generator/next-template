---
name: storage-provider-extension
description: Use when changing this template's object storage backend, reviewing storage env setup, switching between `s3`, `s3-compatible`, and `gcs`, or adding a new provider such as R2, MinIO, Spaces, Azure Blob, or GCS.
---

# Storage Provider Extension

Read [`docs/guides/storage-provider.md`](../../../docs/guides/storage-provider.md) first.

## Current State

- Implemented providers: `s3`, `s3-compatible`, `gcs`
- Provider selection: `STORAGE_PROVIDER`
- Shared AWS-style env names use `SYSTEM_AWS_*`
- S3-compatible services reuse `S3Provider`; do not add a dedicated provider unless the API is actually non-S3

## Current Env Map

### `s3`

Use:

- `STORAGE_PROVIDER=s3`
- `SYSTEM_AWS_S3_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `SYSTEM_AWS_S3_BUCKET`
- `USE_LOCALSTACK`
- `LOCALSTACK_ENDPOINT`
- `LOCALSTACK_PUBLIC_ENDPOINT`

### `s3-compatible`

Use:

- `STORAGE_PROVIDER=s3-compatible`
- `SYSTEM_AWS_S3_REGION`
- `SYSTEM_AWS_ACCESS_KEY_ID`
- `SYSTEM_AWS_SECRET_ACCESS_KEY`
- `SYSTEM_AWS_S3_BUCKET`
- `S3_COMPATIBLE_ENDPOINT`
- `S3_COMPATIBLE_PUBLIC_ENDPOINT`
- `S3_COMPATIBLE_FORCE_PATH_STYLE`

### `gcs`

Use:

- `STORAGE_PROVIDER=gcs`
- `GCS_PROJECT_ID`
- `GCS_BUCKET`
- `GCS_CLIENT_EMAIL`
- `GCS_PRIVATE_KEY`
- `GCS_REGION`

## Workflow

1. Decide whether the request is:
   - display-only (`next/image`, remote host allowlists, CSP)
   - full provider integration (upload / download / signed URL / delete / list)
2. Inspect `src/libraries/storage.ts` and keep `StorageProvider` / `StorageService` contracts intact unless there is a concrete reason to change them.
3. If the target is S3-compatible, prefer extending env/config loading around `S3Provider` before adding a new class.
4. If a dedicated provider is required:
   - add provider config validation
   - add provider class
   - update `createStorageServiceInstance()`
   - keep provider-name typos fail-fast
5. Update config/docs:
   - `.env.example`
   - `README.md`
   - `docs/guides/storage-provider.md`
   - `.cursor/rules/storage-provider.mdc` when guidance changed
6. Update tests:
   - `__tests__/libraries/storage.test.ts`
   - consumer smoke around `UserRepository`

## Rules

- Keep `UploadResult.url` semantics explicit; do not blur public URL, CDN URL, and signed URL.
- `S3_COMPATIBLE_FORCE_PATH_STYLE` must preserve both `true` and `false`; there is a regression test for this.
- Adding a storage provider does not automatically solve browser rendering. Review `EXTRA_REMOTE_IMAGE_URLS` and `src/libraries/security-headers.ts` separately when URLs must load in the browser.
- Use `SYSTEM_AWS_*` names consistently in code, docs, and examples.

## Files To Touch

- `src/libraries/storage.ts`
- `__tests__/libraries/storage.test.ts`
- `__tests__/repositories/user_repository.storage-provider.test.ts`
- `.env.example`
- `README.md`
- `docs/guides/storage-provider.md`
- `.cursor/rules/storage-provider.mdc`

## Quick Decisions

- R2 / MinIO / Spaces / Wasabi: evaluate as `s3-compatible` first
- GCS / Azure Blob: usually dedicated provider
- Display-only request: likely `EXTRA_REMOTE_IMAGE_URLS` and CSP, not `storage.ts`
