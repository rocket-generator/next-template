# 設定の更新

## 1. セキュリティ -> パスワード 二タイトルを変更

/settings では、3つのタブがあり、「プロフィール」「セキュリティ」「アバター画像」となっているが、2つめのタブのタイトルを「パスワード」に変更する。

## 2. バター画像設定機能を非表示をデフォルトに

/settings では、3つのタブがあり、「プロフィール」「セキュリティ」「アバター画像」となっているが、3つめのタブをデフォルトでは非表示にする。環境変数でENABLE_AVATAR_SETTING を true にすると表示されるようにする。




---

## 実装計画（追記）

### 背景
- 現在の `/settings` は「プロフィール / セキュリティ / アバター画像」の3タブ構成だが、要件として「セキュリティ」タブの名称を「パスワード」へ変更する必要がある。
- 「アバター画像」タブはデフォルトで非表示とし、環境変数 `ENABLE_AVATAR_SETTING=true` のときのみ表示させたい。

### 方針とその理由
- 設定画面は `src/app/(site)/(authorized)/(app)/settings/page.tsx` に集約されているため、UIの表示切り替えはこのサーバーコンポーネント内で完結させる。
  - 理由: サーバー側で分岐させることで、未使用のタブ/コンポーネント表示を確実に抑止でき、表示条件も単一箇所で管理できる。
- 文言変更は i18n メッセージ (`messages/ja.json`, `messages/en.json`) を更新し、既存のキー構造を壊さず新しいキーを追加して呼び出し側を差し替える。
  - 理由: 既存キーの突然の削除は他画面への影響リスクがあるため、段階的な移行にする。
- タブのレイアウトは、表示タブ数に応じて `grid-cols-2` / `grid-cols-3` を切り替える。
  - 理由: タブを非表示にした際の空白や崩れを防ぎ、UIの一貫性を保つ。
- 環境変数の追加は `.env.example` に明示し、実運用の設定漏れを防ぐ。

### 具体的なタスク
- [ ] 既存実装の確認
- [ ] `src/app/(site)/(authorized)/(app)/settings/page.tsx` の構成を再確認し、どこでタブを生成しているか把握する
- [ ] `messages/ja.json` / `messages/en.json` の `Settings` セクションに既存キーと使用箇所がないか確認する
- [ ] `.env.example` の環境変数一覧に追記すべき項目を洗い出す

- [ ] UI文言の変更（「セキュリティ」→「パスワード」）
- [ ] `messages/ja.json` に `Settings.password` を追加（例: "パスワード"）
- [ ] `messages/en.json` に `Settings.password` を追加（例: "Password"）
- [ ] `src/app/(site)/(authorized)/(app)/settings/page.tsx` のタブラベル/見出しを `tSettings("password")` に差し替える
- [ ] 既存の `Settings.security` は互換性確保のため残す（削除はしない）

- [ ] アバタータブの表示制御
- [ ] `const showAvatarSetting = process.env.ENABLE_AVATAR_SETTING === "true";` を `SettingsPage` 内で定義する
- [ ] `TabsList` の列数を `showAvatarSetting` に応じて `grid-cols-2` / `grid-cols-3` に切り替える
- [ ] `TabsTrigger`（アバター）と `TabsContent`（アバター）を `showAvatarSetting` で条件レンダリングする

- [ ] 環境変数の追加
- [ ] `.env.example` に `ENABLE_AVATAR_SETTING=false` を追記し、用途をコメントで明記する

- [ ] 動作確認
- [ ] `ENABLE_AVATAR_SETTING` 未設定/`false` で `/settings` を開き、「アバター画像」タブが非表示であることを確認
- [ ] `ENABLE_AVATAR_SETTING=true` で `/settings` を開き、「アバター画像」タブが表示されることを確認
- [ ] 「パスワード」タブの文言が日本語/英語ともに正しく表示されることを確認

---

## 進捗（完了タスク）

- [x] `src/app/(site)/(authorized)/(app)/settings/page.tsx` の構成を再確認し、どこでタブを生成しているか把握する
- [x] `messages/ja.json` / `messages/en.json` の `Settings` セクションに既存キーと使用箇所がないか確認する
- [x] `.env.example` の環境変数一覧に追記すべき項目を洗い出す
- [x] `messages/ja.json` に `Settings.password` を追加（例: "パスワード"）
- [x] `messages/en.json` に `Settings.password` を追加（例: "Password"）
- [x] `src/app/(site)/(authorized)/(app)/settings/page.tsx` のタブラベル/見出しを `tSettings("password")` に差し替える
- [x] 既存の `Settings.security` は互換性確保のため残す（削除はしない）
- [x] `const showAvatarSetting = process.env.ENABLE_AVATAR_SETTING === "true";` を `SettingsPage` 内で定義する
- [x] `TabsList` の列数を `showAvatarSetting` に応じて `grid-cols-2` / `grid-cols-3` に切り替える
- [x] `TabsTrigger`（アバター）と `TabsContent`（アバター）を `showAvatarSetting` で条件レンダリングする
- [x] `.env.example` に `ENABLE_AVATAR_SETTING=false` を追記し、用途をコメントで明記する
