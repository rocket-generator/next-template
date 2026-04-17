# リファクタリング計画 009: ロギング / 監視の抽象化

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の中程度 §9  
初版: 2026-04-17  
改訂: 2026-04-18（Claude Code review 反映）

---

## 背景

現状、このテンプレートにはロギング / 監視の共通抽象層がなく、`src/libraries`・`src/repositories`・`src/app` に直接 `console.log` / `console.warn` / `console.error` が散在している。

`rg -n "console\\.(log|error|warn)" src/libraries src/repositories src/app -S` の確認では、少なくとも **48 箇所**の直接出力がある。代表例:

- `src/libraries/storage.ts:125-317, 545-583`  
  S3 upload / download / signed URL / list の失敗をその場で `console.error`
- `src/libraries/email.ts:119-221, 357-358`  
  SES 失敗、メール送信成功、deprecated env 警告を `console.*`
- `src/libraries/api_client.ts:40`  
  リクエスト URL を常時 `console.log`
- `src/repositories/workflow_repository.ts:64-178`  
  外部 API エラーや streaming parse failure を `console.error`
- `src/repositories/prisma_repository.ts:181-247`  
  不正な検索条件を `console.warn`
- `src/app/(site)/(authorized)/(app)/settings/actions.ts:56-218`  
  Server Actions の catch で `console.error`

この状態には以下の問題がある:

- ログ形式が不統一で、検索しづらい
- ログレベル制御ができず、開発時デバッグログと本番障害ログが混在する
- `api_client.ts` の URL 出力や `email.ts` の宛先出力など、PII / 機微情報の扱いが曖昧
- Sentry / OpenTelemetry / Cloudflare Logs 等の外部基盤に差し替える入口がない
- テストが `console` モック前提になっており、将来の監視導入時に置換コストが高い

一方で、`src/components` 側のブラウザログ、Storybook の action 用 `console.log`、テスト内の診断ログは性質が異なる。今回の §9 はまず **運用上重要なサーバサイド経路の抽象化**を優先し、そこから外部監視へ接続可能な形へ整理する。

---

## 到達目標

- [x] `src/libraries/logger.ts` を入口とした共通 logger facade が存在する
- [x] `debug` / `info` / `warn` / `error` のレベル制御が env ベースでできる
- [x] 文字列寄りの ad-hoc ログではなく、`scope` / `event` / `context` を持つ構造化ログに揃う
- [x] 例外送信や外部監視連携のための adapter interface が存在する（既定は noop または console）
- [x] `src/libraries` / `src/repositories` / `src/app` の直接 `console.*` が、**`src/libraries/logger.ts` の console adapter を除き**対象範囲では解消される
- [x] 既存の戻り値、throw、ユーザー向けエラーメッセージは変えずに observability のみ改善する
- [x] `.env.example` と README に logger の設定方法と拡張方針が記載される

---

## 今回やらないこと

- Sentry SDK / OpenTelemetry exporter / Axiom SDK 等の特定 SaaS 依存をテンプレート既定で追加すること
- trace / span / metrics / dashboard / alert routing までを完成させること
- `request_id` / `correlation_id` の伝搬や `AsyncLocalStorage` による request-scope 管理を導入すること
- monitoring adapter の `setUser` / `setTags` / `addBreadcrumb` を本格運用すること
- `logger.error(..., { skipCapture: true })` のような capture opt-out を入れること
- `src/components/**` のブラウザ `console.*` を全廃すること
- `*.stories.tsx` やテストコード内の `console.*` を対象に含めること
- ドキュメント reference ファイル群 (`documents/references/**`) 内のサンプルログを整理すること

---

## 実装方針

### 1. まずは薄い facade を置く

最初から `pino` / `winston` などの重量級依存を追加するのではなく、`src/libraries/logger.ts` に **provider 非依存の薄い facade** を作る。

- `createLogger(scope: string)` でスコープ付き logger を作る
- `debug` / `info` / `warn` / `error` を提供する
- `child(context)` で既定 context を積み増せる
- 既定実装は console ベースとし、将来 adapter を差し替えられるようにする
- runtime config は **module 初期化時に固定せず、log 呼び出し時に `process.env` を読む** 方針にする

