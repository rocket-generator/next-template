# Better Auth の利用方法を整理する

## 現状の整理
現在、このテンプレートレポジトリはBetter Authを利用している。しかし、もともとNextAuthを利用していた里、独自の実装が入っているものを無理やり合わせているため、Better Authのより標準的な、いわばベストプラクティスに従っているとは言い難い気がする。

Better Authのより標準的な使い方と、このリポジトリでの現在の使い方などを調査し、よりメンテナンスや今後のバージョンアップがしやすく、Better Authをすでに使ったことがある人が使いやすい方法を検討したい。

DBやページの構造を変えても良い。しかし、現在存在する機能はできるだけ維持したい。どのように整理したら良いか、まずは調査して、まとめてほしい。

その後、実装を行いたい。

---

## 追記: 2026-03-20 テンプレート前提での再計画

### 背景

このリポジトリは既存プロダクトではなくテンプレートリポジトリである。したがって、既存データの保護、過去実装との後方互換、未導入インテグレーションへの配慮を優先する必要はない。今回の計画は、現行コードの延命ではなく、「新規プロジェクトの土台として最も理解しやすく、保守しやすく、Better Auth の標準に近い構成」を作る前提で立て直す。

2026-03-20 時点の実装には、テンプレートとして見ると以下の問題がある。

- Better Auth を導入しているにもかかわらず、認証ライフサイクルの中心が `src/services/auth_service.ts` に残っており、責務が二重化している。
- サインイン/サインアップは `AuthService` と Better Auth の両方を通るため、理解コストが高い。
- `users.password` と `accounts.password` の両方にパスワードハッシュが存在し、認証情報の正が曖昧である。
- `password_resets` と `email_verifications` が Better Auth 標準の `verifications` と並存しており、トークン管理が分裂している。
- `syncCredentialAccount()` のような移行由来の補助ロジックが残っており、テンプレートの初学者には本質が見えにくい。
- `session` に `permissions` と `accessToken` を重ねて持たせる独自設計があり、Better Auth 標準の理解を妨げている。
- `AuthRepository.getMe()` と layout/page 側のエラーハンドリングが揃っておらず、認証失敗時の分岐が不統一である。
- README や認証ドキュメントが「今の理想的な設計」ではなく「移行途中の設計」を説明してしまっている。

テンプレートとしては、「動く」だけでは不十分であり、「最初に読んだ開発者が迷わない」ことが重要である。そのため、今回は互換レイヤーを温存するのではなく、不要な層を削除して理想形へ寄せる。

### 目指す理想形

- Better Auth が認証の唯一の責務を持つ。
- サインイン、サインアップ、サインアウト、メール認証、パスワードリセット、パスワード変更、セッション取得は Better Auth の標準 API を中心に構成する。
- `User` はドメイン上のユーザー情報のみを持ち、パスワードハッシュは `Account` にのみ保持する。
- 認証トークンは Better Auth の `Verification` テーブルだけを使い、独自の `PasswordReset` / `EmailVerification` テーブルは廃止する。
- `src/libraries/auth.ts` は Better Auth インスタンス定義と最小限の helper のみを持つ。
- `AuthService` は削除しない。ただし、認証基盤の実装主体ではなく、Better Auth を呼び出しつつアプリ固有ルールや副作用を集約する薄いアプリケーションサービスとして再定義する。
- Server Action は薄いアプリ層として残すが、内部では Better Auth API を直接呼ぶ。
- セッション情報は最小限に保ち、`permissions` のような独自フィールドは `user` 側に寄せる。実需要のない `accessToken` は持たない。
- テストと README は、この理想形を前提に読み替えなしで理解できる内容に揃える。

### AuthService の再定義

現状の `AuthService` は、Better Auth が本来担うべき認証処理と、アプリ固有のルールや副作用を一緒に持っている。これが複雑さの原因である。

理想形では `AuthService` を以下の責務に限定する。

- Better Auth API を呼び出した前後で必要になるアプリ固有の処理をまとめる。
- 初期 `permissions` 付与、`isActive` の業務ルール、プロフィール更新時の追加処理など、テンプレート固有のポリシーを集約する。
- 認証メール送信やパスワード再設定後のアプリ側通知など、Better Auth の hook だけでは散らばりやすい副作用をまとめる。
- UI/Server Action が直接 Better Auth に強く結合しすぎないよう、テンプレート内の利用窓口を整理する。

