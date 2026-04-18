# リファクタリング計画 011: ライブラリアップデート（major update wave）

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の中程度 §11  
作成日: 2026-04-18  
調査基準日: 2026-04-18

---

## 背景

親計画 §11 では、2026-04-17 時点で low-risk な patch/minor 更新のみを反映し、破壊的変更を伴う major 更新候補は個別評価に回している。今回の 011 は、その残課題のうち特に影響範囲が広いライブラリ更新を、実装可能な順序と粒度まで分解するための計画書である。

現状のコードベースには、単に `package.json` を上げれば終わる依存だけでなく、設定ファイル・生成系・Storybook・フォームバリデーション・shadcn 由来コンポーネントが密結合している箇所が多い。主な前提は以下。

- Tailwind は `tailwind.config.ts` + `postcss.config.mjs` + `src/app/globals.css` の v3 構成で、`components.json` も `tailwind.config.ts` を前提にしている
- `tailwindcss-animate` 前提の `animate-in` / `animate-out` 系クラスが atoms に広く入っている
- Storybook は `.storybook/main.ts` で `@storybook/nextjs-vite` を使っている一方、story ファイルは `@storybook/nextjs` と `@storybook/nextjs-vite` の import が混在している
- Vitest は Storybook addon 経由で browser mode を使っており、`vitest.config.ts` は `@vitest/browser` 前提の v3 設定になっている
- Zod は `src/models/`, `src/requests/`, `src/repositories/`, `__tests__/` に広く浸透しており、`@hookform/resolvers/zod` は 5 つのフォームで使っている
- `jest.config.cjs` は `ts-jest` 29 系を前提にしており、Jest 30 は drop-in と見なせない
- shadcn 由来 atoms には `React.forwardRef` ベースの古い実装が多数残っている

また、公式情報を 2026-04-18 時点で再確認したところ、当初想定から判断を変えるべき点がある。

- TypeScript の「次メジャー」は未リリースではなく、**2026-03-23 に TypeScript 6.0 が stable 化済み**
- Jest 30 は **2025-06-04** に stable 化済みだが、`ts-jest` の公式最新 release はまだ 29.4.5 系で、追随状況を別判断にする必要がある
- Storybook 10 はすでに stable 化済みで、移行ガイドは Storybook 10 を前提としている
- `lucide-react` は 2026-04-18 時点でも公式 1.x 系を確認できず、**「1.x に上げる」計画は保留**が妥当

---

## 調査結果（2026-04-18 時点）

| 項目 | 現在 | 2026-04-18 時点の推奨着地 | 判定 | 補足 |
|------|------|---------------------------|------|------|
| `tailwindcss` | `^3.4.1` | `4.1.x` | 採用 | 公式 upgrade guide あり。PostCSS plugin が別 package 化 |
| `tailwindcss-animate` | `^1.0.7` | 廃止し `tw-animate-css@1.3.x` へ | 採用 | shadcn が 2025-03-19 に deprecated を明示 |
| `tailwind-merge` | `^2.5.4` | `3.3.x` | 採用 | v3 は Tailwind v4 系前提。Tailwind wave と同時更新必須 |
| `@hookform/resolvers` | `^3.9.1` | `5.2.x` | 採用 | v5.1.0 以降で Zod 4 サポート |
| `zod` | `^3.23.8` | `4.1.x` | 採用 | package root はすでに Zod 4。既存 import 継続可 |
| `date-fns` | `^3.6.0` | `4.1.0` | 採用 | 破壊的変更は比較的少ないが型差分は要確認 |
| `lucide-react` | `^0.454.0` | `0.x 最新系` | 1.x は保留 | 公式 1.x release を確認できないため、今回は 0.x 更新のみ対象 |
| Storybook 本体/公式 addon 群 | `9.1.15` | `10.1.x` | 採用 | 公式 migration guide あり。ESM-only が主要変更 |
| `vitest` | `^3.2.4` | `4.1.x` | 採用 | Storybook addon / browser provider 変更あり |
| `jest` | `^29.7.0` | `30.1.x` | 条件付き | `ts-jest` 判断を先に行う必要あり |
| `typescript` | `^5` | `6.0.x` | 採用 | `types` デフォルト変更など設定影響が大きい |
| `@storybook/*` 周辺 package | 9 系混在 | 10 系に統一 | 採用 | `@chromatic-com/storybook`, `eslint-plugin-storybook` を含む |
| Vitest browser provider | `@vitest/browser` | `@vitest/browser-playwright` 等へ再設計 | 採用 | Vitest 4 で provider package 分離 |
| `@radix-ui/*` | 1.x/2.x 混在 | latest compatible へ点検更新 | 推奨 | shadcn の Tailwind v4 ガイドが latest 追随を推奨 |

