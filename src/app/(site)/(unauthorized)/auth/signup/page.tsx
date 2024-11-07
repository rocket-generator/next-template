import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import Link from "next/link";
import { redirect } from "next/navigation";

async function signupAction(formData: FormData) {
  "use server";

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // TODO: ここで実際の新規登録処理を実装する
  console.log("Signup attempt:", name, email, password);

  // パスワードの一致確認
  if (password !== confirmPassword) {
    // エラーハンドリング（実際の実装ではより適切な方法を使用してください）
    console.error("Passwords do not match");
    return;
  }

  // 登録が成功したと仮定してリダイレクト
  redirect("/dashboard");
}

export default function SignupPage() {
  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">新規登録</h1>
        <p className="mt-2 text-gray-600">アカウントを作成してください</p>
      </div>
      <form action={signupAction} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              名前
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="mt-1"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <Label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              メールアドレス
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <Label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              パスワード
            </Label>
            <Input
              id="password"
              name="password"
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
              パスワード（確認）
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
          登録
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
