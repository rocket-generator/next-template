# Next.js テンプレート リファクタリング計画

## 対応状況（2026-04-17 時点）

### 対応完了

- [x] §1 Prisma の SSL 実装の安全化
- [x] §2 セキュリティヘッダの付与
- [x] §3 Storage / Email プロバイダ切替機構の完成
- [x] §4 `package.json` のバージョン不整合修正
- [x] §7 ドキュメント整合のうち、`proxy.ts` リネーム反映と関連ガイド更新
- [x] §9 ロギング / 監視の抽象化
- [x] §11 `npm outdated` による棚卸しと低リスク依存更新
- [x] §13 `GEMINI.md` の縮約 or 除外方針決定

### 未完了

- [ ] §7 未認証アクセスの E2E 追加
- [ ] §5 `output: "standalone"` 対応
- [ ] §6 デプロイターゲット分離 / `deploy/` サンプル整備
- [ ] §8 CI / GitHub Actions 整備
- [ ] §10 `docker-compose.yml` の例示値 / 非公式イメージ改善
- [ ] §11 major 更新候補（Tailwind CSS 4 / Zod 4 / Storybook 10 など）の個別移行判断
- [ ] §12 Jest / Vitest の一本化検討
- [ ] §14 残留生成物 / ワーキングツリー注意書き整備
- [ ] §15 PostgreSQL 固定方針の明文化 or DB 切替戦略検討

作成日: 2026-04-14
最終更新: 2026-04-17（§4 完了、§7 ドキュメント整合反映、§11 低リスク依存更新、対応状況一覧を更新）

## 子計画（実行計画書）

重大項目は個別の実行計画書に分解済。

| # | 計画書 | 対象 |
|---|--------|------|
| 001 | [20260414-refactoring-plan-001.md](./20260414-refactoring-plan-001.md) | Prisma SSL 実装の安全化 |
| 002 | [20260414-refactoring-plan-002.md](./20260414-refactoring-plan-002.md) | セキュリティヘッダの付与 |
| 003 | [20260414-refactoring-plan-003.md](./20260414-refactoring-plan-003.md) | Storage / Email プロバイダ切替機構の完成 |
対象: `/Users/takaaki/Development/rocket/typescript-next-template`
目的: 複数サイト/サービスのベーステンプレートとして耐えるよう、セキュリティ・移植性・運用性を底上げする。特に Amplify 以外（Vercel / Docker / ECS / Fly / Railway / Cloudflare Workers）へのデプロイに対応させる。

## 改訂ノート

初稿（2026-04-14）の内容について、Codex による静的レビュー + `__tests__/proxy.test.ts` の単体テスト通過確認を経て以下を訂正した。

- **§1 を取り下げ**: Next.js 16 の公式アップグレードガイドが `middleware` → `proxy` へのリネームを明示している。`src/proxy.ts` の `export function proxy()` は正しい実装で、バグではない。残課題はドキュメント不整合（AGENTS.md / docs/guides/auth.md が旧命名）と、未認証アクセスの E2E が無い点のみ。
- **§6 を修正**: `build.sh` は Amplify 固有ではなく、汎用 Docker build スクリプト。Amplify 固有なのは `amplify.yml` のみ。
- **§4 を降格**: `output: "standalone"` 未設定は改善候補ではあるが ship blocker ではない。Dockerfile 肥大化対策として Phase 1 に残すが重大度は中。
- **§12 を調整**: 具体バージョンは時点依存（現時点で @hookform/resolvers は 5.x、zod は 4.x、lucide-react は 0.542.x 等）。着手時に `npm outdated` で最新を再確認する方針に変更。

### 第 3 回レビュー（2026-04-16）での修正

- **章番号を連番に整形**: §7 → §9 と飛んでいた番号を詰めて、中程度セクションを §5〜§15 の連番に修正。Phase 2 が参照していた「§8 名前不一致」は §7 のドキュメント整合タスクに統合済みのため削除。
- **「Amplify SSR 前提」の表現を緩和**: `Dockerfile` / `build.sh` が汎用で、README も複数ターゲットを案内済のため、「Amplify 用設定だけが同梱されており、他ターゲット向け具体サンプルが不足」に訂正。
- **§11（旧 docker-compose）の論点を絞り込み**: README.md:69 / README.md:206 で「開発専用」明記は既に済。残課題は「ハードコードされた例示値」と「非公式イメージ依存」に限定。

---

## 結論（サマリ）

設計思想（Repository パターン / atoms-molecules-organisms / Server Actions 寄せ / i18n 既定）は筋が良い。ただしテンプレートとして多サービス展開する前に潰すべき致命傷が複数ある。現状のままでは移植性・セキュリティが弱い。

