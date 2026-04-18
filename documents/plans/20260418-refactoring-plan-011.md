# リファクタリング計画 011: ライブラリアップデート（major update wave）

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の中程度 §11  
作成日: 2026-04-18  
改訂日: 2026-04-18（Claude Code review 反映）  
調査基準日: 2026-04-18

---

## 背景

親計画 §11 では、2026-04-17 時点で low-risk な patch/minor 更新のみを反映し、破壊的変更を伴う major 更新候補は個別評価に回している。今回の 011 は、その残課題のうち影響範囲が広いライブラリ更新を、実装可能な順序と検証手順まで分解するための計画書である。

この repo では依存更新が単なる `package.json` の bump では済まず、Next.js の複数ビルドパイプライン、Tailwind/shadcn、Storybook/Vitest、Zod/React Hook Form、Jest 型定義が相互に絡んでいる。2026-04-18 時点のローカル事実として、特に以下を前提に置く。

- `package.json` は `dev: next dev --turbopack`、`build: next build --webpack` で、開発・本番ビルドの bundler が異なる
- Tailwind は v3 構成（`tailwind.config.ts` + `postcss.config.mjs` + `src/app/globals.css`）で、`components.json` も `tailwind.config.ts` を参照している
- `tailwindcss-animate` 前提の `animate-in` / `animate-out` / `slide-in-from-*` 系 class が atoms に広く入っている
- Storybook は framework に `@storybook/nextjs-vite` を使っているが、`package.json` には `@storybook/nextjs` も同時に入っており、story import も混在している
- `jest.config.cjs` は `next/jest` を使っているため、transform は Next.js Compiler(SWC) が自動注入される。`globals["ts-jest"]` は実質 dead config で、`ts-jest` は dead dependency 候補である
- `package.json` は `jest@29.7.0` と `@types/jest@30.0.0` が共存しており、型とランタイムのメジャーがずれている
- `package.json` は `react-hook-form@^7.53.1` だが、今回上げる `@hookform/resolvers@5.2.2` の peerDependencies は `react-hook-form: ^7.55.0` を要求する
- Zod は `src/models/`, `src/requests/`, `src/repositories/`, `__tests__/` に広く浸透している。さらに `src/app/(site)/(authorized)/(app)/settings/actions.ts` では `validatedInput.error.errors` を参照しており、Zod 4 の `.issues` との差分が直撃する
- `src/requests/*.ts` と `src/requests/admin/*.ts` では `z.string().email()` を使っており、Zod 4 では deprecated API の棚卸しが必要である
- Storybook で描画しているフォーム story は Zod/RHF の影響を受けるため、Zod wave 後の Storybook 健全性確認を挟まないと原因切り分けが曖昧になる
- `better-auth@1.6.5` はすでに `zod: ^4.3.6` を直接依存に持っており、依存ツリー上では Zod 3 / Zod 4 の同居がすでに起きている

また、npm レジストリ一次情報（`npm view`）と公式 docs を 2026-04-18 に再確認した結果、初版から判断を修正すべき点がある。

- `lucide-react` の最新安定版は **1.8.0**。初版の「1.x は未確認」は誤り
- `tailwindcss` の最新安定版は **4.2.2**
- `tw-animate-css` の最新安定版は **1.4.0**
- `tailwind-merge` の最新安定版は **3.5.0**
- `@hookform/resolvers` の最新安定版は **5.2.2**
- `zod` の最新安定版は **4.3.6**
- `date-fns` の最新安定版は **4.1.0**
- `storybook` / `@storybook/nextjs-vite` / `@storybook/addon-vitest` の最新安定版は **10.3.5**
- `vitest` の最新安定版は **4.1.4**
- `typescript` の最新安定版は **6.0.3**
- `jest` の最新安定版は **30.3.0**

---

## 調査結果（2026-04-18 時点）