### 今回の計画における明示的判断

- `lucide-react@1.x` は **今回の実行対象に含めない**  
  理由: 2026-04-18 時点で公式 repo / release から 1.x stable を確認できないため。011 では 0.x 最新系への更新と rename breakage 監査までを対象にする。

- `jest@30` は **採用候補だが即実施確定ではない**  
  理由: `ts-jest` の公式 latest が 29.4.5 系であり、既存 `jest.config.cjs` は `ts-jest` 前提。Jest 30 をやるなら transformer 戦略を再設計する必要がある。

- Tailwind 4 移行時に **UI を意図的に作り直さない**  
  理由: AGENTS.md により UI/UX デザイン変更は禁止。今回やるのは互換性維持のための設定変更・クラス置換・shadcn 追随に限定する。

---

## 方針とその理由

### 1. 一括更新ではなく、依存関係ごとに wave を分ける

以下の順で進める。

1. 事前棚卸しと安全策
2. Tailwind / shadcn wave
3. Zod / React Hook Form wave
4. `date-fns` / `lucide-react` / Radix follow-up wave
5. Storybook 10 / Vitest 4 wave
6. TypeScript 6 / Jest 30 判断 wave

この順序にする理由は次のとおり。

- `tailwind-merge@3` は Tailwind v4 前提のため、Tailwind wave より前に上げるとテスト価値が低い
- `@hookform/resolvers@5` は Zod 4 サポートが主目的なので、Zod 4 と同時に扱うほうが差分が追いやすい
- Storybook 10 と Vitest 4 は、`addon-vitest` / `@storybook/nextjs-vite` / browser provider が相互依存しているため分離しにくい
- TypeScript 6 は `tsconfig.json` の `types` 解決に影響し、Jest 30 は `ts-jest` 判断を要求するため最後に置く

### 2. Tailwind 4 は「CSS-first へ寄せる」が、shadcn CLI 互換を壊さない

Tailwind 4 では PostCSS plugin の分離、`@import "tailwindcss"` への移行、CSS-first な theme 記述が推奨される。したがって、`src/app/globals.css` を中心に移行し、`tailwind.config.ts` は必要最小限に縮退または廃止を検討する。

ただしこの repo は `components.json` と shadcn 由来 atoms を持っているため、公式 codemod で壊したあとに完全手作業で復旧する進め方は避ける。`@tailwindcss/upgrade` の出力をレビューし、`components.json` と atoms 側の実態に合わせて互換構成を確定する。

### 3. Zod 4 は package 更新ではなく「スキーマ契約の更新」として扱う

この repo では Zod が request/model/repository/test に広く入り込んでいる。したがって、Zod 4 は単発の依存更新ではなく、以下を含む契約更新として扱う。

- スキーマ API の互換確認
- `zodResolver` の型推論確認
- 既存テストの error shape / parse result / infer type 差分確認

このやり方にしないと、`type-check` は通ってもランタイムとテストのどちらかが後で崩れる。

### 4. Storybook 10 は「本体だけ」ではなく周辺 package も同じ major に揃える

この repo は Storybook 9 系本体だけでなく、以下を同時に持っている。

- `@storybook/nextjs-vite`
- `@storybook/addon-a11y`
- `@storybook/addon-docs`
- `@storybook/addon-vitest`
- `eslint-plugin-storybook`
- `@chromatic-com/storybook`

Storybook 10 は ESM-only であり、周辺 package だけ 9 系のまま残すと構成差分がわかりにくくなる。したがって Storybook wave では companion package も同時に上げる。

### 5. TypeScript 6 と Jest 30 は「導入判定」を明示して進める

