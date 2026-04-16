# リファクタリング計画 001: Prisma SSL 実装の安全化

親計画: [20260414-refactoring-plan.md](./20260414-refactoring-plan.md) の重大 §1
作成日: 2026-04-16

---

## 背景

`src/libraries/prisma.ts:19-30` で `DATABASE_URL` から `sslmode` パラメータを無条件に削除し、元の URL に `sslmode` が付いていた場合は `{ ssl: { rejectUnauthorized: false } }` を強制的に設定している。

```ts
url.searchParams.delete("sslmode");
const cleanedUrl = url.toString();

const adapter = new PrismaPg(
  sslMode
    ? { connectionString: cleanedUrl, ssl: { rejectUnauthorized: false } }
    : { connectionString: cleanedUrl }
);
```

この実装には以下の問題がある:

- RDS / Neon / Supabase 等の本番 Postgres に対して **TLS 証明書検証を無効化**してしまう。中間者攻撃 (MITM) に対して脆弱。
- 検証オフを env で opt-out する手段がない。
- CA 証明書を差し込む余地もない。
- `__tests__/libraries/prisma.test.ts` に SSL に関するテストケースがない（動作保証なし）。

テンプレートとして派生する全プロジェクトにこの既定値が継承されるため、最優先で修正する。

---

## 方針とその理由

1. **既定を「CA 検証 ON」に戻す**
   - デフォルトで `ssl: { rejectUnauthorized: true }`
   - 理由: 本番接続を安全側に倒し、気付かず検証オフのまま本番投入するリスクを消す。

2. **opt-out は env で明示**
   - `DATABASE_SSL_REJECT_UNAUTHORIZED=false` が与えられた時のみ `rejectUnauthorized: false`
   - 理由: どうしても自己署名証明書等で回避したいケースに備える。env 指定を強制することで「何をしているか」を明示。

3. **CA 証明書パスを受け取れる**
   - `DATABASE_SSL_CA_PATH` が指定された場合、ファイルを読んで `ssl.ca` に渡す
   - 理由: RDS の verify-full 要件や自社 CA の取り込みに対応。

4. **`sslmode=disable` のみ SSL 完全オフ**
   - URL に `sslmode=disable` が付いていれば `ssl: false`（平文）
   - それ以外の `sslmode` 値は URL から削除し、`ssl` オプション側で制御（既存の剥がし方針は維持）
   - 理由: pg ドライバが URL の `sslmode=verify-full` を受けて RDS で落ちる既存挙動を避けつつ、`require` 等は尊重。

---

## 具体的なタスク

### 実装

- [x] `src/libraries/prisma.ts` の `createPrismaClient` をリファクタ
  - [x] `node:fs` を import
  - [x] `URL` インスタンスから `sslmode` を読み取る（既存どおり）
  - [x] 新規ヘルパー `resolveSslOption(sslMode: string | null): false | { rejectUnauthorized: boolean; ca?: string } | undefined` を作成
    - [x] `sslMode === "disable"` なら `false`
    - [x] `sslMode === null`（未指定）なら `undefined`（ローカル開発互換のため pg デフォルトに委ねる）
    - [x] それ以外は以下を組み立てる
      - [x] 既定 `rejectUnauthorized: true`
      - [x] `process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"` なら `rejectUnauthorized: false`
      - [x] `process.env.DATABASE_SSL_CA_PATH` があれば `fs.readFileSync(path, "utf8")` の結果を `ca` に設定
  - [x] URL から `sslmode` を削除したうえで PrismaPg に渡す（既存どおり）
  - [x] `new PrismaPg({ connectionString: cleanedUrl, ssl })` で構築（ssl が undefined なら ssl キー自体を省略）
- [x] 既存の日本語コメントを最小化（「なぜ `sslmode` を URL から剥がすか」のみ残す）

