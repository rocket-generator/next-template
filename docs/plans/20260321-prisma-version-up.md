# Prismaのバージョンアップ

Prisma の最新版は 7.5.0 であるが、このリポジトリではまだ6.xを利用しているので、バージョンアップをしたい。

公式のアップグレードガイドを documents/references/prisma-version-up-to-7.md においた。これに基づいてアップデートを行ってください。

---

## 追記: Prisma 7 移行の実装計画（2026-03-21）

### 前提として確定した事項

- Prisma の更新先は、**実装着手時点の 7 系最新**とする。`7.5.0` 固定ではなく、実装時に 7.x 系の最新安定版を確認して採用する。
- `package.json` には **`"type": "module"` を追加**し、Node.js が直接読む設定ファイル・補助スクリプト・ビルド設定も含めて **ESM を標準**にする。
- このリポジトリはテンプレートリポジトリであり、**Prisma 6 との後方互換レイヤーは作らない**。移行後は Prisma 7 前提の構成に一本化する。
- ドキュメントは README のみではなく、**開発者向け補助ドキュメントも同時に更新**し、セットアップ手順・運用手順・生成物の扱いが食い違わない状態までそろえる。

### 背景

現状のリポジトリは `prisma@6.19.2` / `@prisma/client@6.19.2` を利用しており、`prisma/schema.prisma` の `generator` も `prisma-client-js` のままである。Prisma 7 では、単なるパッケージ更新ではなく、少なくとも以下の破壊的変更に対応する必要がある。

- Prisma Client の生成方式が `prisma-client-js` から `prisma-client` に変わる。
- Prisma CLI の設定場所が `schema.prisma` 側から `prisma.config.ts` 側へ寄る。
- PostgreSQL 利用時は driver adapter ベースの初期化が前提になる。
- `prisma migrate dev` / `prisma db push` が `prisma generate` を暗黙実行しなくなる。
- `prisma migrate dev` / `prisma migrate reset` が seed を暗黙実行しなくなる。
- ESM 前提の運用が推奨され、Node.js が直接読む `.js` / 設定ファイルの扱いが変わる。

このリポジトリではさらに、Prisma の生成物を `src/generated/prisma` に出力し、[`src/libraries/prisma.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/prisma.ts)・[`prisma/seed.ts`](/Users/takaaki/Development/rocket/typescript-next-template/prisma/seed.ts)・[`src/models/user.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/models/user.ts)・テストコードがそれを直接参照している。加えて、Docker ビルド、Amplify ビルド、README、AGENTS/GEMINI/CLAUDE 系ドキュメントも Prisma 6 時代の前提に依存している。

したがって、本件は「依存パッケージの更新」ではなく、**Prisma の生成・接続・開発運用・ドキュメントの一括再設計**として進める必要がある。

### 方針とその理由

#### 1. Prisma 7 の公式推奨構成に寄せ、独自互換を持ち込まない

理由:

- テンプレートリポジトリでは、過去の運用を引きずる互換コードよりも、今後の新規利用者が理解しやすい標準構成の方が保守しやすい。
- Prisma 7 の breaking change は生成方式・CLI 設定・接続方式までまたがるため、一部だけ旧構成を残すと学習コストと障害ポイントが増える。

採用する方針:

- `generator client` は `prisma-client` に切り替える。
- ルートに `prisma.config.ts` を新設し、CLI 用の `schema` / `migrations` / `datasource` / `seed` を集約する。
- PostgreSQL 接続は `@prisma/adapter-pg` を用いる構成へ移行する。
- Prisma 6 時代の暗黙挙動に依存せず、`generate` / `seed` は常に明示実行する。

#### 2. モジュール方式は ESM に統一し、必要な例外だけを明示する

理由:

- Prisma 7 の推奨構成と整合する。
- 今のリポジトリには `jest.config.js`、`__mocks__/next-intl-server.js`、一部テスト/セットアップの `require(...)` など、Node 実行ファイル側に CommonJS が残っている。
- ESM へ統一しておくことで、「アプリ本体は ESM、設定だけ CJS」という混在状態を減らせる。

採用する方針:

- `package.json` に `"type": "module"` を追加する。
- Node.js が直接読むファイルは、まず ESM 化を試みる。
- ツール都合で CJS が必須なものだけ、`.cjs` などの明示的な境界に寄せる。
- 「なんとなく動いている CommonJS 設定」は残さない。

#### 3. Prisma Client の import と生成物の扱いを一本化する

理由:

- 現状は `src/generated/prisma` の root export を直接読んでいる箇所があるが、Prisma 7 では生成物の entrypoint と export 面を一度確認して、今後の標準 import を固定した方が安全である。
- 生成物ディレクトリは `.gitignore` 対象であり、ローカル再生成が前提になるため、README と build pipeline の記述を完全にそろえる必要がある。

採用する方針:

- 生成先ディレクトリは引き続き `src/generated/prisma` を使用する。
- ただし import は Prisma 7 の生成結果を確認した上で、**公式推奨の entrypoint に統一**する。
- アプリ runtime、seed、型 import、テストモックで別々の import 規約を持たない。

#### 4. テンプレート利用者の体験を基準に、コードとドキュメントを同時に直す

理由:

- テンプレートリポジトリでは、コードだけ更新して README や補助ドキュメントを放置すると、初期セットアップの失敗率が上がる。
- 現状でも README に `.env.docker` への言及がある一方で、実ファイルは `.env.example` のみであり、既に説明のズレがある。

採用する方針:

- コード変更と同一作業で README、AGENTS、GEMINI、CLAUDE、必要なサンプル環境変数説明を更新する。
- 実際に存在するファイル名・実際に動くコマンド・Prisma 7 後の挙動に説明をそろえる。

### 具体的なタスク

#### 0. 移行前の固定事項と影響範囲の整理

- [x] 実装着手時点で `prisma` / `@prisma/client` の **7 系最新安定版**を確認し、採用バージョンを確定する。
- [x] Prisma 7 の breaking changes のうち、このリポジトリに直接関係する項目を確定する。対象は少なくとも ESM、`prisma-client`、`prisma.config.ts`、driver adapter、explicit `prisma generate`、explicit seed、環境変数ロード方法とする。
- [x] 変更対象ファイルの初期一覧を確定する。最低でも `package.json`、`package-lock.json`、`prisma/schema.prisma`、`prisma.config.ts`、`src/libraries/prisma.ts`、`prisma/seed.ts`、Prisma import を持つソース/テスト、`Dockerfile`、`amplify.yml`、README、AGENTS、GEMINI、CLAUDE を含める。
- [x] `.gitignore` 上 `src/generated/` が追跡対象外であることを前提に、生成物は「常に再生成されるもの」として扱う方針を計画・実装・ドキュメントで統一する。

#### 1. 依存関係とモジュール方式の更新

- [x] `package.json` に `"type": "module"` を追加し、プロジェクト全体の Node 実行モジュール方式を ESM に切り替える。
- [x] `prisma` と `@prisma/client` を 7 系最新へ更新する。
- [x] PostgreSQL 用 driver adapter として `@prisma/adapter-pg` を追加する。
- [x] Prisma 7 の接続基盤として `pg` を明示依存に追加し、暗黙 peer 依存にしない。
- [x] `prisma.config.ts` で `dotenv/config` を使用する前提に合わせ、必要な依存関係と lockfile を更新する。
- [x] `package-lock.json` を再生成し、Prisma 6 系と Prisma 7 系の混在が残っていないことを確認する。

#### 2. ESM 化に伴う Node 実行ファイル・設定ファイルの整理

- [x] [`jest.config.js`](/Users/takaaki/Development/rocket/typescript-next-template/jest.config.js) を、`"type": "module"` 追加後も確実に動作する形式へ移行する。第一候補は ESM 化、ツール制約がある場合のみ `.cjs` へ明示分離する。
- [x] [`__mocks__/next-intl-server.js`](/Users/takaaki/Development/rocket/typescript-next-template/__mocks__/next-intl-server.js) の `module.exports` を解消し、ESM 前提で読み込める状態にする。
- [x] [`tailwind.config.ts`](/Users/takaaki/Development/rocket/typescript-next-template/tailwind.config.ts) の `require("tailwindcss-animate")` を ESM import ベースへ置き換える。
- [x] [`jest.setup.ts`](/Users/takaaki/Development/rocket/typescript-next-template/jest.setup.ts) 内の `require(...)` 使用箇所を洗い出し、Jest/ESM 下でも安定して動く形に整理する。
- [x] テストコード内で `require(...)` を用いている箇所を洗い出し、必要に応じて `import` または ESM 互換な参照方法へ寄せる。
- [ ] ESM 化後に `next.config.ts`、`playwright.config.ts`、`vitest.config.ts` など既存の ESM 設定ファイルが追加修正なしで動くかを確認する。