TypeScript 6 は stable だが、`types` デフォルト変更により `tsconfig.json` の明示設定が実質必須になる。Jest 30 は stable だが、現構成の `ts-jest` が 29 系で止まっているため、以下のいずれかを先に決める必要がある。

- `ts-jest` 継続で Jest 29 を残す
- Jest 30 に上げる代わりに transformer を `@swc/jest` 等へ切り替える
- Jest を縮退させ、長期的には Vitest へ寄せる

この判断を曖昧にしたまま進めると、最後に test runner だけが詰まる。

---

## 実施順序

1. Baseline を取り、現状の成功条件を固定する  
2. Tailwind 4 へ移し、CSS と shadcn 互換を確立する  
3. Zod 4 / resolvers 5 を入れ、フォームとスキーマを安定化する  
4. `date-fns` / `lucide-react` / Radix 周辺を追随させる  
5. Storybook 10 / Vitest 4 を上げ、UI 開発・検証基盤を再起動する  
6. TypeScript 6 を入れ、最後に Jest 30 の是非を判断する  

---

## 具体的なタスク

### Task 1: 事前棚卸しと安全策

- [ ] `package.json`、`components.json`、`tailwind.config.ts`、`postcss.config.mjs`、`.storybook/`、`vitest.config.ts`、`jest.config.cjs` を読み、更新対象一覧を 011 に反映する
- [ ] `npm outdated` を実行し、011 の version table と差分がある依存を洗い出す
- [ ] 現行 baseline として `npm run type-check`、`npm run test`、`npm run build`、`npm run build-storybook` の成否を記録する
- [ ] Storybook addon-vitest 実行手順を現状確認し、`vitest.config.ts` の storybook project が実際に回るかを記録する
- [ ] `rg -n "forwardRef<|React\\.forwardRef"`、`rg -n "@storybook/nextjs|@storybook/nextjs-vite"`、`rg -n "tailwindcss-animate|animate-in|animate-out"`、`rg -n "from \\\"zod\\\"|from \\\"date-fns\\\"|from \\\"lucide-react\\\""` を保存し、影響範囲を固定する
- [ ] Task 1 完了時点で checkpoint commit を切れる状態に整える

### Task 2: Tailwind 4 / shadcn wave の依存更新

- [ ] `package.json` の `tailwindcss` を 4.1.x へ更新する
- [ ] `package.json` に `@tailwindcss/postcss` を追加する
- [ ] `package.json` から `tailwindcss-animate` を削除する
- [ ] `package.json` に `tw-animate-css` を追加する
- [ ] `package.json` の `tailwind-merge` を 3.3.x へ更新する
- [ ] `package.json` の `@radix-ui/*` 群を latest compatible へ棚卸しし、同 wave で上げるか follow-up に送るかを明記する

### Task 3: Tailwind 4 / shadcn wave の設定移行

- [ ] `postcss.config.mjs` の plugin を `tailwindcss` から `@tailwindcss/postcss` へ切り替える
- [ ] `src/app/globals.css` の `@tailwind base; @tailwind components; @tailwind utilities;` を `@import "tailwindcss";` へ移行する
- [ ] `src/app/globals.css` に `@import "tw-animate-css";` を追加する
- [ ] `src/app/globals.css` の `:root` / `.dark` 変数を Tailwind 4 + shadcn v4 推奨の `@theme inline` 形式へ移行する
- [ ] `src/app/globals.css` の `--background` など HSL 変数の持ち方を、`var(--token)` をそのまま参照できる形に整理する
- [ ] `tailwind.config.ts` を残すか縮退するかを決め、残す場合は「v4 で本当に必要な設定だけ」に削る
- [ ] `components.json` の `tailwind.config` 設定を見直し、shadcn CLI 互換を壊さない値に更新する
- [ ] `components.json` の schema / style 前提が v4 時代の shadcn と矛盾しないか確認する
- [ ] `src/libraries/css.ts` と `__tests__/libraries/css.test.ts` を更新し、`tailwind-merge@3` で `size-*` や v4 class が正しく merge されることを確認する

### Task 4: Tailwind 4 / shadcn wave の UI 互換確認