`child(context)` の契約は先に固定する。

- `scope` は **親をそのまま継承し、変更しない**
- `child()` は context だけを増やす
- key 衝突時は **子 context を優先**
- scope を変えたい場合は `child()` ではなく `createLogger("new_scope")` を使う

理由:

- scope の命名揺れを防ぎ、`storage`, `email`, `workflow_repository`, `settings_actions` などの単位で grep / 集計しやすくする
- `child()` に scope 変更責務まで持たせると、置換時にスコープ設計が崩れやすい
- テンプレートに不要な依存を増やさずに段階導入できる
- 現状の `console.*` 呼び出しを低リスクで置換できる
- SaaS 固有設定をまだ決めていない派生プロジェクトでも使える

### 2. ログは構造化し、redaction を入れる

logger は単に `"xxx failed"` を流すだけでなく、最低限以下を扱えるようにする。

- `scope` 例: `storage`, `email`, `workflow_repository`, `settings_actions`
- `event` 例: `storage.upload.failed`, `auth.sign_in.failed`
- `message`
- `context`
- `error`（`name`, `message`, `stack` を安全に整形）
- `timestamp`（ISO 8601 文字列）

redaction は「浅いキー一致」ではなく、**`context` を再帰的に辿って key 名で判定する** 方式にする。対象は以下。

- `password`
- `token`
- `authorization`
- `cookie`
- `secret`
- `secretAccessKey`
- `accessKeyId`
- `apiKey`
- `clientSecret`
- `refreshToken`

逆に、`DATABASE_URL` や `process.env` 全体のような env オブジェクトは **そもそも context に入れない**。redaction で守るのではなく、入力禁止とする。

`userId` は context に含めてよいが、以下は含めない。

- `email`
- `resetUrl`
- `verificationUrl`
- `Authorization` header の生値
- query string 全文

ただし、**生の email は禁止でも、sanitized 済みの派生値は許可する**。

- 許可例:
  - `toMasked`
  - `recipientDomain`
  - `emailDomain`
- 禁止例:
  - `email`
  - `to`
  - `recipientEmail`

redaction / serialization は以下を前提に実装する。

- 循環参照対策に `WeakSet` を使う
- 再帰の depth は 5 で打ち切る
- `BigInt` は string 化する
- `Date` は ISO 8601 string にする
- 非シリアライズ値は `"[unserializable]"` にフォールバックする

理由:

- 本番ログから障害原因を追いやすくする
- template 利用者がうっかり機微情報を垂れ流す事故を減らす

### 3. 監視は logger と分離しつつ、同じ入口で扱えるようにする

本計画では「外部監視に何を使うか」は決め打ちしないが、**例外送信の抽象口**は先に用意する。

- `MonitoringAdapter` のような interface を定義する
- 必須メソッドは `captureException(error, context)`
- 任意メソッドとして `captureMessage?(message, context)` を持てるようにする
- 将来の破壊的変更を避けるため、`setUser?`, `setTags?`, `addBreadcrumb?` は optional hook として予約しておく
- 既定は noop 実装
- **`error` レベルは自動で `captureException` する**
- **`warn` レベルは自動送信しない**
- `warn` を監視へ送りたい場合だけ `capture: true` オプション、または `captureMessage()` を明示利用する
- `skipCapture` のような opt-out は **今回は入れない**。実際に監視 backend を接続して volume が見えてから follow-up で検討する

理由:

- 将来 Sentry 等を導入する際に、再度 `console.error` 置換を繰り返さなくて済む
- ログ出力と例外通知の責務を分けられる
- warning の常時送信はノイズになりやすく、運用設計が固まる前にテンプレート既定へ入れるべきではない

### 4. `APIClient` を壊さないため browser-safe にする

`src/libraries/api_client.ts` は shared utility であり、将来的に client からも使われうる。したがって `src/libraries/logger.ts` は以下を満たす必要がある。

- top-level で Node 専用 API を import しない
- browser でも評価可能である
- Edge runtime でも評価可能である
- 監視 adapter の server-only 部分は `typeof window === "undefined"` などで guard する

理由:

- server-side observability のために client bundle や edge bundle を壊すのは本末転倒

