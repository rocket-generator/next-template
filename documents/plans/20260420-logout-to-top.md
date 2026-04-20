# メニューからログアウトしても、画面遷移しない

ログイン後、左下（サイドバー下部）のメニューから「ログアウト」を選択しても、画面遷移が行われない。

その後リロードすると、ログイン画面に遷移するので、ログアウト自体はできているようだが、その際に画面遷移をして、 トップ画面 ( / ) に行くようにしてほしい

---

## AI追記: 実装計画とタスク整理（2026-04-20）

> この追記ブロックは AI が追加した内容であり、後続の AI / 人間の開発者が必要に応じて修正してよい。上部の既存本文は変更しない。

### 背景

- 対象の不具合は、ログイン後に左下のサイドバー下部ユーザーメニューから「ログアウト」を選択しても、その場で画面遷移しないこと。
- リロード後はログイン画面へ遷移するため、Better Auth のセッション削除自体は成功している可能性が高い。
- 現在の通常アプリ側レイアウト `src/app/(site)/(authorized)/(app)/layout.tsx` は、`AppSidebar` に `onSignOut={signOutAction}` を渡している。
- 現在の管理画面レイアウト `src/app/(site)/(authorized)/admin/layout.tsx` は、`AdminSidebar` に `onSignOut={signOutAction}` を渡している。
- `src/app/(site)/(authorized)/(app)/actions.ts` と `src/app/(site)/(authorized)/admin/actions.ts` の `signOutAction()` は、どちらも `await signOut();` のみを実行している。
- `src/libraries/auth.ts` の `signOut()` は Better Auth の `authInstance.api.signOut({ headers })` を呼ぶ薄い helper である。
- Better Auth の sign-out エンドポイントはセッション Cookie を削除して `{ success: true }` を返すだけで、画面遷移は担当しない。
- そのため、Client Component 側では Server Action の完了後も現在の保護ページに留まり、次回のリロードや再検証タイミングで初めて未認証状態として扱われる。

### 方針とその理由

#### 採用方針

`signOutAction()` の責務として、`signOut()` 成功後に `redirect("/")` を実行する。

対象は次の 2 ファイルとする。

- `src/app/(site)/(authorized)/(app)/actions.ts`
- `src/app/(site)/(authorized)/admin/actions.ts`

実装イメージ:

```ts
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut();
  redirect("/");
}
```

#### 理由

- ログアウト後の遷移先は認証状態の変更に伴う画面遷移であり、サイドバー UI より Server Action 側に置くほうが責務が明確である。
- 通常アプリ側と管理画面側の両方で同じ `signOutAction()` 名の Server Action が使われているため、両方を同じ仕様にそろえることで導線差異を防げる。
- `AppSidebar` / `AdminSidebar` は「メニュー項目がクリックされたら渡された handler を呼ぶ」責務に留められ、UI/UX デザイン変更を避けられる。
- `router.push("/")` をサイドバー内に書く方法もあるが、Server Action が失敗した場合でも遷移してしまう余地がある。`await signOut(); redirect("/")` であれば、ログアウト成功後にだけ遷移できる。
- `redirect("/")` は Next.js の Server Action で使える標準的な遷移方法であり、ログアウト後に保護ページの stale な表示を残さない。
- `src/libraries/auth.ts` の `signOut()` helper は Better Auth API の薄い wrapper として残し、アプリ固有の遷移先は各 Server Action に置く。これにより helper の再利用性を崩さない。

#### 今回やらないこと

- UI の色、余白、レイアウト、フォント、アイコン配置は変更しない。
- 技術スタックや依存バージョンは変更しない。
- `.env` は変更しない。
- Better Auth の設定、Cookie 名、セッション保存方式は変更しない。
- 新しい API Route は作成しない。
- `src/libraries/auth.ts` の `signOut()` にリダイレクト処理を埋め込まない。

### 影響範囲

#### 変更候補ファイル

- `src/app/(site)/(authorized)/(app)/actions.ts`
  - 通常アプリ側のログアウト Server Action に `redirect("/")` を追加する。
- `src/app/(site)/(authorized)/admin/actions.ts`
  - 管理画面側のログアウト Server Action に `redirect("/")` を追加する。