逆に、以下の責務は `AuthService` から外す。

- パスワード検証そのもの
- サインイン/サインアップの主体
- セッション作成と管理
- メール認証トークンの発行と検証
- パスワードリセットトークンの発行と検証

つまり、`AuthService` は「認証を実装するサービス」ではなく、「Better Auth を使ってテンプレート固有の認証関連ユースケースをまとめるサービス」に変わる。

### テーブルごとの役割の変化

現状は `users` テーブルが認証情報を抱え込みすぎている。理想形では、各テーブルの役割を以下のように明確に分ける。

#### `users`

- 役割: アプリケーション上のユーザープロフィールと権限情報を保持する主テーブル
- 持つもの:
  - `id`
  - `name`
  - `email`
  - `permissions`
  - `language`
  - `avatar_key`
  - `is_active`
  - `email_verified`
  - `created_at`
  - `updated_at`
- 持たないもの:
  - `password`
  - 独自のメール認証トークン
  - 独自のパスワードリセットトークン

#### `accounts`

- 役割: Better Auth が管理する認証手段ごとの資格情報を保持するテーブル
- 持つもの:
  - `user_id`
  - `provider_id`
  - `account_id`
  - `password` （credential login の場合のみ）
  - OAuth を使う場合の token 系カラム
  - `created_at`
  - `updated_at`
- 備考:
  - メール/パスワード認証のハッシュはここだけに持つ。
  - 将来 OAuth を追加しても、認証手段の追加先はこのテーブルで一貫する。

#### `sessions`

- 役割: Better Auth のセッション状態を保持するテーブル
- 持つもの:
  - `user_id`
  - `token`
  - `expires_at`
  - `ip_address`
  - `user_agent`
  - `created_at`
  - `updated_at`
- 方針:
  - 認証に不要な独自情報は極力持たない。
  - セッションは認可の補助ではなく、ログイン状態の保持に集中させる。

#### `verifications`

- 役割: Better Auth が使う一時トークンを一元管理するテーブル
- 用途:
  - メール認証
  - パスワードリセット
  - 将来 Better Auth が追加で使う検証系フロー
- 方針:
  - 独自の `email_verifications` と `password_resets` は廃止し、このテーブルに一本化する。

### `email_verified` と `verifications` の役割分担

ここは誤解しやすいため、明示的に分けて考える。

- `users.email_verified`
  - これは「そのユーザーが現在、メール認証済みか」を表す永続的な状態である。
  - ログイン可否、画面表示制御、管理画面での状態確認など、アプリケーションが現在状態を判断するために使う。
  - 一度認証が完了すれば、認証トークンが削除されてもこの値は残る。

- `verifications`
  - これは「今進行中の検証処理のための一時トークン」を保持するテーブルである。
  - メール認証リンク、パスワードリセットリンクなど、期限付き・使い捨てのフローを成立させるために使う。
  - 検証が完了した後は削除または失効し、永続状態としては扱わない。

つまり、`email_verified` は状態、`verifications` はその状態を変更するための一時的な手段である。両者は置き換え関係ではなく、責務が異なる。

#### 状態遷移の例

- 新規登録直後
  - `users.email_verified = false`
  - `verifications` にメール認証用トークンが存在する

- メール認証リンクを踏んだ後
  - `users.email_verified = true`
  - 該当する `verifications` のトークンは削除または失効する

- パスワードリセット時
  - `users.email_verified` は変更しない
  - `verifications` にパスワードリセット用トークンを作る

#### 設計上の結論

- `users.email_verified` は残す。
- `verifications` も残す。
- 廃止するのは、`email_verified` ではなく、独自の `email_verifications` と `password_resets` である。
- 「メール認証済みかどうかの現在状態」は `users.email_verified` を見る。
- 「メール認証やパスワードリセットの途中状態」は `verifications` を見る。

#### 廃止対象

- `users.password`
  - 理由: 認証資格情報の保存先を `accounts.password` に一本化するため。
- `email_verifications`
  - 理由: `verifications` と責務が重複するため。
- `password_resets`
  - 理由: `verifications` と責務が重複するため。

### 方針とその理由

#### 方針 1. Better Auth を認証の唯一の中心にする

