# コンポーネントテストガイド

UI コンポーネントに対する、国際化対応・アクセシビリティ配慮のテスト作成指針。

## 基本原則

1. **テスト作成の義務**: 新規・改修・削除時に対応テストを必ず作成/更新/削除
2. **国際化対応**:
   - 日本語テキストの直接使用禁止（`screen.getByText("設定")` など）
   - 表示テキストに依存しないテスト設計
   - `data-testid` / `aria-label` / `role` で識別
3. **アクセシビリティファースト**:
   - セマンティック HTML
   - `aria-*` 属性を適切に設定
   - キーボードナビゲーションを考慮

## テスト識別子

### data-testid

最も確実で言語非依存な方法。コンポーネント側・テスト側の両方で活用する。

```tsx
// コンポーネント
<div data-testid="user-menu-container">
  <button data-testid="user-menu-button">
    <User className="w-5 h-5" />
  </button>
</div>
```

```tsx
// テスト
const btn = screen.getByTestId("user-menu-button");
fireEvent.click(btn);
expect(screen.getByTestId("user-menu-dropdown")).toBeInTheDocument();
```

#### 命名規則

- ケバブケース: `user-menu-button`
- 階層: `parent-child-element`
- 意味のある名前

例: `pagination-info`, `search-input-field`, `data-table-row-${id}`, `item-${id}-edit-button`

### aria-label

アクセシビリティとテストを両立できる。

```tsx
<button
  data-testid="user-menu-button"
  aria-label="User menu"
  aria-expanded={isMenuOpen}
>
```

```tsx
const btn = screen.getByRole("button", { name: "User menu" });
expect(btn).toHaveAttribute("aria-expanded", "false");
```

### アイコンの data-testid

```tsx
jest.mock("lucide-react", () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">Chevron Down</div>,
}));
```

## テストファイルの基本構造

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ComponentName from "@/components/path/ComponentName";

jest.mock("lucide-react", () => ({
  IconName: () => <div data-testid="icon-name">Icon</div>,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(), back: jest.fn(), forward: jest.fn(),
    refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn(),
  }),
}));

describe("ComponentName", () => {
  const defaultProps = { /* ... */ };

  beforeEach(() => jest.clearAllMocks());

  describe("Rendering", () => {
    it("should render component with required elements", () => {
      render(<ComponentName {...defaultProps} />);
      expect(screen.getByTestId("component-container")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should handle button click", () => {
      const cb = jest.fn();
      render(<ComponentName {...defaultProps} onAction={cb} />);
      fireEvent.click(screen.getByTestId("action-button"));
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ComponentName {...defaultProps} />);
      const btn = screen.getByRole("button", { name: "Action" });
      expect(btn).toHaveAttribute("aria-label", "Action");
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

## 必須モック

### Next.js

```tsx
jest.mock("next/link", () => ({ children, href }: any) => <a href={href}>{children}</a>);

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const { priority, quality, placeholder, blurDataURL, ...rest } = props;
    return <img {...rest} />;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(), back: jest.fn(), forward: jest.fn(),
    refresh: jest.fn(), replace: jest.fn(), prefetch: jest.fn(),
  }),
  usePathname: () => "/current/path",
  useSearchParams: () => new URLSearchParams(),
}));
```

### next-intl

```tsx
const mockTranslation = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    "button.save": "Save",
    "button.cancel": "Cancel",
  };
  return translations[key] || key;
});

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => Promise.resolve(mockTranslation)),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => mockTranslation,
  useFormatter: () => ({
    dateTime: (d: Date) => d.toLocaleDateString(),
    number: (n: number) => n.toLocaleString(),
  }),
}));
```

## 動的 testid の使用

```tsx
{items.map((item) => (
  <div key={item.id} data-testid={`item-${item.id}`}>
    <button data-testid={`item-${item.id}-edit-button`}>Edit</button>
    <button data-testid={`item-${item.id}-delete-button`}>Delete</button>
  </div>
))}
```

## 条件分岐のテスト対応

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
          <span data-testid="error-message">Error occurred</span>
        </div>
      )}
      {status === "success" && (
        <div data-testid="success-indicator" role="status">
          <span data-testid="success-message">Success</span>
        </div>
      )}
    </div>
  );
}
```

## フォーム・テーブルテスト例

### フォーム

```tsx
it("should validate form inputs", async () => {
  const onSubmit = jest.fn();
  render(<ContactForm onSubmit={onSubmit} />);

  fireEvent.click(screen.getByTestId("form-submit-button"));
  expect(screen.getByTestId("name-error-message")).toBeInTheDocument();

  fireEvent.change(screen.getByTestId("name-input"), { target: { value: "John" } });
  fireEvent.change(screen.getByTestId("email-input"), { target: { value: "a@b.c" } });
  fireEvent.click(screen.getByTestId("form-submit-button"));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ name: "John", email: "a@b.c" });
  });
});
```

### データテーブル

```tsx
it("should handle row actions", () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  render(<DataTable data={mockData} onEdit={onEdit} onDelete={onDelete} />);

  fireEvent.click(screen.getByTestId("data-table-row-1-edit-button"));
  expect(onEdit).toHaveBeenCalledWith("1");

  fireEvent.click(screen.getByTestId("data-table-row-1-delete-button"));
  expect(onDelete).toHaveBeenCalledWith("1");
});
```

## アクセシビリティテスト

```tsx
it("should have proper heading hierarchy", () => {
  render(<Page />);
  const headings = screen.getAllByRole("heading");
  expect(headings[0]).toHaveAttribute("aria-level", "1");
});