### 5. 既定フォーマットは prod=json / dev=pretty にする

構造化ログを前提にする以上、既定フォーマットは本番で JSON に倒す。

- `LOG_FORMAT` の許可値は `auto | json | pretty`
- 既定は `process.env.LOG_FORMAT ?? "auto"`
- `auto` は `NODE_ENV === "production"` のとき `json`、それ以外は `pretty`
- `.env.example` でも `LOG_FORMAT=auto` を配る

理由:

- テンプレート既定の本番ログを pretty にすると、集約・解析・検索が壊れる
- ローカル開発では pretty の方が読みやすい

### 6. storage.ts の「情報過多」を具体的に削る

親計画 §9 で名指しされている `storage.ts` の過剰ログは、残す情報と捨てる情報を先に固定する。

- 残す:
  - `scope`
  - `event`
  - `operation`
  - `provider`
  - `bucket`
  - `region`
  - `key`
  - `error.name`
  - `error.message`
- 条件付きで残す:
  - `error.stack`（`LOG_LEVEL=debug` のときのみ）
- 捨てる:
  - `endpoint`
  - `publicEndpoint`
  - `credentials`
  - `secretAccessKey`
  - raw `config`
  - response object 全文

理由:

- 障害切り分けに必要な最小限は維持しつつ、接続設定の過露出を防ぐ

### 7. 一括置換ではなく、サーバサイド高優先パスから移す

置換対象は次の順で進める。

1. `src/libraries/*` のインフラ層
2. `src/repositories/*` の外部接続 / 警告ログ
3. `src/app/**/actions.ts` の Server Actions
4. `src/app/**/page.tsx` のサーバコンポーネント catch ログ

`src/components/**` のブラウザログは今回の完了条件に含めない。

### 8. 完了判定は `rg` とテストで機械的に確認する

「logger.ts を作った」で終わらせず、以下を完了判定に使う。

- `rg -n "console\\.(log|error|warn)" src/libraries src/repositories src/app -S`
- unit test / 既存テスト更新
- `npm run type-check`
- `npm run test`
- `npm run build`

---

## 対象ファイル

### 新規作成

- `src/libraries/logger.ts`
- `__tests__/libraries/logger.test.ts`
- `__tests__/helpers/logger.ts`
- `__tests__/repositories/workflow_repository.test.ts`

### 更新

- `src/libraries/storage.ts`
- `src/libraries/email.ts`
- `src/libraries/api_client.ts`
- `src/repositories/api_repository.ts`
- `src/repositories/prisma_repository.ts`
- `src/repositories/user_repository.ts`
- `src/repositories/workflow_repository.ts`
- `src/app/(site)/(authorized)/(app)/settings/actions.ts`
- `src/app/(site)/(authorized)/admin/users/create/actions.ts`
- `src/app/(site)/(authorized)/admin/users/[id]/actions.ts`
- `src/app/(site)/(authorized)/admin/users/[id]/page.tsx`
- `src/app/(site)/(authorized)/admin/users/[id]/edit/actions.ts`
- `src/app/(site)/(authorized)/admin/users/[id]/edit/page.tsx`
- `src/app/(site)/(unauthorized)/(auth)/signin/actions.ts`
- `src/app/(site)/(unauthorized)/(auth)/signup/actions.ts`
- `src/app/(site)/(unauthorized)/(auth)/forgot-password/actions.ts`
- `src/app/(site)/(unauthorized)/(auth)/reset-password/actions.ts`
- `src/app/(site)/(unauthorized)/(auth)/verify-email/actions.ts`
- `.env.example`
- `README.md`
- `__tests__/libraries/storage.test.ts`
- `__tests__/libraries/email.test.ts`
- `__tests__/libraries/api_client.test.ts`
- `__tests__/repositories/prisma_repository.test.ts`
- `__tests__/repositories/user_repository.test.ts`
- `__tests__/repositories/user_repository.methods.test.ts`
- `__tests__/repositories/user_repository.storage-provider.test.ts`
- `__tests__/app/settings-actions.test.ts`

---

## 具体的なタスク

### 実行順（review checkpoint 単位）

以下の単位でレビューと検証を挟む。1 checkpoint ごとに `type-check` / 関連テスト / 差分確認を行い、大きな塊で一気に進めない。

