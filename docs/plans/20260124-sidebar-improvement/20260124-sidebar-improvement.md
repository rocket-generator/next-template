# サイドバーのUI改善

サイドバーの挙動を変更する。ChatGPTのUIを参考にする。

## 1. デスクトップ/タブレットの幅で、サイドバーが開いた状態 

参考にする画像: specifications/plans/20260124-sidebar-improvement/sidebar_desktop_open.png

サイト名はサイドバーから、コンテンツ領域に移動する（ヘッダーに表示する）。
サイドバーを閉じるボタンは、サイドバーの右上に表示する。
サイドバーの左上にはロゴだけを表示する。

## 2. デスクトップ/タブレットの幅で、サイドバーが閉じた状態 

参考にする画像: specifications/plans/20260124-sidebar-improvement/sidebar_desktop_closed.png

サイドバーを完全に消さず、アイコンだけを残す。
一番上部はロゴだけを表示しているが、マウスオーバーすると「サイドバーを開く」アイコンが表示される。また、「サイドバーを開く」というツールチップ的なものが表示される（多言語化する必要がある）。specifications/plans/20260124-sidebar-improvement/sidebar_desktop_closed_mouseover.png の画像を参考にしてください。

## 3. モバイルの幅でサイドバーが閉じた状態

参考にする画像: specifications/plans/20260124-sidebar-improvement/sidebar_mobile_closed.png

モバイルでは、サイドバーを完全に消すが、タイトルの左側に「サイドバーを開く」アイコンが表示され、クリックするとサイドバーが開く。

## 4. モバイルの幅でサイドバーが開いた状態

参考にする画像: specifications/plans/20260124-sidebar-improvement/sidebar_mobile_open.png

モバイルでは、サイドバーはアニメーションで開閉し、オーバーレイで表示され（個々は現状と同じ）、右側のボタンはバツアイコンに変更される。


---

## 5. 実装計画（追記）

### 背景
- 既存のサイドバーは `src/components/atoms/sidebar.tsx` の offcanvas 仕様が前提で、デスクトップの「閉じた状態」は完全に隠れる設計になっている。
- `src/components/organisms/AppSidebar/index.tsx` / `src/components/organisms/AdminSidebar/index.tsx` でサイト名とロゴがサイドバー内に固定されており、要件（ヘッダーへ移動）と不一致。
- `src/app/(site)/(authorized)/(app)/layout.tsx` / `src/app/(site)/(authorized)/admin/layout.tsx` のヘッダーはトリガーのみで、モバイルの「タイトル左側に開くアイコン」要件を満たせない。
- 仕様画像 `specifications/plans/20260124-sidebar-improvement/*.png` に合わせた UI 変更が必要。

### 方針とその理由
- **既存の Sidebar アトムを拡張し、`collapsible="icon"` をデフォルトに近い挙動として使う**
  - すでに `group-data-[collapsible=icon]` でアイコン幅の UI が実装済みで、追加コストが少ない。
- **サイト名はレイアウトのヘッダーへ移動し、サイドバーはロゴ＋操作に特化**
  - ヘッダーに一貫して表示でき、モバイル時の「タイトル左側に開くアイコン」も自然に実装できる。
- **モバイルは Sheet の挙動を維持しつつ、右上の閉じるボタンを明示表示**
  - 既存アニメーション・オーバーレイを残しつつ、要件の「バツアイコン」を満たす。
- **多言語対応は `messages/ja.json` / `messages/en.json` に集約**
  - `next-intl` の既存運用に合わせ、ツールチップ・aria-label を翻訳キー化して一貫性を保つ。

### 具体的なタスク
- [ ] 仕様画像を再確認し、デスクトップ/モバイルの open/closed 4 状態の差分を箇条書きで整理する（`specifications/plans/20260124-sidebar-improvement/*.png`）。
- [x] `src/components/atoms/sidebar.tsx` の `Sidebar` モバイル実装で `SheetContent` の `X` ボタンが非表示になっている理由を確認し、要件に合わせて表示できる設計案（デフォルトボタン復活 or カスタム閉じるボタン）を決める。
- [x] `src/components/organisms/AppSidebar/index.tsx` と `src/components/organisms/AdminSidebar/index.tsx` に以下の構成変更案を反映する設計をまとめる。
  - サイドバー左上はロゴのみ表示（タイトル削除）。
  - デスクトップ展開時は右上に「閉じる」ボタンを配置（`SidebarTrigger` か専用ボタン）。
  - デスクトップ折りたたみ時はホバーで「開く」アイコン＋ツールチップを表示。
- [x] `Sidebar` 使用箇所（`AppSidebar` / `AdminSidebar`）で `collapsible="icon"` を指定し、デスクトップ閉状態でアイコン幅が残るようにする設計を定義する。
- [x] `src/app/(site)/(authorized)/(app)/layout.tsx` / `src/app/(site)/(authorized)/admin/layout.tsx` のヘッダー構成を再設計する。
  - ヘッダーにサービス名（`SERVICE_NAME`）を表示。
  - モバイル幅のみ左側に「開く」アイコン（`SidebarTrigger`）を表示。
  - デスクトップ幅ではヘッダーのトリガーを非表示にし、サイドバー側で閉じる操作を行う。
- [x] ツールチップ／aria-label 向けの翻訳キーを追加する。
  - `messages/ja.json` / `messages/en.json` に「サイドバーを開く」「サイドバーを閉じる」相当のキーを追加。
  - 参照箇所は `SidebarTrigger` か新設ボタンに集約。
- [x] `src/components/organisms/AdminSidebar/AdminSidebar.stories.tsx` を更新し、変更後の UI が Storybook で確認できるようにする（必要ならモックヘッダーも追加）。
- [ ] 見た目・挙動の手動確認を実施する。
  - デスクトップ：開/閉の切り替え、ロゴ表示、ツールチップ表示、閉じるボタン動作。
  - モバイル：ヘッダーの開くボタン、Sheet の開閉アニメーション、右上 X の動作。
  - Cookie による開閉状態保持（`SIDEBAR_COOKIE_NAME`）。
- [ ] 既存のデータ属性（`data-testid`）の影響範囲を洗い出し、必要ならテスト・E2E の更新箇所を洗い出す（特に AdminSidebar 関連）。