- `src/components/organisms/AppSidebar/index.tsx`
  - E2E と component test を安定させるため、見た目に影響しない `data-testid` を必要最小限追加する。
- `__tests__/app/authorized-signout-actions.test.ts`
  - 新規作成し、通常アプリ側と管理画面側の `signOutAction()` が `signOut()` 後に `/` へ redirect することを検証する。
- `__tests__/components/organisms/AppSidebar.test.tsx`
  - 既存のログアウト handler 呼び出しテストを維持しつつ、`getByText` / `getByRole` with name 依存を `data-testid` ベースへ寄せる。
- `e2e/auth.spec.ts`
  - ログイン後にサイドバー下部メニューからログアウトし、URL が `/` へ遷移する E2E を追加する。

#### 変更しない想定のファイル

- `src/libraries/auth.ts`
  - Better Auth API の wrapper として維持する。
- `src/components/organisms/AdminSidebar/index.tsx`
  - 既に `admin-user-menu-trigger` / `admin-signout-menu-item` があるため、今回の主修正では変更不要。ただし実装時に E2E で管理画面ログアウトも直接検証する判断をした場合は、既存 testid を使う。
- `messages/ja.json` / `messages/en.json`
  - 新しい表示文言を追加しないため変更不要。
- Storybook ファイル
  - 見た目の変更も新規 Story も不要。`data-testid` 追加のみなら Storybook 更新は不要。

### 具体的なタスク

#### 1. 現状確認

- [ ] `git status --short` を実行し、既存の未コミット変更を確認する。
  - 期待: 自分が触る対象と既存変更の境界を把握できる。
  - 注意: 既存の変更はユーザーまたは別作業によるものとして扱い、勝手に戻さない。
- [ ] `src/app/(site)/(authorized)/(app)/actions.ts` を読み、`signOutAction()` が `await signOut();` のみであることを確認する。
- [ ] `src/app/(site)/(authorized)/admin/actions.ts` を読み、管理画面側も同じ構造であることを確認する。
- [ ] `src/components/organisms/AppSidebar/index.tsx` を読み、ログアウト項目が `DropdownMenuItem onClick={onSignOut}` で呼ばれていることを確認する。
- [ ] `src/components/organisms/AdminSidebar/index.tsx` を読み、管理画面側も `DropdownMenuItem onClick={onSignOut}` で呼ばれていることを確認する。
- [ ] `src/libraries/auth.ts` の `signOut()` を確認し、Better Auth の sign-out API wrapper でありリダイレクトを含まないことを確認する。
- [ ] `documents/references/better_auth_basic_usage.md` または Better Auth の local package 実装を確認し、sign-out が `{ success: true }` を返すだけで画面遷移を担当しないことを確認する。

#### 2. Server Action の失敗するテストを書く

- [ ] `__tests__/app/authorized-signout-actions.test.ts` を新規作成する。
- [ ] `@/libraries/auth` を mock し、`signOut` が呼ばれたことを検証できるようにする。
- [ ] `next/navigation` を mock し、`redirect` が呼ばれたら `NEXT_REDIRECT` 相当の Error を throw するようにする。
- [ ] 通常アプリ側 action を次のように alias import する。

```ts
import { signOutAction as appSignOutAction } from "@/app/(site)/(authorized)/(app)/actions";
```

- [ ] 管理画面側 action を次のように alias import する。

```ts
import { signOutAction as adminSignOutAction } from "@/app/(site)/(authorized)/admin/actions";
```

- [ ] 通常アプリ側のテストケースを追加する。
  - `it("should redirect to top after app sign out", async () => { ... })`
  - Arrange: `signOut` mock を resolved にする。
  - Act: `await expect(appSignOutAction()).rejects.toThrow("NEXT_REDIRECT");`
  - Assert: `signOut` が 1 回呼ばれ、`redirect("/")` が呼ばれること。
- [ ] 管理画面側のテストケースを追加する。
  - `it("should redirect to top after admin sign out", async () => { ... })`
  - Arrange: `signOut` mock を resolved にする。
  - Act: `await expect(adminSignOutAction()).rejects.toThrow("NEXT_REDIRECT");`
  - Assert: `signOut` が 1 回呼ばれ、`redirect("/")` が呼ばれること。
