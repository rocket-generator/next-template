# Better Auth 基本利用ガイド

## このドキュメントの目的

このドキュメントは、このテンプレートリポジトリにおける Better Auth の使い方、認証関連テーブルの設計思想、アプリケーションコードとの責務分離、今後チームで開発する際の注意点を整理したものである。

対象読者は以下を想定する。

- 新しくこのテンプレートを使い始める開発者
- 認証関連の画面、Server Action、管理画面、DB スキーマを変更する開発者
- Better Auth の責務とアプリ側の責務の境界を確認したい開発者

このドキュメントの主目的は、「認証まわりをどの層で触るべきか」を明確にし、チーム内で実装方針がぶれないようにすることである。

---

## 最初に結論

このテンプレートにおける認証まわりの前提は、まず以下の 7 点を押さえればよい。

1. 認証の主語は Better Auth である。独自認証システムを実装しない。
2. `users` はアプリケーション上のユーザー情報を持つ。パスワードは持たない。
3. `accounts` は認証手段ごとの資格情報を持つ。メール/パスワード認証のハッシュは `accounts.password` にのみ保存する。
4. `sessions` はログイン状態を保持するためのテーブルであり、認可ルールの主データではない。
5. `verifications` はメール認証やパスワードリセットなどの一時トークンを持つ。`users.email_verified` は永続状態であり、役割が異なる。
6. `AuthService` は残すが、認証基盤そのものを実装する場所ではない。Better Auth を使ってアプリ固有のユースケースをまとめる薄いサービスである。
7. 新規実装では `users.password`、独自トークンテーブル、手動セッション構築、独自の認証フローを追加しない。

これ以降の各節は、その理由と運用ルールを詳細に説明する。

---

## 設計思想

### 1. Better Auth を認証の唯一の中心にする

このテンプレートでは、以下の処理は Better Auth が担う前提で設計している。

- サインイン
- サインアップ
- サインアウト
- セッション発行と検証
- メール認証
- パスワードリセット
- パスワード変更
- メールアドレス変更時の認証関連処理

理由は単純で、認証を独自実装すると以下の問題が必ず発生するからである。

- セッションの整合性を自前で維持する必要がある
- パスワードハッシュやトークンの責務が分散する
- Better Auth のアップデート追従が難しくなる
- 新規参加者が「どこが正なのか」を理解しづらくなる

このテンプレートは既存プロダクトではなくテンプレートであり、後方互換や過去実装の救済よりも、「今から読む開発者がすぐ理解できること」を優先する。

### 2. アプリ固有ルールはアプリ側に残す

一方で、認証に関連するすべてのルールを Better Auth に押し込めるわけではない。以下はアプリ側で持つべき責務である。

- `permissions` の初期値
- `isActive` による利用可否のルール
- `language`, `avatarKey` などテンプレート固有のプロフィール情報
- 画面やフォーム都合に合わせたエラーマッピング
- 管理画面からのユーザー作成・編集
- アプリケーション固有の副作用

つまり、認証の仕組みは Better Auth に寄せるが、テンプレート固有の業務ルールはアプリ側で管理する。

### 3. DB の責務分離を明確にする

このテンプレートでは、1 テーブル 1 責務を強く意識する。

- `users` はユーザー本体
- `accounts` は認証手段
- `sessions` はログイン状態
- `verifications` は一時トークン

この分離が崩れると、「どこを更新すればよいか」「どの値を信じればよいか」が曖昧になる。

---

## 全体アーキテクチャ

認証関連の主要な入口は以下である。

| レイヤー | 主なファイル | 役割 |
| --- | --- | --- |
| Better Auth 設定 | `src/libraries/auth.ts` | Better Auth インスタンス定義、Prisma adapter 設定、session helper、route handler export |
| Better Auth API Route | `src/app/api/auth/[...all]/route.ts` | Better Auth の `GET` / `POST` handler をマウント |
| アプリケーションサービス | `src/services/auth_service.ts` | Better Auth を使ったアプリ固有ユースケースの集約 |
| 認証 UI の入口 | `src/app/(site)/(unauthorized)/(auth)/**/actions.ts` | フォーム入力の検証と `AuthService` 呼び出し |
| 画面ガード | `src/libraries/auth.ts`, layout/page | `auth()`, `requireAuthSession()`, `requireAdminSession()` による制御 |
| ユーザー情報取得 | `src/repositories/auth_repository.ts`, `src/repositories/user_repository.ts` | セッションからユーザー ID を引いて業務データを読む |

