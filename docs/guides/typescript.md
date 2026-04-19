# TypeScript ガイドライン

## 必須ルール

- すべてのコードは TypeScript で記述する
- `any` 型は使用しない（ビルドが通らない）
- Shadcn と Tailwind CSS を常に使用し、Card コンポーネントを使わずに実装する
- コンポーネントを `React.FC` で型付けしない
- コンポーネントは `function` ではなく `const` で宣言する
- React のコンポーザブルなパターンに従う

## TypeScript 6 設定

- `tsconfig.json` は TypeScript 6 を前提とし、Jest と Node の ambient types を明示する
- `compilerOptions.types` は `["node", "jest"]` を基本値とする
- Storybook / Vitest / Playwright 側で追加の ambient types が必要な場合は、個別の設定ファイル側で閉じ込める

## 状態管理とパフォーマンス

- `useState` / `useEffect` の使用は最小限にする
- 可能な限り算出値（computed state）を優先する
- 不要な再レンダリングを防ぐため、必要な場面で `useMemo` / `useCallback` を使う
- Server Actions と `useActionState` を優先する
- Server Actions が適さない場合のみ fetch と API route handler を使う
- コンポーネントがデータを変更する必要がある場合、props として Server Actions を受け取る

## コンポーネント設計

- 可能な限り Server Component を優先する
- 必要な場合のみ Client Component を作る
- Suspense とストリーミングを活用する
- コンポーネント自体と密に結合していない特定機能は、HOC として切り出す
- 配布・使用しやすいよう、意味的に関連するコンポーネント・フック・関数は同一ファイルにまとめる

## フォームとデータ処理

- フォームは Server-side Component として実装する
- 動的な操作（ユーザー登録セクションなど）のみ Client Component を使用する
- Server Actions と API エンドポイントでは常に Zod で入力を検証する
- テキストコンテンツは常に HTML エスケープする

## カスタムフック

- `useState` / `useEffect` をまとめる意味がある場合、カスタムフックで特定のロジックをカプセル化する
- カスタムフックは焦点を絞り再利用可能にする

## ベストプラクティス

- 一貫した命名規則に従う
- 関心の分離を明確に保つ
- 適切なエラーハンドリングを実装する
- コードベース全体で型安全性を確保する