1. logger facade 契約の確定
2. test harness の作成
3. `storage.ts` と `storage.test.ts`
4. `email.ts` と `email.test.ts`
5. `api_client.ts` / `api_repository.ts` / `prisma_repository.ts` と関連テスト
6. `user_repository.ts` と 3 本の `user_repository*.test.ts`
7. `workflow_repository.ts` と新規 `workflow_repository.test.ts`
8. `src/app/**` の Server Actions / page と `settings-actions.test.ts`
9. `.env.example` / `README.md` / 最終 `rg` / 全体検証

### Logger 基盤

- [x] `src/libraries/logger.ts` を新規作成
  - [x] `LogLevel` 型（`debug | info | warn | error`）を定義
  - [x] `LogFormat` 型（`auto | json | pretty`）を定義
  - [x] `LogContext` 型を定義
  - [x] `MonitoringAdapter` interface を定義
- [x] `createLogger(scope: string, defaultContext?: LogContext)` を実装
  - [x] `child(context)` で context をマージできるようにする
  - [x] `child()` は scope を変更せず、子 context 優先でマージする契約を実装する
  - [x] `Error` を `{ name, message, stack }` に整形するヘルパーを入れる
  - [x] redaction ヘルパーを入れる
  - [x] redaction / serialization は `WeakSet` と depth 上限 5 で循環参照を扱う
  - [x] `BigInt`, `Date`, 非シリアライズ値のフォールバックを固定する
  - [x] `process.env.LOG_LEVEL ?? "info"` でレベル判定する
  - [x] `process.env.LOG_FORMAT ?? "auto"` で出力形式を切り替える
  - [x] `auto` は production で json、それ以外で pretty に解決する
  - [x] env は module 初期化時ではなく、log 呼び出し時に再評価する
  - [x] browser-safe に保つ（Node 専用 API の top-level import を避ける）
  - [x] edge-safe に保つ（Edge runtime で評価不能な依存を持たない）
  - [x] 既定の noop monitoring adapter を用意する
  - [x] `error` ログは既定で `captureException` へ自動連動させる
  - [x] `warn` ログは既定では capture せず、明示 opt-in のみ許可する
  - [x] テスト用に adapter 差し替え / reset を可能にする API を用意する

- [x] 出力契約を固定する
  - [x] すべてのログに `scope`, `event`, `message`, `context`, `timestamp`, `level` が載る
  - [x] `timestamp` は ISO 8601 文字列で固定する
  - [x] `warn` / `error` は必要に応じて `error` フィールドを持てる
  - [x] `pretty` 形式でも情報欠落を起こさない
  - [x] `email`, `resetUrl`, `verificationUrl`, query string 全文は context に入れない

### テストハーネス

- [x] `__tests__/helpers/logger.ts` を新規作成
  - [x] `MemoryLogSink` を実装し、出力された log entry を配列で保持できるようにする
  - [x] `MemoryMonitoringAdapter` を実装し、captured exception / message を配列で保持できるようにする
  - [x] `installTestLoggerAdapters()` を用意する
  - [x] `resetTestLoggerState()` を用意する
  - [x] `getLoggedEntries()` / `getCapturedExceptions()` / `getCapturedMessages()` を用意する
  - [x] 各テストから `expect(getLoggedEntries()).toContainEqual(...)` で検証できる形にする
  - [x] この helper は構造化 entry 検証専用とし、pretty/json の文字列整形検証には使わない

### Infrastructure / Repository 移行

- [x] `src/libraries/storage.ts` を logger ベースへ置換
  - [x] S3 upload / download / signed URL / delete / list の失敗ログを `logger.error` へ移す
  - [x] `StorageServiceImpl` の再ラップ時ログも logger 経由にする
  - [x] `bucket`, `provider`, `key`, `operation` など最小限の context を付ける
  - [x] raw `config` オブジェクト丸ごと出力はやめる
  - [x] 既存の return / throw の挙動は変えない