| 項目 | 現在 | 2026-04-18 時点の推奨着地 | 判定 | 補足 |
|------|------|---------------------------|------|------|
| `tailwindcss` | `^3.4.1` | `4.2.2` | 採用 | 公式 upgrade guide あり |
| `@tailwindcss/postcss` | 未導入 | `4.2.2` | 採用 | Tailwind 4 の PostCSS plugin |
| `tailwindcss-animate` | `^1.0.7` | 廃止 | 採用 | `tw-animate-css@1.4.0` へ置換 |
| `tw-animate-css` | 未導入 | `1.4.0` | 採用 | Tailwind 4 + shadcn v4 系の推奨ルート |
| `tailwind-merge` | `^2.5.4` | `3.5.0` | 採用 | Tailwind 4 と同 wave で上げる |
| `@hookform/resolvers` | `^3.9.1` | `5.2.2` | 採用 | Zod 4 サポートのため Zod と同時更新 |
| `react-hook-form` | `^7.53.1` | `7.72.1` | 採用 | `@hookform/resolvers@5.2.2` の peer (`^7.55.0`) を満たす |
| `zod` | `^3.23.8` | `4.3.6` | 採用 | `.errors` / string format 系の棚卸しが必要 |
| `date-fns` | `^3.6.0` | `4.1.0` | 採用 | `datetime-picker` 中心の限定影響 |
| `lucide-react` | `^0.454.0` | `1.8.0` | 採用 | import rename と test mock 更新が必要 |
| `storybook` | `^9.1.15` | `10.3.5` | 採用 | companion package を同 major に揃える |
| `@storybook/nextjs` | `^9.1.15` | 削除 | 採用 | framework は `@storybook/nextjs-vite` に統一する |
| `@storybook/nextjs-vite` | `^9.1.15` | `10.3.5` | 採用 | 現行 framework。残すのはこちら |
| `@storybook/addon-onboarding` | `^9.1.15` | `10.3.5` | 採用 | companion package を取り残さない |
| `@storybook/addon-vitest` | `^9.1.15` | `10.3.5` | 採用 | Vitest 4 とセットで移行 |
| `@chromatic-com/storybook` | `^4.1.1` | `5.1.2` | 採用 | Storybook 10 peer を満たす version へ更新 |
| `vitest` | `^3.2.4` | `4.1.4` | 採用 | browser provider の構成見直しが必要 |
| `@vitest/browser-playwright` | 未導入 | `4.1.4` | 採用 | `@storybook/addon-vitest@10.3.5` peerDependencies が要求 |
| `jest` | `^29.7.0` | `30.3.0` | 早期判断 | `@types/jest@30` との不整合を放置しない |
| `@types/jest` | `^30.0.0` | `jest` と同 major に揃える | 早期判断 | 現状は 30 / 29 のズレがある |
| `typescript` | `^5` | `6.0.3` | 採用 | `compilerOptions.types` の明示が必要 |
| `ts-jest` | `^29.4.0` | 削除候補 | 採用 | 現行 `next/jest` 構成では dead dependency |

### 今回の計画で採る明示的な判断

1. **`lucide-react@1.8.0` は 011 の対象に含める**
   - 初版の「1.x は保留」は誤りだったため修正する
   - ただし import rename と mock 更新を伴うので、`date-fns` / Radix と同じ軽量 wave にまとめる

2. **Jest 周りのメジャー整合は後回しにしない**
   - `@types/jest@30` と `jest@29` のズレは先に解消する
   - 優先ルートは `jest` / `jest-environment-jsdom` を 30.3.0 に合わせること
   - もし `next/jest` 側で blocker が見つかった場合だけ、一時的に `@types/jest` を 29 系へ下げて整合を取る

3. **`ts-jest` を migration の主役にしない**
   - 現構成は `next/jest` が SWC transformer を自動注入している
   - したがって 011 では `ts-jest` を dead dependency / dead config として削除する
   - Jest 30 の本当の確認対象は `next/jest` と Next 16.2.4 の互換性である

4. **Tailwind 4 移行では HSL トリプレット資産を保持し、OKLCH 変換はやらない**
   - 現在の tokens は `--background: 0 0% 100%` + `hsl(var(--background))` 方式
   - UI/UX 変更禁止を優先し、011 では HSL 値を維持したまま `@theme inline` へ橋渡しする
   - OKLCH への全面移行は別タスクに分離する

