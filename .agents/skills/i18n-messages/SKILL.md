---
name: i18n-messages
description: Use when adding or changing translations in messages/ja.json or messages/en.json, using getTranslations/useTranslations, or updating next-intl configuration under src/i18n/. Covers message key hierarchy, Server/Client Component APIs, dynamic and rich-text patterns, and JSON duplicate-key pitfalls.
---

# i18n Messages

## Overview

UI に表示する全テキストは next-intl 経由。`messages/ja.json` と `messages/en.json` を同時更新する。正本は `docs/guides/i18n.md`。

## When to Use

- 翻訳キーを追加・変更・削除する
- `messages/ja.json` / `messages/en.json` を編集する
- `src/i18n/routing.ts` / `src/i18n/request.ts` を変更する
- Server / Client Component での翻訳取得方法を確認する

**When NOT to use**: 新規ページ・コンポーネント作成自体は `creating-pages-components`（その中で翻訳も当然使う）。

## Must-Follow Rules

1. **ハードコードされた文字列を書かない**。全て翻訳キー経由
2. **`messages/ja.json` と `messages/en.json` を必ず同時更新**。片方だけの追加は禁止
3. **JSON のフォーマットを厳守**。キー重複・カンマ崩れを起こさない（AI がやりがち）
4. **Server Component → `getTranslations("Namespace")`、Client Component → `useTranslations("Namespace")`**。逆は使えない
5. **タイムゾーンは `Asia/Tokyo` 固定**（`src/i18n/request.ts` 参照）

## メッセージ構造

機能別・コンポーネント別にネスト。共通文言は `Common` / `Crud` にまとめる。

```json
{
  "Auth": { "signin": "ログイン", "email": "メールアドレス" },
  "Menu": { "Admin": { "users": "ユーザー" } },
  "Common": { "buttons": { "save": "保存", "cancel": "キャンセル" } }
}
```

## 使用例

```ts
// Server
const t = await getTranslations("Menu.Admin");
t("users");

// Client
"use client";
const tAuth = useTranslations("Auth");
tAuth("signin");

// 動的
t("welcome", { name: "山田太郎" });

// Rich text
t.rich("description", { link: (chunks) => <Link href="/x">{chunks}</Link> });
```

## Key Files

- `messages/ja.json` / `messages/en.json` — 翻訳本体
- `src/i18n/routing.ts` — ロケール・パス名設定
- `src/i18n/request.ts` — `getRequestConfig`、タイムゾーン
- `src/app/providers.tsx` — `NextIntlClientProvider` ラップ
- `src/app/layout.tsx` — `getLocale()` / `getMessages()` 取得

## Reference

- **正本**: `docs/guides/i18n.md`
- `AGENTS.md §国際化（i18n）`

## Checklist

- [ ] `messages/ja.json` と `messages/en.json` の **両方**に同じキーで追加
- [ ] JSON が valid（キー重複なし、カンマ正しい）
- [ ] Server/Client で正しい API（`getTranslations` / `useTranslations`）を使用
- [ ] テストが翻訳キーに依存していない（`data-testid` ベース）