- [ ] `src/components/atoms/select.tsx` の `animate-in` / `animate-out` / `slide-in-from-*` 系クラスが `tw-animate-css` でそのまま動くか確認する
- [ ] `src/components/atoms/dropdown-menu.tsx` の data-state animation class を確認する
- [ ] `src/components/atoms/dialog.tsx` の overlay / content animation を確認する
- [ ] `src/components/atoms/alert-dialog.tsx` の overlay / content animation を確認する
- [ ] `src/components/atoms/tooltip.tsx` の open/close animation を確認する
- [ ] `src/components/atoms/popover.tsx` の open/close animation を確認する
- [ ] `src/components/atoms/sheet.tsx` の side animation を確認する
- [ ] `src/components/atoms/skeleton.tsx` と各 form の `animate-spin` が v4 でも崩れないことを確認する
- [ ] `src/components/atoms/sidebar.tsx`、`button.tsx`、`input.tsx` など shadcn 由来 atoms について、Tailwind 4 対応のために CLI で再生成すべきものと既存維持で十分なものを分類する
- [ ] `border` / `divide` の default color change に影響される class を検索し、色指定が必要な箇所を明示的に補う
- [ ] Task 4 完了後に `npm run build` と `npm run build-storybook` を通し、Tailwind wave 単体での regressions を止める

### Task 5: Zod 4 / React Hook Form wave の依存更新

- [ ] `package.json` の `zod` を 4.1.x へ更新する
- [ ] `package.json` の `@hookform/resolvers` を 5.2.x へ更新する
- [ ] Zod import を root package (`"zod"`) のまま継続することを明文化し、`zod/v4` など subpath への不要な置換をしない
- [ ] `src/models/`, `src/requests/`, `src/repositories/` の全 Zod schema を検索し、互換性確認対象一覧を作る

### Task 6: Zod 4 / React Hook Form wave のコード移行

- [ ] `src/models/auth.ts`, `src/models/user.ts`, `src/models/status.ts`, `src/models/chat.ts`, `src/models/workflow.ts` の parse / infer が Zod 4 でも崩れないことを確認する
- [ ] `src/requests/signin_request.ts`, `signup_request.ts`, `forgot_password_request.ts`, `reset_password_request.ts`, `password_change_request.ts`, `profile_update_request.ts`, `admin/user_create_request.ts`, `admin/user_update_request.ts` の schema を確認する
- [ ] `src/repositories/base_repository.ts`, `auth_repository.ts`, `api_repository.ts`, `airtable_repository.ts`, `local_repository.ts`, `prisma_repository.ts`, `user_repository.ts` の `schema.parse` / `schema.array().parse` 周辺を確認する
- [ ] `src/components/organisms/AuthForgotPasswordForm/index.tsx` の `zodResolver` と `useForm` 型推論を確認する
- [ ] `src/components/organisms/AuthSigninForm/index.tsx` の `zodResolver` と `useForm` 型推論を確認する
- [ ] `src/components/organisms/AuthSignupForm/index.tsx` の `zodResolver` と `useForm` 型推論を確認する
- [ ] `src/components/organisms/AuthResetPasswordForm/index.tsx` の `zodResolver` と `useForm` 型推論を確認する
- [ ] `src/components/organisms/PasswordChangeForm/index.tsx` の `zodResolver` と `useForm` 型推論を確認する
- [ ] Zod 4 で error shape / message / type narrowing が変わった箇所があれば、アプリコードではなく schema 定義側で吸収できるか先に検討する
- [ ] `__tests__/requests/`, `__tests__/models/`, `__tests__/repositories/`, `__tests__/components/organisms/PasswordChangeForm.test.tsx` を更新し、Zod 4 差分に合わせる
- [ ] Task 6 完了後に `npm run type-check` と `npm run test -- requests` もしくは対象 test 群を通し、Zod wave の収束を確認する

### Task 7: `date-fns` / `lucide-react` / Radix follow-up wave

