# メニューからログアウトしても、画面遷移しない

ログイン後、左下（サイドバー下部）のメニューから「ログアウト」を選択しても、画面遷移が行われない。

その後リロードすると、ログイン画面に遷移するので、ログアウト自体はできているようだが、その際に画面遷移をして、 トップ画面 ( / ) に行くようにしてほしい

---

## AI追記: レビュー反映版の実装計画（2026-04-20）

> このレビュー反映版を正として実装する。

### 背景

- 対象の不具合は、ログイン後に左下のサイドバー下部ユーザーメニューから「ログアウト」を選択しても、その場で画面遷移しないこと。
- 現在の `src/app/(site)/(authorized)/(app)/actions.ts` と `src/app/(site)/(authorized)/admin/actions.ts` の `signOutAction()` は、どちらも `await signOut();` のみで、ログアウト成功後の遷移を明示していない。
- `src/libraries/auth.ts` の `signOut()` は Better Auth の sign-out API を呼ぶ薄い wrapper であり、画面遷移は担当しない。
- `/` の実体は `src/app/(site)/(unauthorized)/page.tsx` にあり、`src/proxy.ts` の `PUBLIC_PATHS` にも `/` が含まれているため、ログアウト後の着地点として妥当である。
- i18n は `src/i18n/routing.ts` で `locales: ["ja", "en"]` を定義しているが、現状は `[locale]` ルートセグメントや `next-intl` middleware による URL locale prefix 運用ではない。したがって現在の URL としては `/` への redirect を期待してよい。
- Better Auth の `session.cookieCache` は有効だが、sign-out 実装は session token cookie と session data cookie を期限切れにする。とはいえ、回帰防止として E2E で「ログアウト後に保護ページへ戻れない」ことを確認する。

### 方針とその理由

- `signOutAction()` の責務として、`await signOut();` の直後に `redirect("/")` を実行する。
- 通常アプリ側と管理画面側の 2 つの `signOutAction()` を同じ仕様にそろえる。
- `src/libraries/auth.ts` の `signOut()` helper には redirect を入れない。認証 API wrapper に画面遷移先を埋め込むと再利用性が落ちるため。
- `AppSidebar` / `AdminSidebar` の見た目、レイアウト、表示文言、メニュー構成は変更しない。
- E2E に必要な `data-testid` は `AppSidebar` のユーザーメニュー trigger とログアウト項目の最小 2 個に限定する。既存テストの全面的な `getByText` / `getByRole` 置換は別作業に分離する。
- `signOut()` が失敗した場合は `redirect("/")` しない。エラー通知 UI の追加は今回の要件外とし、必要なら別タスクで扱う。

#### 今回やらないこと

- `src/libraries/auth.ts` の `signOut()` helper に redirect を埋め込まない。アプリ固有の遷移先を横断 helper に持たせると、別用途で sign-out API だけ使いたい場合の再利用性が落ちるため。
- Better Auth の `cookieCache` 設定は変更しない。今回の E2E でログアウト後に `/dashboard` へ戻れないことを確認し、stale session が実害化していないことを検知対象にする。
- `AppSidebar` の testid を総ざらいしない。今回必要なのはログアウト導線を安定して click するための trigger と menu item の 2 箇所だけであるため。
- 既存 component test 全体の query 方針を一括変更しない。テスト規約への追従は重要だが、今回のログアウト不具合修正とは独立したリファクタリングになるため。
- admin 側ログアウト E2E は今回追加しない。通常側と管理側は同じ `signOutAction()` 実装を unit test で検証し、管理画面レイアウトの型整合性は `npm run type-check` で確認する。

実装イメージ:

```ts
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut();
  redirect("/");
}
```

### 具体的なタスク

#### 1. 前提確認

- [x] `git status --short` を実行し、既存の未コミット変更を確認する。既存変更は勝手に戻さない。
- [x] `src/app/(site)/(unauthorized)/page.tsx` が `/` のトップページであることを確認する。
- [x] `src/proxy.ts` の `PUBLIC_PATHS` に `/` が含まれていることを確認する。
- [x] `src/i18n/routing.ts` と `src/proxy.ts` を確認し、現状は locale prefix 付き URL へ自動リダイレクトする middleware 構成ではないことを確認する。
- [x] `src/libraries/auth.ts` の `cookieCache` 設定と `signOut()` helper を確認し、今回の主修正が Server Action 側の redirect 追加で足りるかを判断する。

#### 2. Server Action のテストを追加する

- [x] `__tests__/app/authorized-signout-actions.test.ts` を新規作成する。
- [x] `@/libraries/auth` の `signOut` を mock する。
- [x] `next/navigation` の `redirect` を mock し、呼ばれたら `NEXT_REDIRECT` 相当の Error を throw する。
- [x] 通常アプリ側 action を `appSignOutAction` として alias import する。
- [x] 管理画面側 action を `adminSignOutAction` として alias import する。
- [x] `appSignOutAction()` が `signOut()` 成功後に `redirect("/")` することを検証する。
- [x] `adminSignOutAction()` が `signOut()` 成功後に `redirect("/")` することを検証する。
- [x] `signOut()` が reject した場合は `redirect("/")` が呼ばれないことを 1 ケースだけ検証する。
- [x] `npm test -- __tests__/app/authorized-signout-actions.test.ts` を実行し、実装前に期待通り失敗することを確認する。

#### 3. `signOutAction()` を修正する

