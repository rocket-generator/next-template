import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/libraries/metadata";

export async function generateMetadata() {
  const t = await getTranslations("Meta");
  return createMetadata({
    title: t("dashboard.title"),
    description: t("dashboard.description"),
  });
}

export default function Page() {
  return <div>Dashboard</div>;
}