- [ ] `package.json` の `date-fns` を 4.1.0 へ更新する
- [ ] `src/components/atoms/datetime-picker.tsx` の `add`, `format`, `Locale`, `enUS` 利用が v4 でも問題ないか確認する
- [ ] `src/components/atoms/datetime-picker.tsx` 内の date-fns 参照コメントや doc URL が v3 のままなら v4 に更新する
- [ ] `package.json` の `lucide-react` を「1.x」ではなく「2026-04-18 時点の 0.x 最新系」へ更新する
- [ ] `rg -n "from \\\"lucide-react\\\""` で import 一覧を取り、rename breakage が起きる icon が含まれていないかを確認する
- [ ] `docs/guides/component-testing.md` と lucide mock を含む test を更新し、icon export 名変更に追随する
- [ ] `@radix-ui/*` を同 wave で上げる場合は、atoms の型差分を個別に確認する
- [ ] `@radix-ui/*` を別 PR に分ける場合は、その理由を 011 と親計画 §11 に明記する

### Task 8: Storybook 10 / Vitest 4 wave の依存更新

- [ ] `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-vitest`, `eslint-plugin-storybook`, `@chromatic-com/storybook` を 10 系へ揃える
- [ ] `vitest`, `@vitest/coverage-v8` を 4.1.x へ更新する
- [ ] `@vitest/browser` を継続利用するのではなく、Vitest 4 の provider package 構成に合わせて依存を見直す
- [ ] Playwright provider を継続するなら `@vitest/browser-playwright` を採用する

### Task 9: Storybook 10 / Vitest 4 wave の設定移行

- [ ] `npx storybook@latest upgrade` を実行し、automigration の提案内容をレビューする
- [ ] `.storybook/main.ts` が Storybook 10 の ESM-only 要件を満たしているか確認する
- [ ] `.storybook/main.ts` の `addons` / `framework` / `viteFinal` が Storybook 10 で非推奨になっていないか確認する
- [ ] `.storybook/preview.tsx` の `Preview` import source と decorator 設定を Storybook 10 流儀へ揃える
- [ ] `.storybook/vitest.setup.ts` の `setProjectAnnotations` 呼び出しが Storybook 10 + Vitest 4 で有効か確認する
- [ ] `vitest.config.ts` の browser provider 設定を Vitest 4 形式へ更新する
- [ ] `vitest.config.ts` の coverage 設定を明示し、Vitest 4 の default 変更に振り回されない形にする
- [ ] `vitest.config.ts` の exclude / dir 設定を見直し、Vitest 4 の default change による意図しない対象拡大を防ぐ
- [ ] `src/stories/*.stories.ts` と `src/components/**/*.stories.tsx` の `Meta` / `StoryObj` import を統一する
- [ ] `docs/guides/storybook.md` を Storybook 10 + `@storybook/nextjs-vite` 前提に更新する

### Task 10: TypeScript 6 / Jest 30 判断 wave

- [ ] `package.json` の `typescript` を 6.0.x へ更新する
- [ ] `tsconfig.json` に `compilerOptions.types` を明示し、少なくとも `node` と `jest` を解決できる状態にする
- [ ] TypeScript 6 導入後に `.storybook/`, `jest.setup.ts`, `vitest.config.ts`, `next.config.ts`, `scripts/` 周辺で ambient types の欠落が出ないか確認する
- [ ] `jest`, `jest-environment-jsdom`, `@types/jest` を 30 系へ上げるか、011 の中で明示判断する
- [ ] `ts-jest` の公式対応状況を確認し、Jest 30 の blocker かどうかを記録する
- [ ] `ts-jest` 継続が難しい場合、`@swc/jest` への切替案と工数を比較する
- [ ] `jest.config.cjs` の ESM / transform / `extensionsToTreatAsEsm` / CLI flag 互換を確認する
- [ ] `jest.mock()` の case-sensitive path requirement に抵触する test がないか確認する
- [ ] Jest 30 を見送る場合、その理由を 011 と親計画 §11 に明記し、Jest 29 維持 + Vitest 一本化検討へ接続する

### Task 11: ドキュメント更新

- [ ] `AGENTS.md` の技術スタック表を、実際に上げた major に合わせて更新する
- [ ] `docs/guides/storybook.md` の import 例、コマンド、前提 version を更新する
- [ ] `docs/guides/component-testing.md` の lucide mock 例と Storybook 連携記述を更新する
- [ ] `docs/guides/typescript.md` が存在する前提で、TypeScript 6 で必須になった `types` 設定や注意点を追記する
- [ ] `components.json` や shadcn 更新ルールに変更が出るなら、その手順を `docs/guides/components.md` か `docs/guides/storybook.md` に追記する
- [ ] `20260414-refactoring-plan.md` の §11 を、完了/保留/判断待ちに分けて更新する