> 方針からの差分メモ: 計画原案では「sslmode 未指定でも ssl オブジェクトを組み立てる」と読める表現だったが、ローカル開発（docker-compose の Postgres は TLS 無し）との後方互換を優先し、未指定時は pg デフォルトに委ねる実装とした。結果としてテスト `sslmode が無ければ ssl オプションを渡さない（ローカル開発互換）` を追加済。

> 追加変更（2026-04-16）: `DATABASE_SSL_CA_PATH` に加えて、環境変数 `DATABASE_SSL_CA` に PEM 本文を直接渡せるよう拡張した。CA パスより優先される。`\n` エスケープと実改行の両方に対応。テストを 3 ケース追加済（合計 13/13 green）。本変数は Vercel / Cloudflare / env-only 環境向けの代替手段として残し、Amplify の正式経路は `DATABASE_SSL_CA_PATH` とする。

### ドキュメント・設定

- [x] `.env.example` に追記
  - [x] `# DB TLS settings`
  - [x] `DATABASE_SSL_REJECT_UNAUTHORIZED=true` （default。`false` で検証オフ）
  - [x] `DATABASE_SSL_CA_PATH=` （CA 証明書ファイルパス。省略可）
- [x] `docs/guides/auth.md` に本番接続例を追記
  - [x] Neon / Supabase: `DATABASE_URL=postgres://user:pass@host/db?sslmode=require`
  - [x] RDS（CA バンドル使用例）: `DATABASE_SSL_CA_PATH=./rds-ca.pem`
  - [x] ローカル開発: `sslmode` 未指定

### テスト

- [x] `__tests__/libraries/prisma.test.ts` に以下ケースを追加
  - [x] 既定で `ssl: { rejectUnauthorized: true }` が PrismaPg に渡る
  - [x] `DATABASE_SSL_REJECT_UNAUTHORIZED=false` で `ssl: { rejectUnauthorized: false }`
  - [x] `sslmode=disable` で `ssl: false`
  - [x] `DATABASE_SSL_CA_PATH` 指定で `ssl.ca` に文字列がセットされる（`fs.readFileSync` は `jest.mock` で "CA_CONTENT" を返す）
  - [x] `sslmode` パラメータが PrismaPg へ渡す connectionString から剥がれていることを assert
  - [x] `sslmode` 未指定時に ssl オプションが渡らない（ローカル開発互換）
- [x] `npm run test -- prisma` が pass（10/10 green）

### 検証

- [x] `npm run type-check` pass
- [x] `npm run test` 全 pass（739/739 green）
- [x] `npm run build` pass
- [ ] Docker Compose のローカル Postgres で `sslmode` 未指定の接続確認（`npm run dev` でログインフロー） — 手動確認待ち
- [ ] （任意）Neon 無料枠で `sslmode=require` の実接続確認 — 手動確認待ち

### ロールアウト注意事項

- [x] 既存プロジェクトへの影響を `docs/guides/auth.md` に明記
  - 既定が「検証 ON」に変わるため、既存環境で `sslmode=require` 付き DATABASE_URL を使っていた場合、証明書が有効でない接続先は接続失敗する可能性がある
  - その場合 `DATABASE_SSL_REJECT_UNAUTHORIZED=false` で一時回避可能

---

## 完了条件

- [x] 上記主要タスクにチェックが入っている（手動接続確認 2 項目を除き完了）
- [x] `npm run type-check`、`npm run test`、`npm run build` がすべて pass
- [x] ドキュメント（`.env.example` / `docs/guides/auth.md`）が現実装と一致している

---

## レビュー反映による追補（2026-04-17）

コードレビューと Amplify 実運用確認を踏まえ、以下を追補方針とする。

### 決定事項

1. **Amplify の正式サポート経路は `DATABASE_SSL_CA_PATH`**
   - Amplify では `certs/rds-ca-bundle.pem` を bundle に含め、`DATABASE_SSL_CA_PATH` で参照する方式を正式サポートとする。
   - 理由: 現在の `amplify.yml` + `next.config.ts` の実配線と一致し、multi-line env を `.env` に流し込む必要がないため運用が安定する。

