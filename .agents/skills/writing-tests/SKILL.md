---
name: writing-tests
description: Use when writing or updating Jest / React Testing Library tests under __tests__/. Covers data-testid rules (getByText/getByLabelText/getByRole-with-name forbidden), lucide-react/next-intl/next navigation mocks, library vs component test patterns, and coverage targets.
---

# Writing Tests

## Overview

Jest + React Testing Library で `__tests__/` 配下にテストを書く。ライブラリ関数とコンポーネント、両方ともこの Skill でカバーする。正本は `docs/guides/unit-testing.md` + `docs/guides/component-testing.md`。

## When to Use

- 新規コードに Jest / RTL テストを書く
- 既存テストを改修・拡張する
- `__tests__/` 配下のファイルを操作する

**When NOT to use**: Playwright E2E は対象外（`e2e/` 配下は別運用）。Storybook は `writing-storybook`。

## Must-Follow Rules

1. **`getByText` / `getByLabelText` / `getByRole` with `name` は禁止**。国際化耐性のため `data-testid` を使う
2. **`it` は英語で `should ...` から始める**。AAA（Arrange-Act-Assert）パターン
3. **Next.js コンポーネントは必ずモック**: `next/image` / `next/link` / `next/navigation`
4. **アイコンは `lucide-react` をモックし、`data-testid` 付きで返す**
5. **next-intl も必ずモック**（`useTranslations` / `getTranslations` / `useFormatter`）
6. **テスト配置はソース構造を反映**: `src/libraries/hash.ts` → `__tests__/libraries/hash.test.ts`
7. **非同期は `waitFor`**。`setTimeout` 直書きは禁止

## 実装側も抑える

- インタラクティブ要素・アイコン・状態ごとの要素に `data-testid` を付ける
- `data-testid` は **ケバブケースで意味のある名前**: `submit-button`, `user-menu-dropdown`, `data-table-row-${id}`
- ボタン・リンクに `aria-label`（スクリーンリーダー + テスト両立）

## 必須モック（コピペ用）

```ts
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...rest } = props;
    return <img {...rest} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => "/current/path",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  // 必要なアイコン分を追加
}));

const mockT = jest.fn((key: string) => key);
jest.mock("next-intl/server", () => ({ getTranslations: jest.fn(() => Promise.resolve(mockT)) }));
jest.mock("next-intl", () => ({
  useTranslations: () => mockT,
  useFormatter: () => ({ dateTime: (d: Date) => d.toLocaleDateString(), number: (n: number) => n.toLocaleString() }),
}));
```

## Key Files

- `__tests__/` — テスト配置先（ソース構造を反映）
- `jest.setup.ts` — グローバルモック（Better Auth 等）
- `jest.config.cjs` — `moduleNameMapper` / タイムアウト
- `coverage/lcov-report/index.html` — カバレッジレポート

## カバレッジ目標

- ライブラリ・ユーティリティ: 90% 以上
- コンポーネント: 80% 以上（重要機能 100%）
- 全体: 80% 以上

## Reference

- **正本**: `docs/guides/unit-testing.md` + `docs/guides/component-testing.md`
- `AGENTS.md §テスト方針`

## Checklist

- [ ] `__tests__/` 配下にソース構造を反映して配置
- [ ] `describe` → `it("should ...")` で AAA パターン
- [ ] `data-testid` ベース（`getByText` / `getByLabelText` / `getByRole name` 不使用）
- [ ] Next.js / next-intl / lucide-react のモックを設定
- [ ] 非同期は `waitFor`
- [ ] エラー / 状態 / アクセシビリティ (aria-*) の観点をカバー
- [ ] `npm test` が pass