### Task 12: 検証

- [ ] Tailwind wave 完了時に `npm run build` を通す
- [ ] Zod wave 完了時に `npm run type-check` と `npm run test` を通す
- [ ] Storybook wave 完了時に `npm run build-storybook` を通す
- [ ] Vitest wave 完了時に Storybook project を含む Vitest 実行を通す
- [ ] TypeScript 6 導入後に `npm run type-check` を再度通す
- [ ] 最終統合時に `npm run test`、`npm run build`、`npm run build-storybook` を通す
- [ ] UI 影響があるため、最終段階で `npm run test:e2e` を通す
- [ ] 主要画面について未認証/認証/管理画面/フォーム送信/Storybook 表示の手動確認を行う

### Task 13: 完了時に残す判断記録

- [ ] `lucide-react@1.x` を今回見送った理由を明記する
- [ ] Jest 30 を採用したか見送ったか、その理由を明記する
- [ ] `tailwind.config.ts` を残したか削除したか、その理由を明記する
- [ ] shadcn components を再生成した範囲と、手作業維持にした範囲を明記する
- [ ] `@radix-ui/*` を同一 wave に含めたか別タスク化したか、その理由を明記する

---

## 補助更新候補

今回の主対象ではないが、以下は同時に棚卸しすべき。

- [ ] `@chromatic-com/storybook` の Storybook 10 互換 version を確認する
- [ ] `eslint-plugin-storybook` の Storybook 10 互換 version を確認する
- [ ] `@playwright/test` と `playwright` の version 差分が Storybook / Vitest browser provider に影響しないか確認する
- [ ] `react-day-picker` の最新互換 version を確認し、`calendar.tsx` / `datetime-picker.tsx` への影響を判断する
- [ ] `clsx` は現状維持で十分か、shadcn guide に合わせて更新する価値があるかを確認する

---

## 完了条件

- [ ] 依存更新を wave ごとに分離した実装順序が確定している
- [ ] 採用・保留・見送りの判断が package ごとに明文化されている
- [ ] `lucide-react@1.x` と `jest@30` の扱いが曖昧でない
- [ ] 実装担当者が「どのファイルを、どの順で、何を確認しながら更新するか」を読み取れる
- [ ] 最終検証コマンドが定義されている

---

## 参考にした公式情報

- Tailwind CSS upgrade guide: [https://tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide)
- shadcn/ui Tailwind v4 guide: [https://ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)
- Storybook 10 migration guide: [https://storybook.js.org/docs/releases/migration-guide](https://storybook.js.org/docs/releases/migration-guide)
- Vitest migration guide: [https://vitest.dev/guide/migration](https://vitest.dev/guide/migration)
- Vitest 4 release post: [https://vitest.dev/blog/vitest-4](https://vitest.dev/blog/vitest-4)
- Zod 4 release notes: [https://zod.dev/v4](https://zod.dev/v4)
- Zod 4 versioning note: [https://zod.dev/v4/versioning](https://zod.dev/v4/versioning)
- React Hook Form Resolvers releases: [https://github.com/react-hook-form/resolvers/releases](https://github.com/react-hook-form/resolvers/releases)
- date-fns releases: [https://github.com/date-fns/date-fns/releases](https://github.com/date-fns/date-fns/releases)
- TypeScript 6.0 announcement: [https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- Jest 30 announcement / migration: [https://jestjs.io/blog/2025/06/04/jest-30](https://jestjs.io/blog/2025/06/04/jest-30), [https://jestjs.io/ja/docs/upgrading-to-jest30](https://jestjs.io/ja/docs/upgrading-to-jest30)
- `tailwind-merge` official docs / releases: [https://github.com/dcastil/tailwind-merge](https://github.com/dcastil/tailwind-merge), [https://github.com/dcastil/tailwind-merge/releases](https://github.com/dcastil/tailwind-merge/releases)
- `lucide-react` official repo / releases: [https://github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide), [https://github.com/lucide-icons/lucide/releases](https://github.com/lucide-icons/lucide/releases)
