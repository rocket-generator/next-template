# フォームのエラーメッセージを国際化対応する

/signin など、Auth関係のページのフォームのエラーメッセージが英語のまま出る。
例えばパスワードを間違えたとき、「Password must be made of at least 8 characters」などと出る場合がある。

これはおそらく、FormのValidationが国際化対応正しくされていないからと思われる。
他のページを含め、フォームのエラーメッセージが国際化対応されていないところをさがして、対応してください。


## 追加: 実装計画（2026-01-24）

### 背景
- /signin・/forgot-password などの Auth 系フォームで、Zod のバリデーションメッセージが英語固定のまま表示されている。
- 一部フォームは i18n 済み（/signup・/reset-password・PasswordChangeForm）だが、同じ設計が他のフォームに適用されていない。
- 管理画面の DataForm では必須エラーが日本語固定で、言語切替に追従しない。
- Profile 更新のサーバー側バリデーションでは、メッセージが英語文字列のまま返る箇所があり、Settings 画面の翻訳キーと整合していない。

### 方針とその理由
- **Zod スキーマは「翻訳関数を渡して生成するファクトリ」形式に統一**し、UI 側では `useTranslations` で生成したスキーマを使う。これにより同じ制約を保ったまま言語差分だけ差し替えられる。
- **サーバー側バリデーションは「翻訳キーを返す」**方針を維持する（現行の Settings 画面の設計と整合）。UI で `tSettings("validation.${key}")` できるようにするため。
- **既存の翻訳キーを優先利用**し、不足しているキーだけ追加する。新しいキー追加は最小化し、翻訳コストと影響範囲を抑える。
- **DataForm の必須エラーは翻訳可能な共通メッセージに置き換える**（`{field}` 置換を利用）。管理画面全体の i18n をまとめて改善できる。

### 具体的なタスク
- [ ] 現状調査: `src/components/organisms/*Form` と `src/requests/*` を走査し、英語固定 or 日本語固定のバリデーションメッセージ発生箇所を棚卸し（対象候補: `signin_request.ts` / `forgot_password_request.ts` / `profile_update_request.ts` / `components/organisms/DataForm`）。
- [ ] 翻訳キー整備: `messages/ja.json` / `messages/en.json` に不足キーを追加（例: `Components.DataForm.validation.required`, `Settings.validation.name_min_length`, `Settings.validation.name_max_length`, `Settings.validation.email_required`, `Settings.validation.email_invalid` など）。
- [ ] Sign-in 用スキーマ整備: `src/requests/signin_request.ts` を「`createSignInRequestSchema(t)` 形式」に変更し、既存の `SignInRequestSchema` は英語フォールバックで維持。パスワード最小長の制約値とメッセージの矛盾があれば合わせて修正。
- [ ] Forgot-password 用スキーマ整備: `src/requests/forgot_password_request.ts` を「`createForgotPasswordRequestSchema(t)` 形式」に変更し、既存の `ForgotPasswordRequestSchema` は英語フォールバックで維持。
- [ ] プロフィール更新スキーマ調整: `src/requests/profile_update_request.ts` のエラーメッセージを翻訳キーに統一し、Settings 画面で `tSettings("validation.${key}")` が成立するようにする。
- [ ] フォーム側のスキーマ差し替え: `AuthSigninForm` / `AuthForgotPasswordForm` で `useTranslations("Auth")` を使ったスキーマ生成（`useMemo`）に切り替え、`zodResolver` を差し替える。
- [ ] DataForm の必須エラー i18n 化: `src/components/organisms/DataForm/index.tsx` の `rules.required` と表示文を `t("validation.required", { field: field.name })` 等に置き換え、言語切替に追従させる。
- [ ] 影響確認: 既存の i18n 済みフォーム（/signup, /reset-password, PasswordChangeForm）に影響がないか動作確認。特に `Auth.validation` キーの再利用でメッセージが意図通り表示されるか確認。
- [ ] 動作確認シナリオ: 日本語/英語それぞれで、
  - [ ] /signin で未入力・形式不正・短すぎるパスワードのエラー文言が翻訳されること
  - [ ] /forgot-password でメール形式エラーが翻訳されること
  - [ ] /settings のプロフィール更新で name/email のエラーが翻訳されること
  - [ ] /admin/users の新規作成・編集で必須エラーが翻訳されること