- [ ] `signOut` が失敗した場合は `redirect("/")` しないテストを、通常アプリ側または管理画面側のどちらかで追加する。
  - Arrange: `signOut.mockRejectedValue(new Error("signout_failed"))`
  - Act: `await expect(appSignOutAction()).rejects.toThrow("signout_failed");`
  - Assert: `redirect` が呼ばれないこと。
- [ ] 次のコマンドを実行し、テストが失敗することを確認する。

```bash
npm test -- __tests__/app/authorized-signout-actions.test.ts
```

- [ ] 期待する失敗内容を確認する。
  - 期待: `redirect` が呼ばれていない、または `NEXT_REDIRECT` が throw されないことで失敗する。
  - 期待と違う import / mock エラーが出た場合は、mock 定義を修正してから再実行する。

#### 3. 通常アプリ側 `signOutAction()` を修正する

- [ ] `src/app/(site)/(authorized)/(app)/actions.ts` に `redirect` import を追加する。

```ts
import { redirect } from "next/navigation";
```

- [ ] `signOutAction()` を次の形に変更する。

```ts
export async function signOutAction() {
  await signOut();
  redirect("/");
}
```

- [ ] `redirect("/")` は `try/catch` で囲まない。
  - 理由: `redirect()` は Next.js の制御用例外を throw するため、catch すると遷移が壊れる。
- [ ] `signOut()` より前に `redirect("/")` を置かない。
  - 理由: セッション削除が成功する前に遷移してしまうことを避けるため。
- [ ] `setLanguageAction()` の import、処理、戻り値は変更しない。

#### 4. 管理画面側 `signOutAction()` を修正する

- [ ] `src/app/(site)/(authorized)/admin/actions.ts` に `redirect` import を追加する。

```ts
import { redirect } from "next/navigation";
```

- [ ] `signOutAction()` を次の形に変更する。

```ts
export async function signOutAction() {
  await signOut();
  redirect("/");
}
```

- [ ] 通常アプリ側と管理画面側でログアウト後の遷移先がどちらも `/` になっていることを確認する。
- [ ] 管理画面専用の遷移先を作らない。
  - 理由: 要件は「トップ画面 ( / ) に行く」ことであり、管理画面ログアウトだけ別仕様にすると将来の混乱につながる。

#### 5. Server Action テストを通す

- [ ] 次のコマンドを再実行する。

```bash
npm test -- __tests__/app/authorized-signout-actions.test.ts
```

- [ ] 期待結果を確認する。
  - `appSignOutAction()` は `signOut()` 後に `redirect("/")` する。
  - `adminSignOutAction()` は `signOut()` 後に `redirect("/")` する。
  - `signOut()` 失敗時は `redirect("/")` しない。
- [ ] 失敗した場合は、mock の呼び出し回数と import 対象を確認して修正する。

#### 6. E2E 用に AppSidebar の testid を追加する

- [ ] `src/components/organisms/AppSidebar/index.tsx` に、見た目へ影響しない `data-testid` を追加する。
- [ ] サイドバー本体に `data-testid="app-sidebar"` を追加する。

```tsx
<Sidebar data-testid="app-sidebar" collapsible="icon">
```

- [ ] サイドバータイトル周辺に `data-testid` を追加する。
  - icon wrapper: `app-sidebar-icon`
  - title text: `app-sidebar-title-text`
- [ ] メニュー項目に href 末尾ベースの `data-testid` を追加する。
  - item: `app-menu-item-${itemKey}`
  - button/link: `app-menu-button-${itemKey}`
  - icon wrapper: `app-menu-icon-${itemKey}`
  - label: `app-menu-label-${itemKey}`