認証そのものを独自サービス層に残さない。  
理由は、テンプレートでは「抽象化の多さ」より「標準に近さ」と「学習コストの低さ」が重要だからである。

#### 方針 2. `AuthService` は残すが、責務をアプリ固有の集約に限定する

認証基盤の実装主体は Better Auth に委ね、`AuthService` はテンプレート固有の業務ルールと副作用の集約点として残す。  
理由は、認証ロジックの二重実装は避けつつ、今後の開発で認証関連のアプリルールが Action や page に分散するのも避けたいからである。

#### 方針 3. 移行のためだけに存在するコードは削除する

`syncCredentialAccount()`、独自トークンテーブル、手動セッション構築など、移行期には必要でもテンプレートには不要なものは残さない。  
理由は、残した瞬間にそのコードが「推奨実装」に見えてしまい、テンプレートの品質を下げるためである。

#### 方針 4. ドメイン固有の情報だけをアプリ側に残す

`permissions`, `language`, `avatarKey`, `isActive` のようなアプリ固有フィールドは保持するが、認証ロジックは Better Auth に寄せる。  
理由は、テンプレートとしての拡張性は保ちつつ、認証の責務分離を明確にできるからである。

#### 方針 5. 実需のない設計は持たない

現時点でテンプレート本体が使っていない `accessToken` や外部 API 連携前提の複雑な認証連携は、ベースラインから外す。  
理由は、将来使うかもしれない設計を先回りで残すと、現在のテンプレートが複雑になるだけだからである。

#### 方針 6. 既存実装の説明ではなく、理想実装の説明を書く

README や計画書は、現状の移行痕跡を説明するのではなく、最終的に採用する構成を説明する。  
理由は、テンプレートの利用者は歴史ではなく、これから採用すべき構成を知りたいからである。

### 今回の前提

- 既存データの移行は考慮しない。
- 過去のメールリンクや旧トークンの救済は考慮しない。
- まだ存在しない外部バックエンドや将来の Bearer Token 連携は考慮しない。
- 既存コードの一部を大きく削除してもよい。
- URL や UI は必要最小限の範囲で整理してよく、移行互換のためだけの複雑さは持ち込まない。

### 具体的なタスク

#### フェーズ 0. 理想構成の固定

- [ ] 認証領域の最終責務を表で固定する。対象は `auth.ts`, Server Action, Repository, Prisma schema, page/layout guard, client hook である。
- [ ] `AuthService` に残す責務を明文化する。少なくとも「残す責務」「削る責務」「Better Auth 側へ委譲する責務」を表で整理する。
- [ ] テンプレートに残す認証関連の概念を固定する。少なくとも `User`, `Account`, `Session`, `Verification`, `permissions`, `language`, `avatarKey`, `isActive`, `emailVerified` について、残す理由と責務を明文化する。
- [ ] テンプレートから外す概念を固定する。少なくとも `AuthService` の認証基盤責務、`users.password`, `PasswordReset`, `EmailVerification`, `accessToken`, `syncCredentialAccount()` を対象にする。
- [ ] セッションに何を含めるかを固定する。最低限 `session.user.id`, `session.user.email`, `session.user.name`, `session.user.permissions` の扱いを決め、`accessToken` を含めない前提で設計を確定する。
- [ ] サインアップを Better Auth 標準の `signUpEmail` に完全移行する前提を確定する。
- [ ] メール認証とパスワードリセットは Better Auth 標準の `sendVerificationEmail` / `verifyEmail` / `requestPasswordReset` / `resetPassword` を使う前提を確定する。

#### フェーズ 1. Better Auth 設定の再設計

- [x] `src/libraries/auth.ts` の役割を「Better Auth インスタンス定義」と「最小限の server helper」に絞る設計に書き換える。
- [x] `session.additionalFields` のうち、テンプレートに不要な `accessToken` と重複的な `permissions` を削除する設計にする。
- [x] `user.additionalFields` はテンプレートに本当に必要なものだけを残す。少なくとも `permissions`, `language`, `avatarKey`, `isActive` を候補として再評価する。
- [x] Better Auth の `emailAndPassword` 設定をテンプレート前提で見直す。少なくとも `enabled`, `disableSignUp`, `autoSignIn`, `requireEmailVerification`, `sendResetPassword` の最終値を決める。
- [x] Better Auth の `emailVerification` 設定を正式に使う構成にし、検証メール送信を既存メールサービスへ接続する。
- [x] Prisma adapter の model/field mapping を見直し、現行スキーマで不要な override を減らす。
- [x] `handlers` と route handler の公開面を整理し、テンプレート利用者が Better Auth の標準入口を読み取りやすい状態にする。
- [x] `auth()` という独自ラッパーを残す場合は、Better Auth 標準の session shape を崩さない薄い helper に限定する。