責務の基本線は以下である。

- 認証 API の正: Better Auth
- DB の正: Prisma schema + Better Auth の model mapping
- アプリ固有の認可・プロフィール・管理画面都合: アプリ側

---

## データベースデザイン

### 現在の設計で重要な考え方

現行の認証テーブル設計は、「認証情報を `User` に抱え込まない」ことを中心に組み立てている。

認証に関わる主要テーブルは以下の 4 つである。

- `users`
- `accounts`
- `sessions`
- `verifications`

### `users` テーブル

`users` はアプリケーション上のユーザー本体である。認証資格情報のテーブルではない。

主なカラム:

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

このテーブルの責務:

- ユーザーの表示名、メールアドレス、権限、言語設定、アクティブ状態などを持つ
- 認証後に画面や業務ロジックが参照する「現在の状態」を持つ

このテーブルに持たせないもの:

- パスワードハッシュ
- メール認証トークン
- パスワードリセットトークン

重要な理解:

- `users.email_verified` は「今このユーザーが認証済みか」という永続状態である
- `users.permissions` はアプリケーションの認可情報であり、セッションテーブルの責務ではない

### `accounts` テーブル

`accounts` は Better Auth が管理する認証手段ごとの資格情報を表す。

主なカラム:

- `user_id`
- `provider_id`
- `account_id`
- `password`
- `access_token`
- `refresh_token`
- `id_token`
- `scope`
- `access_token_expires_at`
- `refresh_token_expires_at`
- `created_at`
- `updated_at`

このテーブルの責務:

- メール/パスワード認証の資格情報を保持する
- 将来 OAuth を追加した場合の外部プロバイダー情報を保持する

このテンプレートで特に重要なルール:

- メール/パスワード認証のハッシュは `accounts.password` にのみ持つ
- `provider_id = "credential"` のレコードが、メール/パスワード認証用の account になる
- `account_id` は現状 `user.id` を使う方針としている

やってはいけないこと:

- `users.password` を復活させること
- `accounts.password` と別の場所にパスワードの正データを持つこと

### `sessions` テーブル

`sessions` は Better Auth が発行するログイン状態を表すテーブルである。

主なカラム:

- `user_id`
- `token`
- `expires_at`
- `ip_address`
- `user_agent`
- `created_at`
- `updated_at`

このテーブルの責務:

- ログイン中であること
- セッションがいつ失効するか
- どのユーザーに紐づくか

このテーブルの責務ではないもの:

- `permissions` の正データ
- アプリケーション固有の認可情報
- API 連携用 Bearer token の保存先

重要なルール:

- 認可判定の根拠は `session.user.permissions` であり、その実体は `users.permissions` から来る
- `sessions` はあくまでログイン状態のコンテナである
- 「セッションに入っているから admin」という設計ではなく、「そのセッションの user が持つ権限が admin」という設計で考える

### `verifications` テーブル

`verifications` は Better Auth が利用する検証用の一時トークンテーブルである。

主なカラム:

- `identifier`
- `token`
- `expires_at`
- `created_at`
- `updated_at`

用途:

- メール認証
- パスワードリセット
- Better Auth が将来追加する検証系フロー

このテーブルの設計上の位置づけ:

- 一時的なフローのためのデータ
- 永続状態の正ではない

やってはいけないこと:

- `email_verifications` のような独自トークンテーブルを再導入すること
- `password_resets` のような独自トークンテーブルを追加すること

---

## `email_verified` と `verifications` の役割分担

ここはチーム内で誤解が起きやすいので、明確に分けて理解すること。

### `users.email_verified`

これは永続状態である。

- ユーザーが現在メール認証済みかどうかを表す
- 画面表示制御やログイン可否判定で利用する
- トークンが消えても状態は残る

### `verifications`

これは一時トークンである。

- メール認証リンク
- パスワードリセットリンク
- 期限付き、使い捨て、進行中フローの情報

### 両者の関係

`verifications` は `email_verified` を置き換えるものではない。

正しい理解は以下である。

- `email_verified` は「結果」
- `verifications` は「その結果に至るための手段」

状態遷移のイメージ:

1. 新規登録直後
   - `users.email_verified = false`
   - `verifications` にメール認証トークンがある