5. **Tailwind 4 で shadcn components を一括再生成しない**
   - bulk regeneration は class / markup 差分が大きく、UI 変更禁止と衝突する
   - 011 では既存 atoms を正として最小差分で互換化する
   - どうしても再生成が必要な component は、差分レビューで「見た目が変わらない」と確認できるものだけ個別に取り込む

6. **Storybook の Tailwind 経路は PostCSS を正とし、`@tailwindcss/vite` は 011 では採用しない**
   - Tailwind 4 公式は Vite plugin を推奨しているが、この repo の本体アプリは Next.js(PostCSS) で動く
   - Storybook だけ Vite plugin にすると CSS pipeline が二重化し、Turbopack / webpack / Storybook の差異切り分けが難しくなる
   - Storybook の `nextjs-vite` 公式 docs でも PostCSS 経由の Tailwind をサポートしているため、011 では canonical path を PostCSS に統一する

---

## 方針とその理由

### 1. 依存の性質ごとに wave を分ける

以下の順で進める。

1. Baseline / 棚卸し
2. Jest / next-jest preflight
3. Tailwind 4 / shadcn wave
4. Zod 4 / React Hook Form wave
5. Zod wave 後の Storybook 9 健全性確認
6. `date-fns` / `lucide-react` / Radix follow-up wave
7. Storybook 10 / Vitest 4 wave
8. TypeScript 6 finalization

この順序にする理由は次のとおり。

- `@types/jest` / `jest` の不整合は、その後のすべての type-check と test を曖昧にするため先に潰す
- `tailwind-merge@3` は Tailwind 4 と同 wave にまとめるべき
- Zod 4 は request/model/repository/form/test の契約更新なので、Storybook 10 のような別基盤更新と混ぜない
- Storybook 10 は story import 正規化と package 整理を伴うため、Zod 4 の影響を current Storybook 9 上で一度切り分けてから着手する
- TypeScript 6 は最後に入れて、上記差分を踏まえた `types` 解決を確定させる

### 2. 検証は「見た目が動いた」ではなくプロトコル化する

011 では検証方法を明文化し、以下を原則とする。

- アニメーション系は Storybook canvas を Playwright で開いて検証する
- app runtime の CSS 差異は `next dev --turbopack` と `next build --webpack && next start` の両方で Playwright により確認する
- `addon-a11y` は accessibility 補助であり、animation / CSS 互換検証の代替には使わない

### 3. Zod 4 の deprecated API は「棚卸し → 必要なものだけ置換」

Zod 4 では `z.email()`, `z.url()`, `z.uuid()` が推奨され、`z.string().email()` などの method form は deprecated である。ただしこの repo では `z.string().min(1, "...").email("...")` のように i18n メッセージ順序と組み合わさっている箇所がある。したがって、

- `.email()` / `.url()` / `.uuid()` の使用箇所は先に全件棚卸しする
- 一括置換はしない
- 置換しても validation 順序と message 契約が変わらない箇所だけを対象にする
- breaking point として確実に直すのは `.errors -> .issues` のような実害のある差分を優先する

---

## 実施順序

1. `npm view` / `npm outdated` と baseline コマンドで現状を固定する  
2. `jest` / `@types/jest` を整合させ、dead `ts-jest` を撤去する  
3. Tailwind 4 を PostCSS canonical path で移行する  
4. Zod 4 / resolvers 5 を入れて schema 契約を更新する  
5. 現行 Storybook 9 上でフォーム stories がまだ健全か確認する  
6. `date-fns` / `lucide-react` / Radix を追随させる  
7. Storybook 10 / Vitest 4 に上げ、Storybook package を一本化する  
8. TypeScript 6 を最後に入れて設定を締める  

---

## Checkpoint Commit 方針

