import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import Link from "next/link";
import { redirect } from "next/navigation";

async function forgotPasswordAction(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;

  // TODO: ここで実際のパスワードリセットメール送信処理を実装する
  console.log("Password reset requested for:", email);

  // メール送信が成功したと仮定してリダイレクト
  redirect("/forgot-password/confirmation");
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8 p-10 bg-white rounded-xl shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">パスワードをお忘れですか？</h1>
        <p className="mt-2 text-gray-600">
          パスワードリセットのリンクをメールで送信します
        </p>
      </div>
      <form action={forgotPasswordAction} className="mt-8 space-y-6">
        <div className="space-y-4">
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
        </div>

        <Button type="submit" className="w-full">
          パスワードリセットリンクを送信
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          パスワードを思い出した場合は{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            ログイン
          </Link>{" "}
          してください
        </p>
      </div>
    </div>
  );
}