2. ユーザーが認証リンクを踏む
   - `users.email_verified = true`
   - 該当トークンは消えるか失効する
3. パスワードリセット時
   - `users.email_verified` は通常変わらない
   - `verifications` にパスワードリセット用トークンが作られる

したがって、今後の開発で判断を誤らないために、次のルールを守る。

- 現在状態を見るときは `users.email_verified` を見る
- 一時フローを見るときは `verifications` を見る
- 「認証済みかどうか」を `verifications` の有無で判定しない

---

## Better Auth 設定の要点

### `src/libraries/auth.ts` の位置づけ

`src/libraries/auth.ts` は以下だけを持つべきである。

- Better Auth インスタンス定義
- Prisma adapter の mapping
- session/user/account/verification の field mapping
- helper 関数
  - `auth()`
  - `signOut()`
  - `requireAuthSession()`
  - `requireAdminSession()`
  - `buildAppUrl()`
  - `buildHeaders()`
- route handler export 用の `handlers`

逆に、ここに以下を増やしてはいけない。

- ビジネスロジック
- 管理画面都合のユーザー生成処理
- アプリ独自のプロフィール更新ルール
- 独自トークンの CRUD

### 現在の Better Auth 設定で重要な点

#### session

- `nextCookies()` plugin を使っている
- `cookieCache` を有効化している
- セッションは DB に保存する
- 読み取り helper は `auth()` から利用する

#### user

Better Auth の user には、テンプレート固有の追加フィールドを乗せている。

- `permissions`
- `isActive`
- `language`

また、Better Auth の `image` は `avatarKey` に mapping している。

#### account

`password` を含む認証資格情報の正は `account` 側にある。

#### verification

Better Auth の token field は DB の `token` カラムへ mapping されている。

#### emailAndPassword

現在のテンプレートではメール/パスワード認証を有効にしている。

- `hashPassword()` / `verifyPassword()` を利用する
- パスワードリセット時にはメールサービスを通じてリンクを送る
- `ENABLE_EMAIL_VERIFICATION` に応じてメール認証必須かどうかを切り替える

#### emailVerification

`ENABLE_EMAIL_VERIFICATION=true` のときのみ有効化する。

この場合:

- サインアップ時に検証メール送信を行う
- 認証メールのリンク先は `buildAppUrl("/verify-email?...")` で組み立てる

### 環境変数で切り替わる挙動

最低限、以下は認証実装に直接影響する。

| 変数 | 用途 |
| --- | --- |
| `BETTER_AUTH_BASE_URL` | Better Auth が生成する URL の基準 |
| `BETTER_AUTH_SECRET` | Better Auth の secret |
| `AUTH_SECRET` | `BETTER_AUTH_SECRET` 未設定時のフォールバック |
| `ENABLE_EMAIL_VERIFICATION` | サインアップ直後にメール認証を必須にするかどうか |

重要なルール:

- メール本文に埋め込むリンクは `buildAppUrl()` を使う
- `BETTER_AUTH_BASE_URL` が不正だと認証メールやパスワードリセット URL が壊れる

---

## `AuthService` の役割

### `AuthService` を残している理由

`AuthService` は削除していない。理由は、アプリケーション固有のユースケースをひとまとめにするためである。

ただし、これは「独自認証基盤」ではない。

### 現在の `AuthService` が担う責務

以下は `AuthService` に置いてよい。

- サインイン時の `isActive` 事前チェック
- Better Auth 例外の UI 向け分類
- サインアップ時の初期値付与
- メール認証の再送や結果整形
- パスワード再設定のユースケース呼び出し
- プロフィール更新時のアプリ固有分岐
- 管理画面からのユーザー作成・更新

### `AuthService` が担ってはいけない責務

以下は Better Auth 側に任せる。

- パスワード検証アルゴリズムの主制御
- セッション発行
- セッション検証
- メール認証トークンの保存・検証
- パスワードリセットトークンの保存・検証

### 設計上の見方

`AuthService` は「認証エンジン」ではなく、以下のように理解するとよい。

- Better Auth を呼び出すアプリケーションサービス
- 画面層が直接持つと散らばるルールをまとめる場所
- フォームのための結果整形を行う場所

---

## 認証関連 API の使い分け

### 1. セッションを読むだけなら `auth()`

`auth()` は、現在のリクエストのセッションを取得するための薄い helper である。