it("should have alt text for all images", () => {
  render(<Gallery />);
  screen.getAllByRole("img").forEach((img) => {
    expect(img).toHaveAttribute("alt");
    expect(img.getAttribute("alt")).not.toBe("");
  });
});

it("should support keyboard navigation", () => {
  render(<DropdownMenu />);
  const btn = screen.getByRole("button", { name: "Menu" });
  fireEvent.keyDown(btn, { key: "Enter" });
  expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
  fireEvent.keyDown(btn, { key: "Escape" });
  expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
});
```

## 非同期・モーダルテスト

```tsx
it("should handle async data loading", async () => {
  const fetchData = jest.fn().mockResolvedValue([{ id: 1, name: "Item" }]);
  render(<AsyncDataComponent fetchData={fetchData} />);

  expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByTestId("data-item-1")).toBeInTheDocument();
  });
});

it("should handle modal dialog", async () => {
  render(<ModalComponent />);
  fireEvent.click(screen.getByTestId("open-modal-button"));
  await waitFor(() => {
    expect(screen.getByTestId("modal-dialog")).toBeInTheDocument();
  });
  fireEvent.click(screen.getByTestId("modal-close-button"));
  await waitFor(() => {
    expect(screen.queryByTestId("modal-dialog")).not.toBeInTheDocument();
  });
});
```

## 避けるべきパターン

```tsx
// ❌ 日本語テキスト依存
expect(screen.getByText("設定")).toBeInTheDocument();

// ❌ 曖昧なセレクタ
expect(container.querySelector("button")).toBeInTheDocument();

// ❌ 実装詳細への依存
expect(wrapper.state.isOpen).toBe(true);

// ❌ 不適切な wait
await new Promise(r => setTimeout(r, 1000));
```

```tsx
// ✅ data-testid
expect(screen.getByTestId("settings-button")).toBeInTheDocument();

// ✅ 意味のある role + label
expect(screen.getByRole("navigation", { name: "Main menu" })).toBeInTheDocument();

// ✅ waitFor
await waitFor(() => {
  expect(screen.getByTestId("success-message")).toBeInTheDocument();
});
```

## カバレッジ目標

- コンポーネント: 90% 以上
- 重要機能: 100%
- エラーハンドリング: 85% 以上

## チェックリスト

### 実装側

- [ ] インタラクティブ要素に data-testid
- [ ] ボタン・リンクに aria-label
- [ ] アイコンに data-testid
- [ ] セマンティック HTML 使用
- [ ] ARIA 属性適切

### テスト側

- [ ] テストファイル作成済み
- [ ] 必要なモック設定済み
- [ ] 基本レンダリングテスト
- [ ] インタラクションテスト
- [ ] アクセシビリティテスト
- [ ] エラー状態テスト
- [ ] data-testid 使用
- [ ] テキスト依存なし