#### 3. Prisma スキーマ・CLI 設定・生成物構成の移行

- [x] [`prisma/schema.prisma`](/Users/takaaki/Development/rocket/typescript-next-template/prisma/schema.prisma) の `generator client` を `prisma-client` へ切り替える。
- [x] 生成先は引き続き `src/generated/prisma` とし、既存の alias / Docker / Better Auth との相性を保ちつつ Prisma 7 構成へ移行する。
- [x] `prisma-client-js` 時代の前提で設定している `binaryTargets` が不要かを確認し、不要であれば削除して構成を簡素化する。
- [x] `schema.prisma` 側の datasource 設定から、Prisma 7 で `prisma.config.ts` へ移すべき項目を整理し、deprecated な持ち方を残さない。
- [x] ルートに [`prisma.config.ts`](/Users/takaaki/Development/rocket/typescript-next-template/prisma.config.ts) を新設し、少なくとも `schema`、`migrations.path`、`migrations.seed`、`datasource.url` を定義する。
- [x] `prisma.config.ts` は `import "dotenv/config"` を前提とし、Prisma CLI 実行時に `.env` を自動で読まなくなる Prisma 7 の仕様差分を吸収する。
- [x] 生成を一度実行し、Prisma 7 の生成物の entrypoint、型 export、ディレクトリ構造を確認して、今後の標準 import パスを確定する。
- [ ] 旧生成物の残骸が新生成物と混在しないよう、ローカル生成ディレクトリのクリーニング方針を決めてから再生成する。

#### 4. Prisma Client 初期化コードの移行

- [x] [`src/libraries/prisma.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/prisma.ts) を Prisma 7 方式へ書き換え、生成された Prisma Client と `PrismaPg` adapter を組み合わせる。
- [x] 現在の開発用 singleton パターンは維持しつつ、adapter 導入後も多重接続やインスタンス乱立が起きないようにする。
- [x] Prisma Client の生成ロジックと adapter 生成ロジックを、アプリ本体と seed で重複実装しない構成に整理する。
- [x] 接続先は基本的に `DATABASE_URL` を単一の真実源とし、ローカル・Docker・デプロイ環境で参照方法がぶれないよう統一する。
- [x] Prisma 7 で driver adapter の接続プール/SSL 挙動が変わる点を踏まえ、必要なら timeout / SSL の明示設定ポイントをコード上に残す。
- [x] [`src/libraries/auth.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/auth.ts) の Better Auth Prisma adapter が、新しい Prisma Client 初期化後も同一インスタンスを受け取ることを確認する。

#### 5. seed・開発コマンド・Prisma 運用フローの再設計

- [x] [`prisma/seed.ts`](/Users/takaaki/Development/rocket/typescript-next-template/prisma/seed.ts) を Prisma 7 の import / adapter 構成に合わせて更新する。
- [x] `seed.ts` がアプリ本体と同じ接続初期化方針を使うようにし、別実装による設定ずれを防ぐ。
- [x] `prisma migrate dev` / `prisma migrate reset` が seed を暗黙実行しなくなることを前提に、ローカル開発の推奨フローを再定義する。
- [x] `prisma db push` / `prisma migrate dev` が `prisma generate` を暗黙実行しなくなることを前提に、コマンドの前後関係を整理する。
- [x] `package.json` の Prisma 関連 scripts を、Prisma 7 の明示挙動に合わせて再設計する。
- [x] 必要であれば `generate` / `push` / `migrate` / `seed` / `reset` をホスト実行用と Docker 実行用で分け、名前から挙動が誤解されないようにする。
- [x] `docker:db:setup` の役割を見直し、Prisma 7 で必要な `generate` と `seed` が抜け落ちない形にする。
- [x] `docker:db:reset` の役割を見直し、reset 後に何が実行されるかをコマンド名と README の両方で明確にする。

#### 6. Prisma import と型参照の全面更新

