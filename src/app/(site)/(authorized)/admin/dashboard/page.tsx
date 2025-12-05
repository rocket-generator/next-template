import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("admin_dashboard.title"),
    description: t("admin_dashboard.description"),
  });
}

const Page = () => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">ユーザー管理</h1>
      <p className="text-gray-600">ユーザーの一覧と管理を行います。</p>
    </div>
  );
};

export default Page;