| 観点 | 評価 |
|------|------|
| アーキテクチャ設計 | ◎ |
| コード品質（TS strict、Repository） | ○ |
| セキュリティ | ✕（Prisma SSL / セキュリティヘッダ） |
| デプロイ移植性 | △（Amplify 設定のみ同梱。README はローカル/本番を分けて案内済） |
| CI/CD | ✕（未整備） |
| ドキュメント整合性 | △（AGENTS.md 等が Next 16 の proxy リネームに未追従） |
| 依存鮮度 | △ |

---

## 🔴 重大（ship する前に直す）

### 1. Prisma の SSL 実装が安全ではない `src/libraries/prisma.ts:16-30`

（初稿 §3 から最優先に繰り上げ。Codex 再レビューでも「先に見るべき」と明示された項目）

```ts
url.searchParams.delete("sslmode");
... ssl: { rejectUnauthorized: false }
```

- `sslmode=require` を指定しても強制的に `rejectUnauthorized: false` に落ちる → 証明書検証無効。RDS / Neon / Supabase 本番で中間者攻撃に脆弱。
- コメントは「RDS で verify-full が失敗するため」だが、正しい解は CA 証明書を渡すか `sslmode=no-verify` のみを認める運用。デフォで検証オフはテンプレートとして最悪。

**推奨アクション**: デフォルトは `rejectUnauthorized: true`。`DATABASE_SSL_REJECT_UNAUTHORIZED=false` を明示指定した時だけオフ。必要に応じて CA 証明書パスを受け付ける。

### 2. セキュリティヘッダがゼロ `next.config.ts:1-48`

- `headers()` 未定義、CSP / HSTS / X-Frame-Options / Referrer-Policy / Permissions-Policy なし。
- Amplify は自動付与しない。Vercel も必要最低限のみ。テンプレートに入れておかないと全派生サイトが裸になる。
- `images.remotePatterns` が AWS S3 固定で、R2 / Cloudflare Images / GCS / MinIO 本番エンドポイントに無対応。

**推奨アクション**: `next.config.ts` に `headers()` を実装。CSP は nonce 対応まで視野に入れる。`remotePatterns` を env ベースで拡張。

### 3. Storage / Email プロバイダ切替機構の未完成 `src/libraries/storage.ts:506-539` / `src/libraries/email.ts:259`

（初稿 §7 から重大に繰り上げ。Codex 再レビューでも「先に見るべき」と明示）

- `StorageProvider` インタフェースは良いが、`createStorageServiceInstance()` が S3 固定ハードコード。R2 / GCS / MinIO 用のプロバイダ実装が無い。
- `EMAIL_PROVIDER` env を参照している箇所もゼロ。抽象だけあって切替できない ＝ テンプレート価値を毀損。
- せめて S3 互換（endpoint/forcePathStyle）を env で設定するだけの切替は入れるべき。

**推奨アクション**: `STORAGE_PROVIDER` / `EMAIL_PROVIDER` env で切替する Factory を実装。最低でも S3 / R2 / MinIO（S3 互換）、SES / SendGrid / Resend / SMTP。

### 4. `package.json` のバージョン不整合 `package.json:111-121`

```
"next": "16.2.3"
"optionalDependencies": { "@next/swc-*": "15.3.3" }
```

- SWC バイナリが Next 15 系のまま残置。CI 環境で偶発的な互換エラーを引き起こす温床。Next 16 では optional は不要なので丸ごと削除すべき。

**推奨アクション**: `optionalDependencies` を削除。

---

## 🟡 中程度（しかるべきタイミングで直す）

### 5. `output: "standalone"` 未設定 `next.config.ts`

（初稿は重大扱いだったが Codex 指摘を受け降格。Next.js 公式は standalone を自己ホスト向けの軽量化オプションと位置付けており、未設定自体はバグではない。ただし Dockerfile 肥大化を解消する価値は大きい）

- Docker / ECS / Fly / Railway / Cloudflare Container で本番イメージが node_modules 込みで肥大。
- `Dockerfile:54-58` も `.next` と `node_modules` を丸コピーしていて、standalone にすれば数百MB削れる。

**推奨アクション**: `output: process.env.NEXT_OUTPUT as "standalone" | "export" | undefined` とし、Dockerfile を standalone 前提に書き換え（optional。Vercel/Amplify のみで運用するなら不要）。

### 6. `amplify.yml` が Amplify 固有 `amplify.yml:10-11`