- [ ] `itemKey` は既存の `AdminSidebar` と同じ考え方で、`const itemKey = item.href.split("/").pop();` を使う。
- [ ] ユーザーメニュー trigger に `data-testid="app-user-menu-trigger"` を追加する。
- [ ] ユーザー名表示に `data-testid="app-user-name"` を追加する。
- [ ] dropdown content に `data-testid="app-user-menu-dropdown"` を追加する。
- [ ] 設定メニュー項目に `data-testid="app-settings-menu-item"` を追加する。
- [ ] admin 権限用メニュー項目に `data-testid="app-admin-menu-item"` を追加する。
- [ ] ログアウトメニュー項目に `data-testid="app-signout-menu-item"` を追加する。
- [ ] 可能ならアイコンにも以下を追加する。
  - `app-settings-icon`
  - `app-admin-icon`
  - `app-signout-icon`
- [ ] この作業では className、表示順、文言、アイコン種類を変更しない。

#### 7. AppSidebar component test を更新する

- [ ] `__tests__/components/organisms/AppSidebar.test.tsx` の既存テストを `data-testid` ベースに更新する。
- [ ] `screen.getByText(...)` を使っている箇所を置き換える。
  - `screen.getByText("アプリ")` → `screen.getByTestId("app-sidebar-title-text")`
  - `screen.getByText("山田太郎")` → `screen.getByTestId("app-user-name")`
  - `screen.getByText("User")` → `screen.getByTestId("app-user-name")`
  - `screen.getByText("ログアウト")` → `screen.getByTestId("app-signout-menu-item")`
  - `screen.getByText("管理画面")` → `screen.getByTestId("app-admin-menu-item")`
  - `screen.queryByText("管理画面")` → `screen.queryByTestId("app-admin-menu-item")`
- [ ] `screen.getByRole("link", { name: ... })` を使っている箇所を置き換える。
  - dashboard: `screen.getByTestId("app-menu-button-dashboard")`
  - settings: `screen.getByTestId("app-menu-button-settings")`
- [ ] 設定メニュー遷移テストでは `screen.getByTestId("app-settings-menu-item")` を click する。
- [ ] ログアウト handler 呼び出しテストでは `screen.getByTestId("app-user-menu-trigger")` を click した後、`screen.getByTestId("app-signout-menu-item")` を click する。
- [ ] active 判定テストでは、`app-menu-button-settings` と `app-menu-button-dashboard` の `data-active` を検証する。
- [ ] admin 権限ありのテストでは、`app-admin-menu-item` が存在し、click で `router.push("/admin/dashboard")` されることを検証する。
- [ ] admin 権限なしのテストでは、`app-admin-menu-item` が存在しないことを検証する。
- [ ] `it(...)` の説明は英語で `should ...` 形式へ寄せる。
- [ ] 次のコマンドを実行し、AppSidebar の component test が通ることを確認する。

```bash
npm test -- __tests__/components/organisms/AppSidebar.test.tsx
```

#### 8. AdminSidebar component test の回帰確認

- [ ] `AdminSidebar` 自体は今回の主修正対象ではないが、管理画面側のログアウト action を変更するため、既存 component test を回帰確認する。
- [ ] 次のコマンドを実行する。

```bash
npm test -- __tests__/components/organisms/AdminSidebar.test.tsx
```

- [ ] 期待結果を確認する。
  - `admin-signout-menu-item` click で `onSignOut` が 1 回呼ばれる。
  - 既存の dropdown / settings / active 判定が壊れていない。
- [ ] 失敗した場合は、今回の変更に起因するものか既存の未解決問題かを切り分ける。

#### 9. ログアウト遷移の E2E を追加する

- [ ] `e2e/auth.spec.ts` にログアウト遷移のテストケースを追加する。
- [ ] テスト名は、既存ファイルの日本語スタイルに合わせて次のようにする。

```ts
test("サイドバーからログアウトするとトップページに遷移する", async ({ page }) => {
  // ...
});
```

- [ ] Arrange: `/signin` にアクセスする。
- [ ] Arrange: `admin@example.com` / `password` でサインインする。
- [ ] Arrange: `/dashboard` へ遷移したことを確認する。
- [ ] Act: `page.locator('[data-testid="app-user-menu-trigger"]').click()` でユーザーメニューを開く。
- [ ] Act: `page.locator('[data-testid="app-signout-menu-item"]').click()` でログアウトする。
- [ ] Assert: `page.waitForURL((url) => url.pathname === "/")` でトップページ遷移を待つ。
- [ ] Assert: `await expect(page).toHaveURL("http://localhost:3000/");` で URL を確認する。
- [ ] Assert: 追加確認として、ログアウト後に `/dashboard` へアクセスし直すと `/signin` に戻されることを検証する。
  - 例: `await page.goto("/dashboard");`
  - 例: `await expect(page).toHaveURL(/\/signin/);`