使いどころ:

- layout や page で現在ユーザーを確認したい
- Server Action の中で現在ログインユーザー ID を知りたい

例:

```ts
const session = await auth({ disableRefresh: true });
if (!session?.user?.id) {
  // 未ログイン
}
```

原則:

- 読み取り専用なら `disableRefresh: true` を優先する
- `auth()` の戻り値は「最小限の session 情報」である前提で使う
- 新規実装で `accessToken` や `sessionToken` を期待しない

### 2. ログイン必須なら `requireAuthSession()`

未ログインなら `/signin` にリダイレクトしたい場所では、`requireAuthSession()` を使う。

使いどころ:

- 認証必須の layout
- 認証必須の page

例:

```ts
const session = await requireAuthSession();
```

### 3. 管理者必須なら `requireAdminSession()`

admin 権限が必須の画面では `requireAdminSession()` を使う。

使いどころ:

- `/admin/**` の layout
- 管理画面の上位入口

この helper は、未ログインは `/signin`、ログイン済みだが権限不足なら `notFound()` という現在の方針を吸収する。

### 4. サインアウトは `signOut()`

サインアウトの cookie 処理や Better Auth API 呼び出しは helper 経由で行う。

### 5. 認証フローの実行は `betterAuthHandler.api.*` を基礎にする

サインイン、サインアップ、メール認証、パスワードリセット、パスワード変更などは Better Auth API を呼ぶ。

現在の実装例:

- `signInEmail`
- `signUpEmail`
- `verifyEmail`
- `sendVerificationEmail`
- `requestPasswordReset`
- `resetPassword`
- `changePassword`
- `updateUser`
- `changeEmail`

新規実装のルール:

- 認証フローの主体は `betterAuthHandler.api.*`
- アプリ側都合の前処理・後処理だけ `AuthService` に置く

---

## 新規開発時の実装ルール

### ルール 1. 認証必須の画面では middleware を主認可にしない

Better Auth のドキュメントでも、middleware では cookie の存在確認程度にとどめ、実際の保護は各 page/layout/server action 側で行うことが推奨されている。

このテンプレートでも、保護は以下で行う前提である。

- layout
- page
- server action

理由:

- middleware は DB や完全な session 検証に向かない
- cookie があるだけでは正当なセッションと限らない

### ルール 2. サインイン成功判定に「直後の `auth()` 再取得」を使わない

歴史的に、サインイン直後に同一リクエスト内で `auth()` を再取得して成否判定すると、cookie 反映やタイミングの都合で不安定になることがある。

そのため、サインイン成功は Better Auth API 呼び出し自体の成功/失敗で判定する。

やること:

- `signInEmail` の成功を success とする
- 必要な UI 状態だけ `AuthService` で返す

やってはいけないこと:

- `signInEmail` の直後に `auth()` を必須前提で呼び直し、そこが `null` なら失敗扱いにすること

### ルール 3. メールアドレス変更は原則 Better Auth 経由

プロフィール更新でメールアドレスが変わる場合、認証フローに関わるため、原則は Better Auth の `changeEmail` を使う。

例外:

- `ENABLE_EMAIL_VERIFICATION=false` のときは、現在実装では Prisma 直接更新を許している

この分岐はアプリの挙動ポリシーであり、新規実装でも勝手に別ルールを増やさないこと。

### ルール 4. 管理画面や seed でユーザーを直作成するときは `User` と `Account` を同時に作る

サインアップ画面以外からユーザーを作成する場合、`users` だけ作って終わりにしてはいけない。

必須条件:

- `users` を作る
- `accounts` に credential account を作る
- 可能なら transaction で一体として作る

現在の実装では `AuthService.createUser()` がこの責務を持つ。

同様に、管理画面でパスワード更新を許す場合も `accounts.password` を更新する必要がある。現在は `AuthService.updateUser()` が `account.upsert()` を行っている。

### ルール 5. 認証に使うメールアドレスは正規化して扱う

このテンプレートでは、メールアドレスは lowercase 化して保存する前提で扱っている。

理由:

- 一意制約と検索の整合性を保つため
- `Admin` 画面や seed での作成と通常サインアップで挙動を揃えるため

### ルール 6. 認証系のリンクはアプリ URL helper 経由で組み立てる

メール認証リンクやパスワードリセットリンクは `buildAppUrl()` を使って生成する。

やってはいけないこと:

- 文字列連結でホスト名を直書きする
- `window.location.origin` 依存でサーバー側メール URL を作る

### ルール 7. `users` を認証テーブルとして扱わない

新規開発で `users` に以下を追加してはいけない。

- `password`
- reset token
- verification token
- セッション固有情報

必要なら、それが本当に `users` の責務かをまず疑うこと。

### ルール 8. `sessions` に認可情報を寄せすぎない

今後、「高速化のために `permissions` を session table に複製したい」という誘惑が出る可能性がある。しかし、テンプレートの基準設計としては避ける。

理由:

- 正データがどちらか曖昧になる
- 更新漏れのリスクが出る
- セッション失効と認可変更が別軸の問題であるにもかかわらず、実装上は結合してしまう

認可の正は `users.permissions` と考える。

---

## 典型ユースケースごとの正しい実装

### サインイン画面を作る・直すとき

推奨フロー:

1. Server Action で入力を Zod で検証する
2. `AuthService.signIn()` を呼ぶ
3. `AuthService` 内で必要なら `isActive` などを確認する
4. `betterAuthHandler.api.signInEmail()` を呼ぶ
5. 画面向けの結果だけ返す

守るべきこと:

- パスワード照合を独自に書かない
- DB を直接読んでセッションを手組みしない

### サインアップ画面を作る・直すとき

推奨フロー:

1. 入力検証
2. `AuthService.signUp()`
3. `betterAuthHandler.api.signUpEmail()` 呼び出し
4. `ENABLE_EMAIL_VERIFICATION` に応じて分岐

守るべきこと:

- `users` を直接 insert してサインアップ処理を再実装しない

### メール認証画面を作る・直すとき

推奨フロー:

1. `verifyEmail(token)` を Better Auth 経由で実行
2. UI 向け message / code だけ整形する

守るべきこと:

- `verifications` を独自に直接読むロジックを画面層に書かない
- `users.email_verified` を画面から手動更新しない

### パスワードリセットを作る・直すとき

推奨フロー:

1. リセット要求は `requestPasswordReset`
2. リセット実行は `resetPassword`
3. メール送信は `auth.ts` の Better Auth 設定で hook する

守るべきこと:

- 独自 reset token を発行しない
- `password_resets` テーブルを再導入しない

### パスワード変更機能を作る・直すとき

推奨フロー:

1. ログイン済みセッションを確認
2. `AuthService.changePassword()`
3. `betterAuthHandler.api.changePassword()`

守るべきこと:

- `accounts.password` を画面層から直接更新しない
- 現在パスワード照合を独自実装しない

### 管理画面からユーザーを作るとき

推奨フロー:

1. `AuthService.createUser()` を使う
2. `users` と `accounts` を transaction で作る
3. パスワードは `hashPassword()` でハッシュ化する

守るべきこと:

- `users` だけ作らない
- 生パスワードを保存しない

### 管理画面からユーザー情報を更新するとき

推奨フロー:

1. `AuthService.updateUser()` を使う
2. ユーザー基本情報は `users`
3. パスワード更新がある場合のみ `accounts.password` を upsert

守るべきこと:

- `users` に password を追加しない

---

## 新しいフィールドやプロバイダーを追加するときの考え方

### `User` にフィールドを追加するとき

追加先が `users` で正しいのは、以下の条件を満たすときである。

- アプリケーション上の永続プロフィールである
- 認証資格情報ではない
- セッションや一時トークンではない

例:

- `timezone`
- `displayName`
- `profileCompleted`

追加時に確認すべき場所:

- `prisma/schema.prisma`
- `src/libraries/auth.ts` の `user.additionalFields` が必要か
- `src/models/user.ts`
- repository / request schema / tests / seed

### OAuth プロバイダーを追加するとき

OAuth 追加時に認証情報の保存先は `accounts` である。

考え方:

- provider 固有 token は `accounts` に入る
- `users` はプロファイルと権限だけを持つ
- 1 人の `User` が複数の `Account` を持ちうる

やってはいけないこと:

- provider ごとの token を `users` に生やすこと

### 新しい認証フローを追加するとき

まず確認すること:

1. Better Auth 標準 API / plugin で実現できないか
2. 一時トークンは `verifications` に乗るべきか
3. アプリ側に残るのは本当に業務ルールだけか

独自実装を足す前に、必ずこの順で検討すること。