（初稿で `build.sh` も含めていたが、`build.sh` は汎用 Docker build スクリプト。Amplify 固有なのは `amplify.yml` のみ。なお README.md:206 は既に Vercel/AWS 等複数ターゲットへのデプロイを案内している）

- `rm -rf amplify-compute-bundle-output` / `rm -rf .next` → Amplify 固有のクリーンアップ。
- `artifacts.baseDirectory: .next` は Amplify Hosting (SSR Compute) 想定で、Vercel / ECS では意味を持たない。
- デプロイターゲットごとにエントリを分けるべき。

**推奨アクション**: `deploy/` ディレクトリに環境別サンプル（Vercel / Docker / Fly / Railway / ECS / Cloudflare）を用意し、`amplify.yml` は一つの選択肢として明記。

### 7. Next 16 `proxy` リネームにドキュメントが未追従

（初稿 §1 は「middleware が動いていない可能性」としたが、Next.js 16 の公式アップグレードガイドが `middleware` → `proxy` のリネームを明示しており、`src/proxy.ts` は正しい実装。`__tests__/proxy.test.ts` も pass 確認済。残課題はドキュメントと E2E）

- `AGENTS.md:130` と `docs/guides/auth.md:120` が旧 `src/middleware.ts` / `PUBLIC_PAGES` 表記のまま。
- 実体は `src/proxy.ts` / `PUBLIC_PATHS`。
- 未認証で保護ページにアクセスした際のリダイレクトを検証する **E2E テストが存在しない**。proxy 層の回帰検知が効かない。

**推奨アクション**:
1. AGENTS.md / docs/guides/auth.md を Next 16 の `proxy.ts` 表記に更新。
2. 未認証 → `/admin` 等のアクセスで `/signin` にリダイレクトされる E2E を `e2e/` に追加。

### 8. CI / GitHub Actions が存在しない

- `.github/` が無い。`npm run lint` / `type-check` / `test` / `test:e2e` / build を回す最低限の workflow が無いのはテンプレートとして不十分。
- カバレッジ閾値（AGENTS.md で 80% 掲げている）が CI で強制されていない。

### 9. ロギング／監視の抽象層がない

- 全域 `console.log` / `console.error`。特に `storage.ts:126-247` のように本番ログが情報過多。
- `libraries/logger.ts` を切って、Sentry / OpenTelemetry / Cloudflare Logs 等に差し替え可能にすべき。

### 10. `docker-compose.yml` のハードコード値と非公式イメージ依存

（README.md:69 と README.md:206 で既に「ローカル専用」と明記されているため、開発/本番分離の注意喚起は不要。残課題は以下 2 点）

- `POSTGRES_PASSWORD=password` 等の例示値がハードコード。利用者が気付かずそのまま流用するリスク。
- `gresau/localstack-persist:4` は非公式イメージ。保守断絶時に詰む。

**推奨アクション**: 例示値を `.env.docker.example` 参照に置換して明示的に環境変数化。LocalStack は公式 `localstack/localstack` + 永続化は volume で代替する案を検討。

### 11. 依存の鮮度

2026-04-17 に `npm outdated` を実行し、破壊的変更を避けて low-risk な patch/minor 更新のみ反映した。

- 更新済み: `next` / `eslint-config-next` → `16.2.4`
- 更新済み: `better-auth` → `1.6.5`
- 更新済み: `postcss` → `8.5.10`
- 更新済み: `@aws-sdk/client-s3` / `@aws-sdk/client-ses` / `@aws-sdk/s3-request-presigner` → `3.1031.0`
- 検証: `npm run type-check` / `npm run build` pass

以下は引き続きメジャー更新の検討対象。影響が広いため、個別に migration コストを見て段階的に実施する。

- `tailwindcss@3` → v4 系。`tailwindcss-animate` は `tw-animate-css` 置換も含めて検討。
- `tailwind-merge@2` → v3 系。
- `@hookform/resolvers@3` → v5 系。
- `zod@3` → v4 系。
- `date-fns@3` → v4 系。
- `lucide-react@0.x` → v1 系。
- Storybook 9 系 → 10 系。
- `vitest@3` / `jest@29` / `typescript@5` → 次メジャー。

**残アクション**: `npm outdated` を基点に、一括更新は避けてパッケージ群ごとに移行する。特に Tailwind / Zod / Storybook は別タスク化が妥当。

### 12. `jest` と `vitest` の二重メンテ

- `jest.config.cjs`、`vitest.config.ts` が並立。Storybook が vitest addon 使用、`__tests__` は Jest。将来 vitest に一本化を検討。ランナー 2 系統はテンプレートとして過剰。