- [x] `src/libraries/email.ts` を logger ベースへ置換
  - [x] SES 失敗を `logger.error`
  - [x] パスワードリセット / メール認証の送信成功を `logger.info`
  - [x] `SES_FROM_EMAIL` deprecated 警告を `logger.warn`
  - [x] 宛先メールアドレスは full value をそのまま出さず、mask または domain-only にする
  - [x] sanitized email 情報を出す場合は `toMasked` または `recipientDomain` などの明示キーを使う
  - [x] reset URL / verification URL / HTML 本文はログへ出さない

- [x] `src/libraries/api_client.ts` を logger ベースへ置換
  - [x] 常時 `console.log("URL:", url)` をやめる
  - [x] 既定では APIClient のリクエストログを出さない
  - [x] `LOG_LEVEL=debug` のときのみ `method` と `pathname` を出す
  - [x] query string 全文も `queryKeys` も出さない

- [x] `src/repositories/api_repository.ts` を整理
  - [x] `console.log(conditions)` は削除する
  - [x] raw condition value ではなく、件数・column 一覧・operator 一覧などの要約に寄せる

- [x] `src/repositories/prisma_repository.ts` を logger ベースへ置換
  - [x] invalid condition warning を `logger.warn`
  - [x] `column`, `operator`, `actualType` を出す
  - [x] raw `value` 自体は出さない

- [x] `src/repositories/user_repository.ts` を logger ベースへ置換
  - [x] avatar delete failure / signed URL failure / download failure を `warn` / `error` に整理
  - [x] `userId`, `avatarKey`, `operation` の粒度で context を付ける

- [x] `src/repositories/workflow_repository.ts` を logger ベースへ置換
  - [x] upload / run / stop / parse failure を `error` または `warn` に整理
  - [x] upstream `errorText` は 512 文字で truncate し、必要なら末尾に `...` を付ける
  - [x] **現状で throw する失敗**（upload / run / stop / cleanJsonString 失敗）は `error`
  - [x] **現状で catch して継続している失敗**（runStreaming 内の chunk parse failure）は `warn`
  - [x] 例外の swallow / continue / throw の挙動自体は変えない

### App / Server Actions 移行

- [x] `src/app/**/actions.ts` の catch ログを logger ベースへ置換
  - [x] `settings/actions.ts`
  - [x] `admin/users/create/actions.ts`
  - [x] `admin/users/[id]/actions.ts`
  - [x] `admin/users/[id]/edit/actions.ts`
  - [x] `signin/actions.ts`
  - [x] `signup/actions.ts`
  - [x] `forgot-password/actions.ts`
  - [x] `reset-password/actions.ts`
  - [x] `verify-email/actions.ts`
  - [x] user-facing return 値・エラーキーは一切変えない
  - [x] `event` 名をファイル / 操作単位で固定する

- [x] `src/app/**/page.tsx` のサーバコンポーネント catch ログを置換
  - [x] `admin/users/[id]/page.tsx`
  - [x] `admin/users/[id]/edit/page.tsx`
  - [x] `console.log(error)` を `logger.error` に置き換える
  - [x] fallback UI の挙動は維持する

### 設定 / ドキュメント

- [x] `.env.example` に logger 設定を追加
  - [x] `LOG_LEVEL=info`
  - [x] `LOG_FORMAT=auto`
  - [x] コメントで許可値を明記する

- [x] `README.md` に Logging / Monitoring セクションを追加
  - [x] テンプレート既定は console adapter であること
  - [x] `LOG_LEVEL`, `LOG_FORMAT` の説明
  - [x] 外部監視は adapter 差し替えで導入する前提であること
  - [x] 派生プロジェクトが adapter を差し替える手順を短く記載する
  - [x] `src/components/**` のブラウザログ整理は別タスクであること

### テスト

- [x] `__tests__/libraries/logger.test.ts` を新規作成
  - [x] `LOG_LEVEL=warn` で `debug` / `info` が落ちる
  - [x] `LOG_LEVEL=debug` で全レベル出力される
  - [x] redaction 対象キーが伏字化される
  - [x] `Error` が正しく直列化される
  - [x] `child(context)` が親 context とマージされる
  - [x] `child()` が scope を変えないことを確認する
  - [x] monitoring adapter が呼ばれる / noop で落ちない
  - [x] `error` は自動 capture、`warn` は既定で capture されないことを確認する
  - [x] env 差し替え後の log 呼び出しで `LOG_FORMAT=auto` が production で json / development で pretty を選ぶ
  - [x] browser-safe import ができる
  - [x] edge-safe import ができる
  - [x] pretty/json の文字列表現テストは `MemoryLogSink` ではなく formatter / console 出力側を直接検証する

