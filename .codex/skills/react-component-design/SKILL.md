---
name: react-component-design
description: Design the structure of the react components
---

# ページ・コンポーネント作成ガイドライン

このドキュメントは、本プロジェクトにおける React を使用したページおよびコンポーネントの作成方法に関するルールとベストプラクティスをまとめたものです。

## 1. 基本原則

-   **TypeScript の徹底**: 全てのコードはTypeScriptで記述します。`any` 型の使用は原則禁止です。
-   **関心の分離**: UI、状態管理、データフェッチのロジックを適切に分離します。
-   **命名規則**: ファイル名、ディレクトリ名、コンポーネント名、変数名などは一貫性のある命名規則に従います。（詳細は後述）
-   **ディレクトリ構造**: 機能ごと、またコンポーネントの種類（atoms, molecules, organisms）ごとに整理されたディレクトリ構造を維持します。（詳細は後述）

## 2. ディレクトリ構造とファイル命名規則

### 2.1. ページ (App Router)

-   ページは `frontend/src/routes` ディレクトリ以下に配置します。
-   ページは、コンポーネントをラップすることと、ビジネスロジックを記述することに専念する。実際のUIはコンポーネントの組み合わせによって構築する。
-   ただし、ボタンを押したときの処理、データのロードなどは、ページに記述しなければならない。

### 2.2. コンポーネント (`frontend/src/components`)

-   全てのUIコンポーネントは `frontend/src/components` ディレクトリ以下に配置します。
-   コンポーネントにビジネスロジックを配置することは禁止である。全て、ページから注入して処理をする。
-   コンポーネントはAtomic Designの考え方に基づき、`atoms`, `molecules`, `organisms` のいずれかのサブディレクトリに分類します。
    -   **atoms**: それ以上分割できない最小単位のUI要素（例: `Button`, `Input`, `Icon`）。Shadcn/UIから提供されるコンポーネントが主にここに該当します。原則として、このディレクトリにカスタムコンポーネントを新規作成することは避け、Shadcn/UIのものをそのまま利用するか、ラッパーを作成する場合は `molecules` 以上に配置します。
    -   **molecules**: 複数のatomを組み合わせて作られる、より具体的な機能を持つUI部品（例: `SearchInput` (Input atom + Button atom), `UserAvatarMenu`）。
    -   **organisms**: 複数のmoleculeやatomを組み合わせて作られる、ページのセクションや独立したUI領域（例: `AppHeader`, `RecordList`, `ProductCardGrid`）。

-   **各コンポーネントのファイル構成**: `molecules` および `organisms` に属するコンポーネントは、以下の構造を取ります。
    -   コンポーネント名を `PascalCase` としたディレクトリを作成します。
    -   そのディレクトリ直下に `index.tsx` を作成し、コンポーネントのメインロジックを記述します。
    -   例:
        ```
        frontend/src/components/
        ├── molecules/
        │   └── PetFilter/
        │       └── index.tsx  // PetFilterコンポーネント本体
        └── organisms/
            └── AppHeader/
                └── index.tsx  // AppHeaderコンポーネント本体
        ```
-   **`atoms` のコンポーネント**: Shadcn/UIから提供されるものは、通常 `frontend/src/components/ui` に配置されることが多いですが、本プロジェクトでは既存の `frontend/src/components/atoms` をShadcn/UIコンポーネントの格納場所として扱います。これらは直接編集せず、拡張する場合は `molecules` 以上でラップします。

### 2.3. 型定義

-   プロジェクト全体で使用する型定義は `frontend/src/types/index.ts` に集約します。
-   コンポーネント固有の型定義（Propsの型など）は、そのコンポーネントファイル (`index.tsx`) 内に記述します。

## 3. コンポーネント設計

### 3.1. Props

-   コンポーネント間で渡すPropsの型は明確に定義します。

### 3.2. スタイリング

-   Tailwind CSS を使用します。
-   コンポーネントのスタイルは、そのコンポーネントファイル内のJSXに直接クラス名を記述します。
-   共通の色やテーマは `tailwind.config.js` で定義されているものを利用します。

## 6. Storybook 対応

-   コンポーネントを `CamelCaseディレクトリ/index.tsx` の形式で作成することにより、将来的にStorybookの`*.stories.tsx` ファイルを各コンポーネントディレクトリ内に配置しやすくなります。
    -   例: `src/components/molecules/PetFilter/PetFilter.stories.tsx`

このガイドラインに従って、一貫性があり、メンテナンスしやすく、パフォーマンスの高いアプリケーションを構築してください。