- [ ] テストでは表示テキスト依存の click を使わず、`data-testid` を使う。
- [ ] E2E が不安定な場合は、click と `waitForURL` を `Promise.all` でまとめる。

```ts
await page.locator('[data-testid="app-user-menu-trigger"]').click();
await Promise.all([
  page.waitForURL((url) => url.pathname === "/", { timeout: 10000 }),
  page.locator('[data-testid="app-signout-menu-item"]').click(),
]);
```

#### 10. 対象テストをまとめて実行する

- [ ] Server Action と sidebar component の対象テストをまとめて実行する。

```bash
npm test -- __tests__/app/authorized-signout-actions.test.ts __tests__/components/organisms/AppSidebar.test.tsx __tests__/components/organisms/AdminSidebar.test.tsx
```

- [ ] 期待結果を確認する。
  - すべて PASS する。
  - `getByText` / `getByRole` with name の禁止方針に反する新規テストを追加していない。
- [ ] 必要に応じて `npm run type-check` を実行し、Server Action の import / 型に問題がないことを確認する。
- [ ] 必要に応じて `npm run lint` を実行し、未使用 import や lint エラーがないことを確認する。

#### 11. E2E を実行する

- [ ] DB seed 済みで `admin@example.com` / `password` が使えることを確認する。
- [ ] Playwright の webServer 設定により `npm run dev` が起動するため、既存サーバがない場合は次を実行する。

```bash
npm run test:e2e -- e2e/auth.spec.ts
```

- [ ] 期待結果を確認する。
  - トップページアクセスの既存テストが PASS する。
  - サインインフォーム表示の既存テストが PASS する。
  - サインイン後 `/dashboard` 遷移の既存テストが PASS する。
  - 新規ログアウトテストで、サイドバーからログアウト後に `/` へ遷移する。
  - ログアウト後に `/dashboard` へ再アクセスすると `/signin` へリダイレクトされる。
- [ ] もし E2E が DB 接続や seed 不足で失敗した場合は、アプリの不具合と環境問題を分けて記録する。

#### 12. 最終確認

- [ ] 次のコマンドで差分を確認する。

```bash
git diff -- 'src/app/(site)/(authorized)/(app)/actions.ts' 'src/app/(site)/(authorized)/admin/actions.ts' src/components/organisms/AppSidebar/index.tsx __tests__/app/authorized-signout-actions.test.ts __tests__/components/organisms/AppSidebar.test.tsx e2e/auth.spec.ts
```
- [ ] 差分が、ログアウト後 `/` に遷移するための変更とテスト追加に限定されていることを確認する。
- [ ] UI/UX デザイン変更が含まれていないことを確認する。
- [ ] `.env` に変更がないことを確認する。
- [ ] `messages/ja.json` / `messages/en.json` に不要な変更がないことを確認する。
- [ ] `src/libraries/auth.ts` に不要な変更がないことを確認する。
- [ ] 実装完了報告では、次を明記する。
  - 修正概要
  - 変更ファイル
  - 実行したテストコマンド
  - E2E を実行できなかった場合は、その理由
  - 既存未コミット変更がある場合は、自分の変更との切り分け

### 想定コミットメッセージ

```text
fix: redirect to top after sign out
```

### 判断が必要になった場合の基準

- `redirect("/")` が Server Action 呼び出し経由で期待通り動かない場合のみ、Client Component 側で `await onSignOut(); router.push("/"); router.refresh();` の fallback を検討する。
- その場合も、`signOut()` が成功した後にだけ遷移するようにし、UI の見た目は変更しない。
- E2E のための `data-testid` 追加は見た目に影響しないため許容する。ただし className や DOM 構造を大きく変える必要が出た場合は、実装前に確認する。