### 13. `GEMINI.md` が 156KB

- AI ルール文書が巨大で、テンプレート配布時のノイズ。`docs/guides/` 参照の短縮版に差し替え、もしくは `.gitignore`。

### 14. `tsbuildinfo` / `.DS_Store` がワーキングツリーに残留

- `.gitignore` で除外はされているが、`tsconfig.tsbuildinfo` (700KB) がワーキングツリーに残留。clone 後すぐ `git clean -fdx` 推奨の注意書きが欲しい。

### 15. `prisma/schema.prisma` が PostgreSQL 決め打ち

- テンプレートとしては OK だが、「どの DB でも使える」を謳うなら env で切替できる generator 戦略 or 代替スキーマを用意する価値あり（現実的には Postgres 固定でよい、と明記すべき）。

---

## 🟢 軽微・改善提案

- `src/libraries/api_client.ts` と `@better-fetch/fetch` の使い分け方針を README に明記。
- `messages/ja.json` / `en.json` のキー同期チェック（i18n-unused 等）を CI に。
- `eslint.config.mjs` に `eslint-plugin-security` や `@next/eslint-plugin-next` の strict 設定追加。
- Storybook の `build-storybook` 成果物（`storybook-static/`）がワーキングツリー残留。開発者指示を README に。
- `public/` を精査してテンプレート固有のロゴ等が残っていないか要確認（派生時に毎回削除作業）。
- `.agents` / `.cursor` / `.claude` が混在。どれを正として残すか方針決定を。
- `scripts/` の中身を README に 1 行説明。

---

## 🚀 デプロイ先ポータビリティ具体策

現状は Amplify 用の `amplify.yml` のみが同梱されており、他ターゲット向けの具体サンプルが不足している（`Dockerfile` / `build.sh` 自体は汎用で、README も複数プラットフォームへのデプロイを案内済）。以下を入れると Vercel / Docker / ECS / Fly / Railway / Cloudflare Workers (OpenNext) の選択肢が揃う。

### Phase 1（最優先・1-2日）

1. **§1 Prisma SSL**: CA 検証 ON デフォルトに。`DATABASE_SSL_REJECT_UNAUTHORIZED=false` を明示指定した時だけオフ。
2. **§2 セキュリティヘッダ**: `next.config.ts` の `headers()` で集約（CSP は nonce 対応まで視野）。
3. **§3 Provider Factory**: `STORAGE_PROVIDER` / `EMAIL_PROVIDER` env で切替
   - S3 / R2 / GCS / MinIO（S3 互換 endpoint）
   - SES / SendGrid / Resend / SMTP
4. **§4 optionalDependencies 削除**: SWC バイナリ 15.3.3 残置を除去。
5. **§7 ドキュメント整合**: AGENTS.md / docs/guides/auth.md を `proxy.ts` 表記に更新 + 未認証 E2E 追加。

### Phase 2（1週間）

6. **§5 standalone**: `output` を env 制御で追加し Dockerfile を standalone 前提に書き換え（Docker/ECS/Fly を使うなら必須、Vercel/Amplify のみなら省略可）。
7. **§6 デプロイターゲット分離**: `deploy/` に環境別サンプル（Vercel / Docker / Fly / Railway / ECS / Cloudflare）。
8. **§8 CI/CD**: `.github/workflows/`
   - `ci.yml`（lint + type-check + test + build）
   - `e2e.yml`（Playwright、コンテナ化）
9. **§9 ロガー抽象化** `libraries/logger.ts` + Sentry / Axiom アダプタ。
10. **§10 docker-compose 改善**: 例示値の env 化と、非公式 LocalStack イメージの置換検討。

### Phase 3（移植対応の強化）

11. OpenNext 対応の検証（Cloudflare Workers / SST）。
12. Neon / Supabase / RDS Proxy の接続プーリング差分を `prisma.ts` に吸収。
13. **§11 依存更新**: 着手時に `npm outdated` を実行し、個別に migration コストを評価して順次上げる。
14. **§12 テストランナー一本化**: Jest → Vitest への移行検討。

---

## 優先順位まとめ

Codex 再レビュー反映後の最優先は **§1（Prisma SSL）・§2（ヘッダ）・§3（Provider Factory）・§7（ドキュメント整合＋ E2E）**。これらを片付ければテンプレートの価値が一段階上がり、派生サイト側で負債を引き継ぐリスクが大きく減る。

low-risk × high-impact から着手するなら **§1（Prisma SSL）→ §3（Provider Factory）→ §7（ドキュメント＋ E2E）** の順が推奨。`output: "standalone"` や依存更新はその次で十分。
