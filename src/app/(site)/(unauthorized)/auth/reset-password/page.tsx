import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { redirect } from "next/navigation";

// トークンの検証関数（実際の実装はセキュリティ要件に応じて行う必要があります）
async function validateToken(token: string) {
  // TODO: トークンの有効性を確認する実際のロジックを実装する
  console.log("Validating token:", token);
  return true; // 仮に常に有効とする
}

async function resetPasswordAction(token: string, formData: FormData) {
  "use server";

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    // エラーハンドリング（実際の実装ではより適切な方法を使用してください）
    console.error("Passwords do not match");
    return { error: "パスワードが一致しません" };
  }

  // TODO: ここで実際のパスワードリセット処理を実装する
  console.log("Resetting password for token:", token);

  // パスワードリセットが成功したと仮定してリダイレクト
  redirect("/login?reset=success");
}

export default async function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  const isValidToken = await validateToken(params.token);

  if (!isValidToken) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600">無効なトークン</h1>
        <p className="mt-2 text-gray-600">
          このパスワードリセットリンクは無効または期限切れです。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">新しいパスワードを設定</h1>
        <p className="mt-2 text-gray-600">
          安全な新しいパスワードを入力してください
        </p>
      </div>
      <form
        action={resetPasswordAction.bind(null, params.token)}
        className="mt-8 space-y-6"
      >
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              新しいパスワード
            </Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              新しいパスワード（確認）
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="mt-1"
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          パスワードを更新
        </Button>
      </form>
    </div>
  );
}
