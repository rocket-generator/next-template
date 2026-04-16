---
name: storage-provider-extension
description: Use when adding, switching, or reviewing file/object storage backends in this template, especially for S3-compatible stores, Google Cloud Storage, Azure Blob Storage, Cloudflare R2, or MinIO.
---

# Storage Provider Extension

## Overview

This skill is for extending the template's storage layer without mixing up three separate concerns:

1. Storage provider implementation
2. Browser rendering through `next/image`
3. CSP / security header allowances

Read [`docs/guides/storage-provider.md`](../../../docs/guides/storage-provider.md) first.

## Use This Skill For

- Adding a new storage backend
- Switching from S3 to another provider
- Reviewing whether a provider needs a new class or can reuse S3-compatible config
- Checking what docs, env vars, and tests must change

## Workflow

1. Identify whether the request is:
   - display-only (`next/image` / remote URLs)
   - full provider integration (upload / download / delete / signed URL / list)
2. Inspect `src/libraries/storage.ts` and keep `StorageProvider` / `StorageService` contracts intact unless there is a clear reason to change them.
3. Prefer reusing `S3Provider` for S3-compatible services before adding a dedicated provider.
4. If a dedicated provider is required:
   - add provider config and validation
   - add provider class
   - update `createStorageServiceInstance()`
5. Update display/security layers separately when needed:
   - `EXTRA_REMOTE_IMAGE_URLS`
   - `src/libraries/security-headers.ts`
6. Update:
   - `.env.example`
   - `README.md`
   - `docs/guides/storage-provider.md`
7. Add targeted tests for:
   - provider selection
   - env validation
   - upload/download/delete/list
   - signed URL generation

## Rules

- Fail fast on invalid or missing provider env.
- Do not assume that adding a storage provider also solves browser image rendering.
- Do not assume that `next/image` allowlists also update CSP.
- Keep public URL, CDN URL, and signed URL semantics explicit.

## Examples

- GCS usually needs a dedicated provider.
- Azure Blob usually needs a dedicated provider.
- R2 / MinIO / Spaces should be evaluated as S3-compatible first.