- [x] `__tests__/libraries/storage.test.ts` を更新
  - [x] 失敗時に `console.error` ではなく logger が呼ばれる
  - [x] event / context が期待どおり
  - [x] 既存の upload / download / list の戻り値仕様は維持される

- [x] `__tests__/libraries/email.test.ts` を更新
  - [x] SES 失敗時に `logger.error`
  - [x] 成功時に `logger.info`
  - [x] deprecated env fallback で `logger.warn`
  - [x] 宛先メールアドレスが mask 済みである

- [x] `__tests__/libraries/api_client.test.ts` を更新
  - [x] `console.log` スパイ前提をやめる
  - [x] 既定ではログが出ないことを確認する
  - [x] debug ログが method / pathname に限定されることを確認する

- [x] `__tests__/repositories/prisma_repository.test.ts` を更新
  - [x] invalid operator / invalid value type で `logger.warn`
  - [x] raw value を出していないことを確認する

- [x] `__tests__/repositories/user_repository.methods.test.ts` を更新
  - [x] avatar delete failure で `logger.warn`
  - [x] signed URL failure / download failure で `logger.error`
  - [x] 既存の戻り値 / continue 挙動は変わらない

- [x] `__tests__/repositories/user_repository.test.ts` を必要最小限更新
  - [x] logger 導入後も constructor / model transform 系テストが壊れないことを確認する

- [x] `__tests__/repositories/user_repository.storage-provider.test.ts` を必要最小限更新
  - [x] logger 初期化追加後も `s3-compatible` 構築 smoke test が通ることを確認する

- [x] `__tests__/repositories/workflow_repository.test.ts` を新規作成
  - [x] `global.fetch` モックで upload failure / run failure / stop failure を検証する
  - [x] `ReadableStream` + `getReader().read()` モックで streaming parse failure を再現する
  - [x] `runStreaming` では parse failure 後も controller への enqueue 継続可否が現状どおりであることを確認する
  - [x] 各ケースで logger が期待どおり呼ばれる

- [x] `__tests__/app/settings-actions.test.ts` を更新
  - [x] error path で logger が呼ばれる
  - [x] 既存の戻り値は変わらない

### 検証

- [x] `npm run type-check`
- [x] `npm run test`
- [x] `npm run build`
- [x] `rg -n "console\\.(log|error|warn)" src/libraries src/repositories src/app -S`
  - [x] `src/libraries/logger.ts` の console adapter を除き、対象範囲で **0 件** であることを確認する
- [ ] ローカル `npm run dev` で代表動線を手動確認
  - [ ] サインイン失敗
  - [ ] 設定更新失敗
  - [ ] アバターアップロード失敗
  - [ ] workflow 実行失敗（可能なら）

---

## ロールアウト注意事項

- [x] 宛先メールアドレスや URL を mask / 非表示にすることで、従来ログより情報量は減る。その代わり `event` と `context` を安定化させる
- [x] client component 側の `console.*` は別タスクで扱う。今回の `rg` 完了条件に `src/components` は含めない
- [x] Sentry などの実 SDK 追加は follow-up に切り出す。今回の成果は「あくまで差し込み口を作ること」
- [x] 派生プロジェクト向けに、README へ「adapter 差し替えの最短手順」を残す

---

## 完了条件

- [x] `src/libraries/logger.ts` が存在し、logger facade / monitoring adapter / redaction / level 制御が実装されている
- [x] 対象の `src/libraries` / `src/repositories` / `src/app` から直接 `console.*` が、`src/libraries/logger.ts` の console adapter を除き解消されている
- [x] `npm run type-check`、`npm run test`、`npm run build` が pass している
- [x] logger の unit test と代表 consumer のテストが存在する
- [x] `.env.example` と README が実装と一致している
- [x] 将来の Sentry / OpenTelemetry / Cloudflare Logs 連携が adapter 追加だけでできる設計になっている