- [x] [`src/libraries/prisma.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/libraries/prisma.ts)、[`prisma/seed.ts`](/Users/takaaki/Development/rocket/typescript-next-template/prisma/seed.ts)、[`src/models/user.ts`](/Users/takaaki/Development/rocket/typescript-next-template/src/models/user.ts)、[`__tests__/models/user.test.ts`](/Users/takaaki/Development/rocket/typescript-next-template/__tests__/models/user.test.ts) などの Prisma import を新しい標準 entrypoint に統一する。
- [x] runtime 用 import と type 用 import で別々の慣習を作らず、同じ生成物基準で読めるよう整理する。
- [x] `@prisma/client` への直接 import、`prisma-client-js` 前提の import、古い generated path を全検索して除去する。
- [x] Prisma 型名・export 形状が変わる場合は、モデル変換関数やテストデータ生成コードの型注釈も合わせて更新する。

#### 7. Docker / Amplify / ビルドパイプラインの更新

- [x] [`Dockerfile`](/Users/takaaki/Development/rocket/typescript-next-template/Dockerfile) の `npx prisma generate` 実行箇所が、Prisma 7 + `prisma.config.ts` + ESM 構成で通るよう見直す。
- [x] `prisma.config.ts` 導入後、Docker build 中の `prisma generate` が `DATABASE_URL` 未設定で失敗しないかを確認し、必要なら build-time 用の安全な対策を入れる。
- [x] Rust ベース engine 前提のコピーやファイル配置が不要になった場合は、Docker image 内へのコピー対象を簡素化する。
- [x] Production image で `src/generated/prisma` を確実に同梱できるよう、生成タイミングとコピー手順を再確認する。
- [x] [`amplify.yml`](/Users/takaaki/Development/rocket/typescript-next-template/amplify.yml) の build 手順を Prisma 7 前提へ更新し、`.env` 生成、`prisma generate`、アプリ build の順序を確認する。
- [x] `npm run build` の前提条件として Prisma Client 生成が必要であることを、CI/CD とローカルの両方で再現できるようにする。

#### 8. ドキュメント更新

- [x] [`README.md`](/Users/takaaki/Development/rocket/typescript-next-template/README.md) の Prisma/DB セットアップ手順を、Prisma 7 の明示 `generate` / 明示 seed / `prisma.config.ts` 前提へ書き換える。
- [x] README 内の `.env.docker` への言及など、現実のファイル構成とずれている説明を修正する。
- [x] README の Docker セクションで、Prisma 7 後の `docker:db:*` scripts と初期化手順がそのまま実行できるように整える。
- [x] README の「利用可能なスクリプト」一覧を、実際の `package.json` と一致させる。
- [x] [`AGENTS.md`](/Users/takaaki/Development/rocket/typescript-next-template/AGENTS.md) 内の Prisma バージョン、生成物、セットアップ手順に関する記述を Prisma 7 前提へ更新する。
- [x] [`GEMINI.md`](/Users/takaaki/Development/rocket/typescript-next-template/GEMINI.md) 内の Prisma バージョン、生成物、セットアップ手順に関する記述を Prisma 7 前提へ更新する。
- [x] [`CLAUDE.md`](/Users/takaaki/Development/rocket/typescript-next-template/CLAUDE.md) 内の Prisma コマンド例とアーキテクチャ説明を Prisma 7 前提へ更新する。
- [x] 生成物の配置場所が `src/generated/prisma` のままであること、ただし Git 管理対象ではなく `prisma generate` で再生成する前提であることを、README と補助ドキュメントの両方に明記する。

#### 9. 動作確認と受け入れ条件

- [x] `npm install` 後、ローカル環境で `prisma generate` が成功することを確認する。
- [x] `npm run type-check` が通ることを確認する。
- [x] `npm run lint` が通ることを確認する。
- [x] Prisma import を含むユニットテスト群が通ることを確認する。最低でも `__tests__/models/user.test.ts` と `__tests__/repositories/prisma_repository.test.ts` は再実行対象とする。
- [x] `npm run build` が通ることを確認する。
- [x] Docker build または `docker compose` 前提の Prisma 生成手順が通ることを確認する。
- [x] Better Auth が利用する Prisma adapter 経由の基本動作に退行がないことを確認する。
- [ ] 初回セットアップ手順を README に沿って再実行し、テンプレート利用者の視点で不足手順が残っていないことを確認する。

### この計画で明示的にやらないこと

- Prisma 6 と Prisma 7 を切り替えられる暫定互換コードの追加。
- 旧コマンド体系を温存するためだけのエイリアスの大量追加。
- 過去データ移行や本番 DB の後方互換性を守るための特別対応。

### 完了条件

以下をすべて満たした時点で、本計画の実装完了とみなす。

- Prisma 7 系最新でローカル開発・Docker build・本番ビルド手順が再現できる。
- ESM 化後もテスト・型チェック・ビルドが通る。
- Prisma Client の生成・接続・seed・ドキュメントがすべて Prisma 7 前提に統一されている。
- README と補助ドキュメントを見れば、テンプレート利用者が迷わず初期セットアップできる。