2. **`DATABASE_SSL_CA` は削除しない**
   - `DATABASE_SSL_CA` はファイル配置が難しい環境向けの override / escape hatch として残す。
   - 優先順位は現状どおり `DATABASE_SSL_CA` > `DATABASE_SSL_CA_PATH`。
   - 想定環境: Vercel / Cloudflare / env-only 運用など。

3. **`sslmode` の正式サポート値を明確化する**
   - 本テンプレートで正式にサポートする値は `未指定` / `disable` / `require` のみとする。
   - `prefer` や typo を黙って `require` 相当に丸める実装は避け、明示的なエラーで落とす。
   - 理由: pg の `prefer` を忠実再現しない以上、曖昧な値を受け入れるほうが危険。

### 追加修正タスク

#### コード

- [x] `src/libraries/prisma.ts`
  - [x] `sslmode` の値を明示的に検証するヘルパーを追加する
  - [x] 許可値 `null` / `disable` / `require` のみ受け入れる
  - [x] `prefer` および未知の値は `Unsupported sslmode` 系の明示的エラーを投げる
  - [x] `resolveSslCa` 周辺コメントを「`DATABASE_SSL_CA_PATH` が標準、`DATABASE_SSL_CA` は override」に修正する
- [x] `amplify.yml`
  - [x] Amplify では `DATABASE_SSL_CA_PATH` が標準経路であることが分かるコメントを追加する
  - [x] `DATABASE_SSL_CA` を Amplify の標準配線にしない理由（multi-line PEM を `.env` に安全に書き出しにくい）をドキュメントへ委譲する
- [x] `next.config.ts`
  - [x] `outputFileTracingIncludes` で `certs/**/*` を含めている理由をコメントで明示する

#### ドキュメント・設定

- [x] `.env.example`
  - [x] `DATABASE_SSL_CA_PATH` のコメントを「標準経路（Docker / VM / ECS / Kubernetes / Amplify 向け）」に修正
  - [x] `DATABASE_SSL_CA` のコメントを「override（ファイル配置が難しい環境向け）」に修正
- [x] `docs/guides/auth.md`
  - [x] DB TLS セクションに「環境別の推奨設定」を追記する
  - [x] Amplify の正式経路を `DATABASE_SSL_CA_PATH=./certs/rds-ca-bundle.pem` として明記する
  - [x] Vercel / Cloudflare / env-only 環境では `DATABASE_SSL_CA` を使う方針を追記する
  - [x] `DATABASE_SSL_CA` が `DATABASE_SSL_CA_PATH` より優先されることを明記する
  - [x] `sslmode` の正式サポート値が `未指定` / `disable` / `require` のみであることを明記する
  - [x] `prefer` と未知の値はサポート外であることを明記する
- [x] 本計画内の 2026-04-16 追記メモの文言を、`DATABASE_SSL_CA` を Amplify 向け「推奨」ではなく「代替手段」と読める表現に読み替える

#### テスト

- [x] `__tests__/libraries/prisma.test.ts`
  - [x] `sslmode=require` が従来どおり通ることを維持確認する
  - [x] `sslmode=prefer` で明示的エラーになるテストを追加する
  - [x] `sslmode=unknown` で明示的エラーになるテストを追加する
  - [x] `DATABASE_SSL_CA` が `DATABASE_SSL_CA_PATH` より優先される既存テストを維持する

#### 検証

- [x] `npm run test -- prisma`
- [x] `npm run type-check`
- [x] `npm run build`
- [x] `.next` の build trace に `certs/rds-ca-bundle.pem` が含まれることを確認する
- [ ] Amplify の運用手順として、`DATABASE_SSL_CA_PATH=./certs/rds-ca-bundle.pem` で SSR 実接続できることを再確認する

### 期待する着地点

- Amplify の正式運用経路とドキュメントが一致している
- `DATABASE_SSL_CA` は残るが、どの環境で使うべきかが明確になっている
- `sslmode` の解釈が曖昧でなくなり、設定ミスを早期に検出できる