---

## 既存コードに残る歴史的な痕跡について

現在のコードベースには、整理しきれていない過去設計の痕跡が一部残っている可能性がある。代表例として、型定義側に以下のような「今後の新規実装では前提にしない情報」が含まれていることがある。

- `AuthSchema.password`
- `AppSession.accessToken`
- `AppSession.sessionToken`

チームの共通認識として重要なのは、以下である。

- 新しい実装ではこれらを前提にしない
- 実際の DB 設計と Better Auth の責務を正とする
- 残存する互換用・整理途中の型に引っ張られない

もし新規実装中に「この field は本当に今も必要か」と迷った場合は、まず `prisma/schema.prisma` と `src/libraries/auth.ts` を確認すること。

---

## やってはいけないこと一覧

以下は、このテンプレートの認証設計を壊しやすい代表例である。新規開発では避けること。

- `users.password` を追加する
- 独自の `password_resets` テーブルを作る
- 独自の `email_verifications` テーブルを作る
- サインイン時に独自の session token を発行する
- `sessions` に認可情報を大量に複製する
- middleware の cookie 有無だけで本認可を完結させる
- サインイン成功判定に `auth()` の即時再取得を使う
- 画面や Server Action から `accounts.password` を直接更新する
- 生パスワードを seed や管理画面ロジックで保存する
- メール認証状態を `verifications` の有無だけで判断する
- Better Auth で扱うべき処理を Prisma 直接操作で置き換える

---

## スキーマ変更時のチェックリスト

認証関連の DB やモデルを変更するときは、最低限以下を確認すること。

- [ ] `prisma/schema.prisma` を更新したか
- [ ] `src/libraries/auth.ts` の model/field mapping を更新したか
- [ ] `src/models/user.ts` などアプリモデルを更新したか
- [ ] seed データを更新したか
- [ ] 管理画面の create/update フローへの影響を確認したか
- [ ] 認証画面の Action への影響を確認したか
- [ ] テスト fixture と mock を更新したか
- [ ] ドキュメントを更新したか

特に、認証周りでは「DB の変更だけ」「フロントの変更だけ」で済むことはほぼない。少なくとも `schema.prisma`、`auth.ts`、Action、test の 4 か所は連動して見るべきである。

---

## テストとデバッグの観点

### テストで意識するポイント

- サインイン成功/失敗
- メール未認証時の分岐
- `isActive=false` のユーザーの拒否
- パスワード変更時の現在パスワード誤り
- 管理画面でのユーザー作成時に `accounts` も作られること
- メール認証とパスワードリセットの結果整形

### 不具合調査時の優先確認ポイント

#### ログインできない

確認順:

1. `users.is_active`
2. `users.email_verified`
3. `accounts` に credential account があるか
4. `accounts.password` が正しくハッシュ化されているか
5. Better Auth 設定の `ENABLE_EMAIL_VERIFICATION` が意図通りか

#### メール認証リンクが壊れている

確認順:

1. `BETTER_AUTH_BASE_URL`
2. `buildAppUrl()` が使われているか
3. メール送信プロバイダー設定

#### パスワード再設定メールが飛ばない

確認順:

1. `auth.ts` の `sendResetPassword` hook
2. `EmailService` の実装
3. メールプロバイダー設定

#### 管理画面で作成したユーザーがログインできない

確認順:

1. `users` は作られているか
2. `accounts` の credential row があるか
3. `password` がハッシュ済みか
4. `email_verified` が期待値か

---

## チーム向けの実務ルール

最後に、日常開発で迷わないための運用ルールを短くまとめる。

- 認証フローを触る前に、まず Better Auth で解決できるかを確認する
- DB を見るときは、`users` と `accounts` と `sessions` と `verifications` の責務を混同しない
- 認証の現在状態は `users`、一時トークンは `verifications` と覚える
- 新しい認証画面は「入力検証 → `AuthService` → Better Auth API」の流れで作る
- 画面保護は middleware ではなく page/layout/action で行う
- 管理画面や seed のユーザー作成では `User` と `Account` を必ずセットで扱う
- 迷ったら `prisma/schema.prisma` と `src/libraries/auth.ts` を先に見る

このテンプレートにおける認証設計のゴールは、「高度な抽象化」ではなく「正しさがわかりやすいこと」である。新しいコードを書くときは、便利さよりも責務の明確さを優先すること。
