# サイドバーのユーザーメニューに「管理画面」を追加する

ユーザーが「admin」というpermissionを持っている場合、各ページのサイドバーにあるユーザー名をクリックした時のメニューで、「設定」の次に「管理画面」というリンクをつける。リンクを選択すると、「/admin/dashboard」に遷移する。

## 背景
- サイドバーのユーザーメニューには現在「設定」「ログアウト」のみが並び、管理権限を持つユーザーが管理画面へ遷移する導線が存在しない。
- 管理画面配下 (`/admin/*`) は `src/app/(site)/(authorized)/admin/layout.tsx` で `admin` 権限を必須としており、メニュー追加は UI 導線の補完が主目的。
- 権限情報は `src/app/(site)/(authorized)/(app)/layout.tsx` で取得した `UserRepository.getMe()` の `permissions` 配列を `AppSidebar` に渡しているため、追加実装はクライアント側のドロップダウンに限定できる。

## 方針とその理由
- `signInUser?.permissions` を用いてクライアント側で権限判定し、`admin` を含むときのみドロップダウンに「管理画面」を追加する。追加の API 呼び出しを避け、既存のセッション情報を再利用するため。
- ドロップダウンの並び順は要求通り「設定」の直後に「管理画面」を配置し、その後に「ログアウト」を残す。既存ユーザー体験を崩さず、管理者が最短で到達できる位置に置くため。
- ラベルは i18n で管理し、`messages/ja.json` と `messages/en.json` に新規キー（例：`Common.admin_console`）を追加する。ハードコードを避け、UI 文言を一元管理するため。
- 既存のコンポーネントテスト（`__tests__/components/organisms/AppSidebar.test.tsx`）を拡張し、権限の有無で表示が切り替わることと `/admin/dashboard` へ遷移することを担保する。回帰を防ぎ、将来のリファクタでも意図を保つため。
- Storybook のサンプルも更新し、管理者・非管理者の両パターンを可視化する。UI レビュー時に差分を確認しやすくするため。

## 具体的なタスク
- [x] 現状調査: `src/components/organisms/AppSidebar/index.tsx` のドロップダウン構造と `SidebarMenuButton` のレンダリング順、`signInUser` の型 (`src/models/user.ts`) を再確認し、権限情報が確実に受け渡されていることを整理する。
- [x] 文言定義: `messages/ja.json` / `messages/en.json` に `Common.admin_console`（ja: "管理画面", en: "Admin Console"）を追加し、既存の Mock 翻訳（AppSidebar テストの `useTranslations` モック）にも同キーを追加する。
- [x] UI実装: `AppSidebar` のドロップダウンに管理者専用項目を追加する。`hasAdminPermission = Array.isArray(signInUser?.permissions) && signInUser.permissions.includes("admin")` を判定し、`DropdownMenuItem` を「設定」の直後に条件付きで描画、クリック時に `router.push("/admin/dashboard")` する。表示テキストは新規翻訳キーを使用。
- [x] テスト拡張: `__tests__/components/organisms/AppSidebar.test.tsx` に管理者ユーザーのシナリオを追加し、(1) admin 権限で「管理画面」が表示される、(2) 非管理者では表示されない、(3) クリックで `/admin/dashboard` に push される、を検証する。必要に応じてモックの permission 値や翻訳値を調整。
- [x] Storybook更新: `src/components/organisms/AppSidebar/AppSidebar.stories.tsx` に管理者用の Story を追加するか、既存ストーリーに `permissions: ["admin"]` の例を足して表示確認できるようにする。
- [x] 動作確認: `npm test -- __tests__/components/organisms/AppSidebar.test.tsx` を実行しテストを通す。必要なら `npm run lint` を補完で実行し、開発環境で実際にログイン後のサイドバーから `/admin/dashboard` へ遷移できることを目視確認する。