#### フェーズ 2. Prisma スキーマとモデルの整理

- [x] `prisma/schema.prisma` から `User.password` を削除し、パスワードハッシュの保存先を `Account.password` に一本化する。
- [x] `prisma/schema.prisma` から `EmailVerification` モデルを削除する。
- [x] `prisma/schema.prisma` から `PasswordReset` モデルを削除する。
- [x] `Verification` モデルを Better Auth 標準の用途だけに使う前提で見直し、名前・field mapping・コメントを整理する。
- [x] `Account` の credential record は Better Auth が自然に作る形に合わせ、テンプレートコードが手動で整形しなくてよい状態にする。
- [x] `src/models/auth.ts` を見直し、認証モデルが `password` 前提になっている構造を解体する。
- [ ] `src/models/user.ts` を見直し、テンプレートのユーザーモデルがプロフィール/権限情報だけを表すように整理する。
- [ ] Prisma 生成物、seed、型定義、テスト fixture が新しいスキーマと矛盾しないよう更新対象一覧を作る。

#### フェーズ 3. 認証フローの置き換え

- [x] `src/app/(site)/(unauthorized)/(auth)/signin/actions.ts` を Better Auth の `signInEmail` ベースの薄い Action に置き換える。
- [x] `src/app/(site)/(unauthorized)/(auth)/signup/actions.ts` を Better Auth の `signUpEmail` ベースの薄い Action に置き換える。
- [x] `src/app/(site)/(unauthorized)/(auth)/verify-email/actions.ts` を Better Auth の `verifyEmail` と `sendVerificationEmail` ベースへ置き換える。
- [x] `src/app/(site)/(unauthorized)/(auth)/forgot-password/actions.ts` を Better Auth の `requestPasswordReset` ベースへ置き換える。
- [x] `src/app/(site)/(unauthorized)/(auth)/reset-password/actions.ts` を Better Auth の `resetPassword` ベースへ置き換える。
- [x] `src/app/(site)/(authorized)/(app)/settings/actions.ts` のパスワード変更を Better Auth の `changePassword` ベースへ置き換える。
- [x] サインイン、サインアップ、パスワード再設定、メール認証の各 Action で、UI へ返すステータス値を必要最小限に統一する。
- [x] 認証フロー内に残る `syncCredentialAccount()`, 手動セッション構築ロジックを完全に除去する。
- [x] `AuthService` を Better Auth の薄いラッパー兼アプリ固有副作用の集約点として再実装するか、同等の責務を持つ新サービスへ置き換える。

#### フェーズ 4. セッション取得と認可の整理

- [x] サーバー側で使う helper を整理し、「任意セッション取得」「ログイン必須」「管理者必須」の 3 系統に分ける。
- [x] `src/app/(site)/(authorized)/(app)/layout.tsx` を共通 helper ベースへ寄せる。
- [x] `src/app/(site)/(authorized)/admin/layout.tsx` を共通 helper ベースへ寄せる。
- [x] `src/app/(site)/(authorized)/admin/users/page.tsx` の `AuthError` 依存分岐を削除し、共通 helper による認証保証へ置き換える。
- [ ] `src/repositories/auth_repository.ts` を削除するか、認証責務を持たない形へ解体する。
- [x] `src/hooks/useAuthSession.ts` を Better Auth の `useSession` を素直に扱う実装へ単純化する。
- [x] `HeaderUserMenu` などクライアント側の session 利用箇所を、新しい session shape に合わせて簡潔にする。
- [ ] `proxy.ts` は optimistic redirect に限定し、本当の認可判定は server side helper で行う構成に整理する。

#### フェーズ 5. 不要コードの削除