- [ ] Task 1 完了後: 変更なしなら commit しない。棚卸し結果だけを計画へ反映
- [ ] Task 2 完了後: `chore: align jest runtime with next-jest`
- [ ] Task 3-5 完了後: `chore: migrate tailwind to v4`
- [ ] Task 6-8 完了後: `chore: migrate zod and form validation to v4`
- [ ] Task 9 完了後: `chore: update date-fns lucide and radix`
- [ ] Task 10 完了後: `chore: upgrade storybook and vitest`
- [ ] Task 11 完了後: `chore: upgrade typescript to v6`
- [ ] Task 12-13 完了後: `docs: record library upgrade decisions`

各 wave は **1 commit 以上** を必須とし、未整理の差分を次 wave へ持ち越さない。

---

## 具体的なタスク

### Task 1: Baseline / 棚卸し

- [ ] `npm outdated` を実行し、この計画書の version table と差分がある package を記録する
- [ ] `npm run type-check`, `npm run test`, `npm run build`, `npm run build-storybook` を現状 baseline として記録する
- [ ] `package.json`, `jest.config.cjs`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `.storybook/main.ts`, `.storybook/preview.tsx`, `vitest.config.ts`, `playwright.config.ts` を棚卸し対象として固定する
- [ ] `rg -n "forwardRef<|React\\.forwardRef" src/components/atoms src/components/molecules src/components/organisms -S` を保存する
- [ ] `rg -n "@storybook/nextjs\\b|@storybook/nextjs-vite\\b|storybook/test" src .storybook docs -S` を保存する
- [ ] `rg -n "tailwindcss-animate|tw-animate-css|animate-in|animate-out|slide-in-from|fade-in-0|zoom-in-95" src/components src/app/globals.css -S` を保存する
- [ ] `rg -n "\\.email\\(|\\.url\\(|\\.uuid\\(|\\.errors\\b|\\.issues\\b" src __tests__ docs -S` を保存する

### Task 2: Jest / next-jest preflight

- [ ] `next/jest` が SWC transformer を自動注入している事実を前提に、`ts-jest` を migration blocker から外す
- [ ] `package.json` から `ts-jest` を削除する
- [ ] `jest.config.cjs` から `globals["ts-jest"]` を削除する
- [ ] `jest`, `jest-environment-jsdom`, `@types/jest` を同じ major に揃える
- [ ] 優先ルートとして `jest@30.3.0` / `jest-environment-jsdom@30.3.0` / `@types/jest@30.x` の組み合わせを検証する
- [ ] `next/jest` と Next 16.2.4 の組み合わせで **config 生成・初期化・transformer 解決の段階**で Jest 30 が通らない場合だけ、`@types/jest` を 29 系へ戻して一時整合を取る
- [ ] 個別 test の assertion failure や matcher 差分は fallback 条件にせず、test 側の修正対象として扱う
- [ ] `npm run test` を実行し、`transform` が SWC のまま機能することを確認する

### Task 3: Tailwind 4 / shadcn wave の依存更新

- [ ] `package.json` の `tailwindcss` を `4.2.2` へ更新する
- [ ] `package.json` に `@tailwindcss/postcss@4.2.2` を追加する
- [ ] `package.json` から `tailwindcss-animate` を削除する
- [ ] `package.json` に `tw-animate-css@1.4.0` を追加する
- [ ] `package.json` の `tailwind-merge` を `3.5.0` へ更新する
- [ ] `package.json` の `@radix-ui/*` を棚卸しし、同 wave で上げるものと follow-up に回すものを分類する

### Task 4: Tailwind 4 / shadcn wave の設定移行

- [ ] `postcss.config.mjs` の plugin を `tailwindcss` から `@tailwindcss/postcss` に切り替える
- [ ] `src/app/globals.css` を `@import "tailwindcss";` ベースへ移行する
- [ ] `src/app/globals.css` に `@import "tw-animate-css";` を追加する
- [ ] `src/app/globals.css` の color tokens は **HSL トリプレットを維持したまま** `@theme inline` に橋渡しする
- [ ] `src/app/globals.css` で `hsl(var(--background))` など既存トークン解決がそのまま通るようにする
- [ ] `tailwind.config.ts` は compat shim として残すか削除するかを明示決定する
- [ ] `components.json` の `tailwind.config` / `tailwind.css` 設定を Tailwind 4 構成に合わせる
- [ ] `components.json` の style/schema は維持し、shadcn の bulk regeneration は行わない方針を明記する
- [ ] `src/libraries/css.ts` と `__tests__/libraries/css.test.ts` を更新し、`tailwind-merge@3.5.0` で v4 class が正しく merge されることを確認する

