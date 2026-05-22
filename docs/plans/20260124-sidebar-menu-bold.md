# サイドバーで選択されている項目を太字にする

サイドバーでどこが選ばれているかわからないので、選択されている項目を太字にする
ただし、クリックして到達するページだけでなく、その配下のページの時も太字にしたい


---

## 実装計画（追記）

### 背景
- `src/components/organisms/AppSidebar/index.tsx` と `src/components/organisms/AdminSidebar/index.tsx` は現在の URL を参照せず、選択中メニューの見た目が変わらない。
- `src/components/atoms/sidebar.tsx` の `SidebarMenuButton` には `isActive` が定義済みだが、呼び出し側で未使用のため `data-active` が付与されていない。
- 既存の `src/components/organisms/SideMenu/index.tsx` では `usePathname()` + `startsWith` で「配下ページでもアクティブ」を判定しており、同様の方針が流用可能。
- テスト（`__tests__/components/organisms/AppSidebar.test.tsx` / `__tests__/components/organisms/AdminSidebar.test.tsx`）は `next/navigation` を一部だけモックしているため、`usePathname` 追加時の調整が必要。

### 方針とその理由
- **`usePathname()` を `AppSidebar` / `AdminSidebar` に導入し、`href` と `pathname` の前方一致でアクティブ判定を行う**
  - 「配下ページでも太字」という要件を満たしつつ、既存の `SideMenu` 実装と整合するため。
- **`SidebarMenuButton` / `SidebarMenuSubButton` の `data-active` スタイルを太字（`font-semibold` 以上）へ調整する**
  - 既存の `isActive` を活用しつつ、要件である「太字」を明確に表現するため。
- **`isActive` 判定ロジックを関数化して境界条件（完全一致／`/` 区切り）を明確にする**
  - `/admin/users` が `/admin/users-archive` に誤マッチする等の誤判定を避けるため。
- **テストは `usePathname` をモックし、トップ階層と配下階層で `data-active` が正しく付与されることを確認する**
  - 仕様の回帰を防止し、動作をドキュメント化するため。

### 具体的なタスク
- [ ] 既存のサイドバー関連実装を再確認する。
  - `src/components/atoms/sidebar.tsx` の `SidebarMenuButton` / `SidebarMenuSubButton` の active スタイルと `isActive` の流れを読み直す。
  - `src/components/organisms/SideMenu/index.tsx` の `isActive` 実装（`usePathname` + `startsWith`）を参照し、共通化の方針を決める。
- [ ] アクティブ判定のヘルパー関数を設計する。
  - 例: `isActivePath(pathname, href)` を `pathname === href || pathname.startsWith(href + "/")` で判定。
  - 末尾スラッシュの有無を正規化する（`/` 終端を削る）か、`href === "/"` の特例を設ける。
  - 置き場所（各コンポーネント内のローカル関数 or `src/libraries/route.ts` などの共通関数）を決定する。
- [ ] `AppSidebar` にアクティブ判定を追加する。
  - `usePathname()` を導入し、`menuItems.map` 内で `isActivePath` を計算。
  - `SidebarMenuButton` に `isActive={isActivePath(item.href)}` を渡し、必要なら `aria-current="page"` を付与。
  - 既存の `data-testid` やメニュー構造を崩さないことを確認する。
- [ ] `AdminSidebar` にアクティブ判定を追加する。
  - `usePathname()` と `isActivePath` を同様に導入。
  - `data-testid` 付きの各ボタンで `data-active` が付与されるようにする。
- [ ] アクティブ時の太字スタイルを調整する。
  - `src/components/atoms/sidebar.tsx` の `sidebarMenuButtonVariants` に `data-[active=true]:font-semibold` もしくは `font-bold` を追加。
  - サブメニューが存在する場合に備え、`SidebarMenuSubButton` にも同様の太字スタイルを追加する。
  - `font-weight` 変更によりレイアウト崩れが出ないかを確認する。
- [ ] テストを更新する。
  - `__tests__/components/organisms/AppSidebar.test.tsx` と `__tests__/components/organisms/AppSidebar.language.test.tsx` の `next/navigation` モックに `usePathname` を追加。
  - `__tests__/components/organisms/AdminSidebar.test.tsx` の `next/navigation` モックにも `usePathname` を追加。
  - `/admin/users` を `pathname` に設定した場合に「Users」が active になること、`/admin/users/123` でも active になることを検証するテストを追加。
- [ ] Storybook 上での確認方針を決める。
  - `AppSidebar.stories.tsx` / `AdminSidebar.stories.tsx` で `usePathname` をモックできる仕組み（Storybook の Next.js パラメータや decorator）を確認。
  - モックが難しい場合は、Storybookでは説明コメントを追加し、アプリ上での手動確認に寄せる。
- [ ] 動作確認を行う。
  - `/dashboard` と `/dashboard/*` で対象メニューが太字になることを確認。
  - `/admin/users` と `/admin/users/[id]` で同じメニューが太字になることを確認。
  - モバイル / デスクトップ両方で見た目が崩れないことを確認。
