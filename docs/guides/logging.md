# ロギング / 監視ガイド

このリポジトリのサーバサイドログは `src/libraries/logger.ts` を入口に統一する。

## 対象範囲

このガイドの対象は次のサーバサイドコード。

- `src/libraries/**`
- `src/repositories/**`
- `src/app/**`

`src/components/**` のブラウザ側 `console.*` は別タスクで扱う。Storybook とテスト内の診断ログも本ガイドの主対象ではない。

## 必須ルール

- サーバサイドコードで直接 `console.log` / `console.warn` / `console.error` を使わない
- 例外は `src/libraries/logger.ts` の console adapter だけを例外とする
- ログは `scope` / `event` / `message` / `context` を持つ構造化ログで出す
- `scope` はファイルや責務単位で固定する
- `event` は `scope.action.result` または `file.action.result` の形で安定した名前にする
- ユーザー向け戻り値や throw の挙動を変えるために logger を使わない。observability の追加に限定する

## 使い方

```ts
import { createLogger } from "@/libraries/logger";

const settingsActionsLogger = createLogger("settings_actions");

settingsActionsLogger.error(
  "settings_actions.update_profile.failed",
  "Failed to update profile",
  {
    context: {
      action: "update_profile",
    },
    error,
  }
);
```

### `createLogger(scope)`

- `scope` は `storage`, `email`, `workflow_repository`, `settings_actions` のような単位にする
- 同じファイルで複数イベントを出す場合も scope は変えない

### `child(context)`

- `child()` は scope を変えない
- context だけを積み増す
- key が衝突した場合は子の値を優先する
- scope を変えたい場合は `child()` ではなく `createLogger("new_scope")` を使う

## レベルの使い分け

- `debug`: 開発時や調査用の要約ログ。既定では出ない
- `info`: 正常系でも運用上意味があるイベント
- `warn`: recoverable で処理継続する失敗
- `error`: 処理失敗、例外、fallback 返却、throw を伴う失敗

このリポジトリでは次を基準にする。

- 失敗しても継続する parse failure や cleanup failure は `warn`
- 失敗を呼び出し元に返す、または fallback を返す catch は `error`

## `context` に入れてよいもの

障害調査に必要で、安定して集計しやすい値だけを入れる。

- `action`
- `operation`
- `userId`
- `avatarKey`
- `provider`
- `bucket`
- `region`
- `status`
- `statusText`
- `column`
- `operator`
- `actualType`
- `recipientDomain`
- `toMasked`

## `context` に入れてはいけないもの

- raw email
- `resetUrl`
- `verificationUrl`
- query string 全文
- `Authorization` header の生値
- `password`, `token`, `secret` などの機微情報
- `process.env` 全体
- AWS / SMTP / GCS の raw config
- request / response object 全文

メールアドレスが必要な場合は raw 値ではなく次のどちらかを使う。

- `toMasked`
- `recipientDomain`

## redaction / serialization

logger 側で以下を吸収するが、入力時点でも unsafe な値を入れないこと。

- `password`, `token`, `authorization`, `cookie`, `secret` などの key は再帰的に redaction される
- `BigInt` は string 化される
- `Date` は ISO 8601 文字列になる
- 循環参照は `WeakSet` で処理される
- depth は 5 まで

## 監視連携

- `error` は既定で `captureException` に自動連動する
- `warn` は既定では送信しない
- `warn` を監視に送りたい場合だけ `capture: true` を使う
- `skipCapture` のような opt-out は現時点では導入しない

## 環境変数

- `LOG_LEVEL=debug | info | warn | error`
- 既定は `info`
- `LOG_FORMAT=auto | json | pretty`
- 既定は `auto`
- `auto` は `NODE_ENV=production` のとき `json`、それ以外は `pretty`

## テスト方針

logger を使うコードのテストでは console spy を使わず、`__tests__/helpers/logger.ts` を使う。

- `installTestLoggerAdapters()` を `beforeEach` で呼ぶ
- `resetTestLoggerState()` を `afterEach` で呼ぶ
- `getLoggedEntries()` で `level`, `scope`, `event`, `context` を検証する
- `getCapturedExceptions()` / `getCapturedMessages()` で監視連携を検証する
- pretty/json の文字列表現は `MemoryLogSink` ではなく `formatLogEntry()` を直接検証する

```ts
import {
  getLoggedEntries,
  installTestLoggerAdapters,
  resetTestLoggerState,
} from "../helpers/logger";

beforeEach(() => {
  installTestLoggerAdapters();
});

afterEach(() => {
  resetTestLoggerState();
});

expect(getLoggedEntries()).toEqual([
  expect.objectContaining({
    level: "error",
    scope: "settings_actions",
    event: "settings_actions.update_profile.failed",
  }),
]);
```

## 実装時チェック

新しくログを追加する前に次を確認する。

1. `scope` は既存の命名と揃っているか
2. `event` は安定した名前になっているか
3. `context` に PII や raw URL を入れていないか
4. `warn` / `error` の境界が既存実装と矛盾していないか
5. テストは console spy ではなく logger helper で書いているか