### Task 5: Tailwind 4 の検証プロトコル

- [ ] Storybook 専用 Playwright 設定 `playwright.storybook.config.ts` を追加する
- [ ] `e2e/storybook-tailwind-animations.spec.ts` を追加する
- [ ] animation 検証対象を `select`, `dropdown-menu`, `dialog`, `alert-dialog`, `tooltip`, `popover`, `sheet` に固定する
- [ ] 各 story で open/close を Playwright から操作し、対象要素の `animationName` が `none` でないことを確認する
- [ ] 各 story で `opacity` / `transform` の open/closed 差分を `getComputedStyle()` で確認する
- [ ] 各 story で Playwright の `expect(...).toHaveScreenshot()` を使い、Chromium 固定で baseline screenshot を比較する
- [ ] screenshot 比較は open/closed の安定状態で取り、`maxDiffPixelRatio: 0.01` を初期値にする
- [ ] `e2e/tailwind-runtime-parity.spec.ts` を追加し、`/signin` など public route の representative selector について `npm run dev`(Turbopack) と `npm run build && npm run start`(webpack) の両方で `toHaveCSS` を確認する
- [ ] Storybook(Vite) でも同じ representative selector を確認し、3 pipeline で CSS が乖離していないことを確認する
- [ ] 011 では `@tailwindcss/vite` を採用せず、Storybook 側も PostCSS canonical path で動かす

### Task 6: Zod 4 / React Hook Form wave の依存更新

- [ ] `package.json` の `zod` を `4.3.6` へ更新する
- [ ] `package.json` の `@hookform/resolvers` を `5.2.2` へ更新する
- [ ] `package.json` の `react-hook-form` を `7.72.1` へ更新する
- [ ] `@hookform/resolvers@5.2.2` の peerDependencies（`react-hook-form: ^7.55.0`）を満たしていることを確認する
- [ ] `.email()`, `.url()`, `.uuid()`, `.errors` の使用箇所一覧を確定する
- [ ] `src/requests/signin_request.ts`, `signup_request.ts`, `forgot_password_request.ts`, `profile_update_request.ts`, `admin/user_create_request.ts`, `admin/user_update_request.ts` の `z.string().email()` を棚卸しする
- [ ] `src/app/(site)/(authorized)/(app)/settings/actions.ts` の `validatedInput.error.errors` を `.issues` ベースへ移行する

### Task 7: Zod 4 / React Hook Form wave のコード移行

- [ ] `src/models/*.ts`, `src/requests/*.ts`, `src/repositories/*.ts` の parse / infer が Zod 4 でも崩れないことを確認する
- [ ] `src/components/organisms/AuthForgotPasswordForm/index.tsx`, `AuthSigninForm/index.tsx`, `AuthSignupForm/index.tsx`, `AuthResetPasswordForm/index.tsx`, `PasswordChangeForm/index.tsx` の `zodResolver` 型推論を確認する
- [ ] `.email()` / `.url()` / `.uuid()` は **一括置換しない**。message 契約を保ったまま移行できる箇所だけを対象にする
- [ ] `__tests__/requests/`, `__tests__/models/`, `__tests__/repositories/`, `__tests__/components/organisms/PasswordChangeForm.test.tsx` を更新する
- [ ] `npm run type-check` と `npm run test` を実行し、Zod wave を収束させる

### Task 8: Zod wave 後の Storybook 9 健全性確認