- [x] `src/app/(site)/(authorized)/(app)/actions.ts` に `import { redirect } from "next/navigation";` を追加する。
- [x] `src/app/(site)/(authorized)/(app)/actions.ts` の `signOutAction()` を `await signOut(); redirect("/");` に変更する。
- [x] `src/app/(site)/(authorized)/admin/actions.ts` に `import { redirect } from "next/navigation";` を追加する。
- [x] `src/app/(site)/(authorized)/admin/actions.ts` の `signOutAction()` を `await signOut(); redirect("/");` に変更する。
- [x] `redirect("/")` は `try/catch` で囲まない。Next.js の redirect は制御用例外を throw するため。
- [x] `signOut()` 自体も今回の修正では `try/catch` で握りつぶさない。失敗時にトップへ遷移すると、ログアウトできていない状態を隠すため。
- [x] 同じファイル内の `setLanguageAction()` には触れない。

#### 4. E2E 用の最小 testid を追加する

- [x] `src/components/organisms/AppSidebar/index.tsx` のユーザーメニュー trigger に `data-testid="app-user-menu-trigger"` を追加する。
- [x] `src/components/organisms/AppSidebar/index.tsx` のログアウト `DropdownMenuItem` に `data-testid="app-signout-menu-item"` を追加する。
- [x] 追加は testid のみに限定し、className、DOM 構造、文言、アイコン、表示順は変更しない。
- [x] `__tests__/components/organisms/AppSidebar.test.tsx` の既存ログアウト handler テストだけ、この 2 つの testid を使う形に更新する。既存テスト全体の query 方針変更は行わない。

#### 5. E2E を追加する

- [x] `e2e/auth.spec.ts` に「サイドバーからログアウトするとトップページに遷移する」テストを 1 ケース追加する。
- [x] `/signin` へアクセスし、`admin@example.com` / `password` でログインする。
- [x] `/dashboard` へ遷移したことを確認する。
- [x] `page.locator('[data-testid="app-user-menu-trigger"]').click()` でメニューを開く。
- [x] ログアウト click と URL 待機は最初から `Promise.all` で書く。

```ts
await Promise.all([
  page.waitForURL((url) => url.pathname === "/", { timeout: 10000 }),
  page.locator('[data-testid="app-signout-menu-item"]').click(),
]);
```

- [x] ログアウト後の URL が `/` であることを確認する。
- [x] 追加で `/dashboard` に再アクセスし、`/signin` にリダイレクトされることを確認する。これにより cookieCache / session cookie の stale な残存を E2E で検知する。

#### 6. 検証する

- [x] `npm test -- __tests__/app/authorized-signout-actions.test.ts` を実行する。
- [x] `npm test -- __tests__/components/organisms/AppSidebar.test.tsx` を実行する。
- [x] `npm run type-check` を実行する。
- [x] `npm run lint` を実行する。
- [x] DB seed 済みで `admin@example.com` / `password` が使える環境で `npm run test:e2e -- e2e/auth.spec.ts` を実行する。
- [x] E2E でログアウト後に `/dashboard` へ戻れてしまう場合のみ、cookieCache の stale 判定として追加調査する。その場合は `disableCookieCache: true` の導入可否や Better Auth の sign-out response cookie を確認し、別途判断する。
- [x] `npm test` を実行し、全 Jest テストが通ることを確認する。
- [x] `npm run build` を実行し、本番ビルドが通ることを確認する。

#### 7. 最終確認

- [x] 次のコマンドで差分を確認する。

```bash
git diff -- 'src/app/(site)/(authorized)/(app)/actions.ts' 'src/app/(site)/(authorized)/admin/actions.ts' src/components/organisms/AppSidebar/index.tsx __tests__/app/authorized-signout-actions.test.ts __tests__/components/organisms/AppSidebar.test.tsx e2e/auth.spec.ts
```

- [x] 差分がログアウト後 `/` へ遷移するための変更、最小 testid 追加、対応テスト追加に限定されていることを確認する。
- [x] UI/UX デザイン変更が含まれていないことを確認する。
- [x] `.env`、`messages/ja.json`、`messages/en.json`、`src/libraries/auth.ts` に不要な変更がないことを確認する。
- [x] 実装完了報告では、`signOut()` 失敗時はユーザーが保護ページに留まり、現時点ではエラー通知を表示しない挙動であることを明記する。

#### 8. 再レビュー指摘への対応

- [x] `next/navigation` の `redirect` mock は、単なる message 文字列だけでなく `digest` が `NEXT_REDIRECT` から始まる Next.js 風の制御用 Error を throw する形に修正する。
- [x] admin 側ログアウト E2E 追加は任意の拡張として扱い、現時点では追加しない。管理画面側は同じ `signOutAction()` の unit test と `npm run type-check` で担保する。
- [x] E2E のトップ URL assertion は既存ファイルの `http://localhost:3000/` スタイルに合わせて維持する。baseURL 非依存化は必要なら別途まとめて行う。
- [x] レビュー対応後に `npm test -- __tests__/app/authorized-signout-actions.test.ts`、`npm test -- __tests__/components/organisms/AppSidebar.test.tsx`、`npm run type-check`、`npm run lint`、`npm test`、`npm run build` を再実行する。
- [x] レビュー対応後の E2E 再実行では、`localhost:3000` がこのリポジトリではない Docker アプリに割り当たっていたため、その実行結果は今回の検証結果として扱わない。未検証の E2E 変更は残さない。

### 想定コミットメッセージ

```text
fix: redirect to top after sign out
```