- [x] 現在の `src/services/auth_service.ts` をそのまま残さず、認証基盤責務を除去した新しい責務へ置き換える。
- [ ] `src/repositories/auth_repository.ts` を削除するか、不要なら完全に削除する。
- [x] `src/repositories/password_reset_repository.ts` を削除する。
- [x] `src/repositories/email_verification_repository.ts` を削除する。
- [x] `src/models/password_reset.ts` を削除する。
- [x] `src/models/email_verification.ts` を削除する。
- [x] `src/models/access_token.ts` を削除する。
- [ ] `src/constants/auth.ts` の値を見直し、移行前提で増えた状態値や曖昧な命名があれば整理する。
- [x] `src/libraries/auth.ts` から `signIn`, `establishSession`, `syncCredentialAccount`, `normalizeSignInError`, `logSignInError` など移行用ロジックを削除する。
- [ ] `src/types/auth.d.ts` から `accessToken`, `sessionToken` などテンプレートに不要な独自拡張を削除または最小化する。
- [ ] `APIRepository` とそれにぶら下がる Bearer Token 前提コードについて、テンプレート本体で未使用なら認証依存を外すか削除候補として整理する。
- [ ] `user.password` を直接参照するコードを全検索し、全て撤去する。

#### フェーズ 6. seed・初期データ・開発体験の整理

- [x] `prisma/seed.ts` を新しい理想スキーマに合わせて作り直す。
- [x] seed の管理者ユーザー作成方法を Better Auth 標準に沿う形で定義する。
- [ ] 開発者がローカルで認証確認する最短手順を整理し、seed と README に反映する。
- [ ] `.env.example` の認証関連キーを整理し、実際に必要なものだけを残す。
- [ ] メール認証を有効にする場合と無効にする場合で、テンプレートの初期体験が破綻しないように初期設定を見直す。

#### フェーズ 7. テストの作り直し

- [x] `AuthService` 前提のユニットテストを棚卸しし、削除対象と書き換え対象を明確にする。
- [ ] `src/libraries/auth.ts` または新しい auth helper 群に対する単体テストを追加する。
- [ ] サインイン Action のテストを Better Auth API ベースに書き換える。
- [ ] サインアップ Action のテストを Better Auth API ベースに書き換える。
- [ ] メール認証 Action のテストを Better Auth API ベースに書き換える。
- [ ] パスワードリセット Action のテストを Better Auth API ベースに書き換える。
- [ ] `settings/actions.ts` のパスワード変更テストを Better Auth API ベースに書き換える。
- [ ] E2E で最低限確認する認証シナリオを固定する。対象はサインアップ、サインイン、ログアウト、保護ページリダイレクト、メール認証、パスワード再設定である。
- [ ] 新しい理想構成で `npm run type-check`, `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build` を通す。

#### フェーズ 8. ドキュメントの整理

- [ ] README の認証構成説明を、移行途中の説明ではなく最終構成の説明へ全面的に書き換える。
- [ ] Better Auth の使い方をテンプレート利用者向けにまとめた恒久ドキュメントを追加または更新する。
- [ ] 「どこで `auth.api.getSession` を使うか」「どこで Server Action を使うか」「どこで client の `useSession` を使うか」を明記する。
- [ ] 認証に関する環境変数の役割を README と `.env.example` に揃えて記載する。
- [ ] この計画書の末尾に、各フェーズの実施結果を追記できる進捗欄を追加するか検討する。

### 最初に確定すべき意思決定項目

以下は、実装開始前またはフェーズ 0 の中で必ず確定させる。

- [x] `accessToken` をテンプレートから完全に外す。
- [x] `User.password` を削除し、パスワードハッシュ保存先を `Account.password` のみにする。
- [x] `PasswordReset` / `EmailVerification` を削除し、`Verification` のみを使う。
- [x] サインアップを Better Auth 標準の `signUpEmail` に統一する。
- [x] `AuthService` は残すが、Better Auth を利用するアプリケーションサービスに再定義する。
- [x] セッションの独自拡張は最小限に留め、不要なら `permissions` も `session.user` 側だけに寄せる。

### この計画の完了条件

- Better Auth が認証の唯一の中心になっている。
- 認証関連の独自実装は、テンプレート固有の UI 補助、アプリケーションサービス、helper に限定されている。
- パスワード、メール認証、パスワードリセット、セッション取得の経路が Better Auth 標準 API 中心で説明できる。
- テンプレート利用者が `src/libraries/auth.ts`, 認証ページの Action, README を読むだけで認証構成を理解できる。
- 旧設計を前提とした不要コード、不要テーブル、不要テストが削除されている。