- [ ] `npm run build-storybook` を Storybook 9 のまま通す
- [ ] `AuthSigninForm`, `PasswordChangeForm`, `AuthForgotPasswordForm` など Zod/RHF 影響のある stories を current Storybook 9 で開く
- [ ] Story が壊れていた場合、原因を Zod wave の修正に限定して解消してから Storybook 10 wave に進む

### Task 9: `date-fns` / `lucide-react` / Radix follow-up wave

- [ ] `package.json` の `date-fns` を `4.1.0` へ更新する
- [ ] `src/components/atoms/datetime-picker.tsx` の `add`, `format`, `Locale`, `enUS` 利用を確認する
- [ ] `src/components/atoms/datetime-picker.tsx` 内の v3 doc URL / コメントを v4 に更新する
- [ ] `package.json` の `lucide-react` を `1.8.0` へ更新する
- [ ] `rg -n "from \\\"lucide-react\\\"" src __tests__ docs -S` で import 一覧を取り、rename breakage を確認する
- [ ] `docs/guides/component-testing.md` と lucide mock を含む test を `lucide-react@1` に合わせて更新する
- [ ] Radix は 2026-04-18 時点で `react-dialog 1.1.15`, `react-slot 1.2.4`, `react-select 2.2.6` 程度の patch/minor 差分であることを前提に、Tailwind/Zod/Storybook wave の blocker にしない
- [ ] `@radix-ui/*` を同 wave に含める場合は atoms の型差分を確認する
- [ ] `@radix-ui/*` を別 PR にする場合は理由を 011 に記録する

### Task 10: Storybook 10 / Vitest 4 wave

- [ ] `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-onboarding`, `@storybook/addon-vitest`, `eslint-plugin-storybook` を `10.3.5` へ揃える
- [ ] `@chromatic-com/storybook` を `5.1.2` へ更新する
- [ ] `package.json` から `@storybook/nextjs` を削除する
- [ ] `vitest` と `@vitest/coverage-v8` を `4.1.4` へ更新する
- [ ] `@vitest/browser` を `4.1.4` へ更新する
- [ ] `@vitest/browser-playwright@4.1.4` を追加する
- [ ] `@storybook/addon-vitest@10.3.5` の peerDependencies（`@vitest/browser`, `@vitest/browser-playwright`）を満たすことを確認する
- [ ] `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/vitest.setup.ts`, `vitest.config.ts` を Storybook 10 / Vitest 4 へ合わせる
- [ ] `vitest.config.ts` の browser provider 設定を `@vitest/browser-playwright` 前提に更新する
- [ ] story import を `@storybook/nextjs-vite` に統一する
- [ ] `docs/guides/storybook.md` の import 例とセットアップ手順を `@storybook/nextjs-vite` 前提に修正する
- [ ] Storybook 10 wave の後に再度 `npm run build-storybook` と Storybook Playwright smoke を通す

### Task 11: TypeScript 6 finalization

- [ ] `package.json` の `typescript` を `6.0.3` へ更新する
- [ ] `tsconfig.json` に `compilerOptions.types: ["node", "jest"]` を明示する
- [ ] `.storybook/`, `jest.setup.ts`, `vitest.config.ts`, `next.config.ts`, `playwright.config.ts` で ambient types の欠落が出ないか確認する
- [ ] `npm run type-check` を通し、TypeScript 6 でのみ出る差分を最後に収束させる

### Task 12: ドキュメント更新

- [ ] `AGENTS.md` の技術スタック表を実際に上げた major に合わせて更新する
- [ ] `docs/guides/storybook.md` を Storybook 10 / `@storybook/nextjs-vite` 前提に更新する
- [ ] `docs/guides/component-testing.md` の lucide mock 例を `lucide-react@1` に合わせる
- [ ] `docs/guides/typescript.md` に TypeScript 6 の `types` 設定を追記する
- [ ] `20260414-refactoring-plan.md` の §11 を、完了/保留/判断待ちに分けて更新する

### Task 13: 最終検証と判断記録

- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run build-storybook`
- [ ] `npm run test:e2e`
- [ ] Tailwind 4 の 3 pipeline parity（Turbopack / webpack / Storybook-Vite）確認結果を残す
- [ ] `lucide-react@1.8.0` の採用判断と rename 対応内容を記録する
- [ ] Jest 30 を採用したか、一時的に `@types/jest` を 29 に戻したかを記録する
- [ ] HSL を維持して `@theme inline` に移した理由を記録する
- [ ] shadcn bulk regeneration を避けた理由を記録する
- [ ] `@tailwindcss/vite` を見送った理由を記録する

---

## 補助更新候補

今回の主対象ではないが、同時に棚卸しすべき。

- [ ] `@playwright/test` と `playwright` の version 差分が Storybook / Vitest browser provider に影響しないか確認する
- [ ] `react-day-picker` の最新互換 version を確認し、`calendar.tsx` / `datetime-picker.tsx` への影響を判断する
- [ ] `clsx` は現状維持で十分かを確認する

---

## 完了条件

- [ ] 依存更新を wave ごとに分離した実装順序が確定している
- [ ] `lucide-react@1.8.0`、`jest@30.3.0`、`typescript@6.0.3` を含む version table が一次情報に基づいている
- [ ] `ts-jest` を dead dependency として扱う方針が明文化されている
- [ ] `@storybook/nextjs` 削除と `@storybook/nextjs-vite` への統一が明文化されている
- [ ] HSL 維持 / OKLCH 見送りの方針が明文化されている
- [ ] Tailwind 4 の animation 検証方法と 3 pipeline parity 検証方法が定義されている
- [ ] wave ごとの checkpoint commit 方針が定義されている

---

## 参考にした公式情報

- Tailwind CSS upgrade guide: [https://tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide)
- Tailwind CSS Vite guide: [https://tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite)
- Tailwind CSS v4 announcement: [https://tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4)
- shadcn/ui Tailwind v4 guide: [https://ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)
- Storybook migration guide: [https://storybook.js.org/docs/releases/migration-guide](https://storybook.js.org/docs/releases/migration-guide)
- Storybook Next.js Vite docs: [https://storybook.js.org/docs/get-started/frameworks/nextjs-vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
- Vitest migration guide: [https://vitest.dev/guide/migration](https://vitest.dev/guide/migration)
- Vitest 4 release post: [https://vitest.dev/blog/vitest-4](https://vitest.dev/blog/vitest-4)
- Zod release notes: [https://zod.dev/v4](https://zod.dev/v4)
- Zod changelog / migration notes: [https://zod.dev/v4/changelog](https://zod.dev/v4/changelog)
- Zod API (`z.email()`, `z.url()`, `z.uuid()`): [https://zod.dev/api](https://zod.dev/api)
- Next.js Jest guide: [https://nextjs.org/docs/app/guides/testing/jest](https://nextjs.org/docs/app/guides/testing/jest)
- TypeScript 6.0 announcement: [https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- Jest 30 announcement / migration: [https://jestjs.io/blog/2025/06/04/jest-30](https://jestjs.io/blog/2025/06/04/jest-30), [https://jestjs.io/ja/docs/upgrading-to-jest30](https://jestjs.io/ja/docs/upgrading-to-jest30)
- npm registry (`npm view`) で確認した latest versions:
  - `tailwindcss`: `4.2.2`
  - `@tailwindcss/postcss`: `4.2.2`
  - `tw-animate-css`: `1.4.0`
  - `tailwind-merge`: `3.5.0`
  - `@hookform/resolvers`: `5.2.2`
  - `react-hook-form`: `7.72.1`
  - `zod`: `4.3.6`
  - `date-fns`: `4.1.0`
  - `lucide-react`: `1.8.0`
  - `storybook`: `10.3.5`
  - `@storybook/nextjs-vite`: `10.3.5`
  - `@storybook/addon-onboarding`: `10.3.5`
  - `@storybook/addon-vitest`: `10.3.5`
  - `@chromatic-com/storybook`: `5.1.2`
  - `vitest`: `4.1.4`
  - `@vitest/browser-playwright`: `4.1.4`
  - `jest`: `30.3.0`
  - `typescript`: `6.0.3`
