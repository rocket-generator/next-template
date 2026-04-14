# ユニットテストガイド

## テストの義務

- 新規コンポーネント作成時: テストも必ず作成
- 既存コンポーネント改修時: 対応テストも必ず更新
- 削除時: 対応テストも削除

## 環境

- **Jest**: テストフレームワーク
- **React Testing Library**: React コンポーネントテスト
- **@testing-library/jest-dom**: DOM アサーション用マッチャー

## ファイル配置

テストは `__tests__/` 配下に、ソースのディレクトリ構造を反映して配置する。

- `src/libraries/hash.ts` → `__tests__/libraries/hash.test.ts`
- `src/app/(site)/(unauthorized)/page.tsx` → `__tests__/app/(site)/(unauthorized)/page.test.tsx`

## 実行コマンド

```bash
npm test                                 # 全テスト実行
npm test -- --watch                      # ウォッチモード
npm test -- --coverage                   # カバレッジ
npm test -- __tests__/libraries/hash.test.ts  # 特定ファイル
npm test -- -t "should hash password"    # 特定ケース
```

## 基本構造

```typescript
import { targetFunction } from "@/path/to/module";

describe("モジュール名", () => {
  describe("関数名", () => {
    it("should do something", async () => {
      // Arrange
      const input = "テスト入力";
      // Act
      const result = await targetFunction(input);
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### ルール

- `describe` で階層化
- `it` は英語で `should` から始める
- AAA（Arrange-Act-Assert）パターン

## ライブラリ関数のテスト例

```typescript
describe("Hash Library", () => {
  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const hashed = await hashPassword("testPassword123");
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
    });

    it("should be able to hash empty password", async () => {
      const hashed = await hashPassword("");
      expect(hashed).toBeDefined();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete hash→verification flow", async () => {
      const passwords = ["simple", "Complex!@#123", "", "日本語", "a".repeat(500)];
      for (const password of passwords) {
        const hashed = await hashPassword(password);
        const valid = await verifyPassword(password, hashed);
        expect(valid).toBe(true);
      }
    });
  });
});
```

## React コンポーネントのテスト例

```typescript
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Component from "@/app/path/to/component";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...rest } = props;
    return <img {...rest} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("Component名", () => {
  beforeEach(() => render(<Component />));

  it("renders specific element", () => {
    expect(screen.getByTestId("page-heading")).toBeInTheDocument();
  });

  it("renders link with correct href", () => {
    expect(screen.getByTestId("navigation-link")).toHaveAttribute("href", "/expected/path");
  });
});
```

## クエリ選択（重要）

**⚠️ `getByText` / `getByLabelText` / `getByRole` with name の使用は禁止**

国際化対応・テキスト変更への耐性のため、以下を厳守する：

```typescript
// ✅ 推奨: data-testid
screen.getByTestId("submit-button");
screen.getByTestId("email-input");

// ❌ 禁止
screen.getByText("Submit");
screen.getByLabelText("Email");
screen.getByRole("button", { name: "Submit" });
```

## data-testid 命名規則

```
component-name              // コンポーネント名
component-name-action       // アクション付き
component-name-state        // 状態付き
```

具体例：

```
submit-button
email-input
error-message
loading-spinner
list-item-1
user-item-${userId}         // 動的
tab-item-home
```

## アサーション

```typescript
// 基本
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeDefined();
expect(value).toBeTruthy();

// DOM（@testing-library/jest-dom）
expect(element).toBeInTheDocument();
expect(element).toHaveAttribute("href", "/path");
expect(element).toHaveTextContent("text");
expect(element).toHaveClass("className");
```

## 非同期テスト

```typescript
import { waitFor } from "@testing-library/react";

it("should display data after loading", async () => {
  render(<AsyncComponent />);
  await waitFor(() => {
    expect(screen.getByTestId("loaded-data")).toBeInTheDocument();
  });
});
```

## エラーケース

```typescript
it("should throw error for invalid input", async () => {
  await expect(fn()).rejects.toThrow("Error message");
});
```

## フォームテスト例

```typescript
it("should submit form with valid data", async () => {
  render(<LoginForm />);
  fireEvent.change(screen.getByTestId("email-input"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByTestId("password-input"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByTestId("submit-button"));
  await waitFor(() => {
    expect(screen.getByTestId("success-message")).toBeInTheDocument();
  });
});
```

## カバレッジ目標

- ライブラリ・ユーティリティ: 90% 以上
- React コンポーネント: 80% 以上
- 全体: 80% 以上

レポート: `coverage/lcov-report/index.html`

## セットアップ / クリーンアップ

```typescript
describe("Test Suite", () => {
  beforeEach(() => { /* 各テスト前 */ });
  afterEach(() => { jest.clearAllMocks(); });
});
```

## パラメータ化テスト

```typescript
describe.each([
  ["input1", "expected1"],
  ["input2", "expected2"],
])("fn(%s)", (input, expected) => {
  it(`returns ${expected}`, () => {
    expect(fn(input)).toBe(expected);
  });
});
```

## トラブルシューティング

1. **Module not found** → `jest.config.cjs` の `moduleNameMapper` と tsconfig のパスエイリアスを確認
2. **Next.js コンポーネントエラー** → `next/image`, `next/link`, `next/navigation` のモックを確認
3. **タイムアウト** → `async/await` の利用 / `jest.setTimeout(10000)`
4. **DOM 要素が見つからない** → クエリ・data-testid・`waitFor` を確認
