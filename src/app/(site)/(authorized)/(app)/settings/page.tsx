import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "./actions";
import AppPageHeader from "@/components/molecules/AppPageHeader";
import { ProfileForm } from "@/components/organisms/ProfileForm";
import { PasswordChangeForm } from "@/components/organisms/PasswordChangeForm";
import { AvatarUpload } from "@/components/organisms/AvatarUpload";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const tSettings = await getTranslations("Settings");
  const tMenu = await getTranslations("Menu.App");

  // 現在のユーザー情報を取得
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const breadcrumbLinks = [
    { href: "/dashboard", label: tMenu("dashboard") },
    { href: "/settings", label: tSettings("title") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <AppPageHeader
        title={tSettings("title")}
        breadcrumbLinks={breadcrumbLinks}
      />

      <main className="mx-auto max-w-4xl px-4 pb-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">{tSettings("profile")}</TabsTrigger>
            <TabsTrigger value="security">{tSettings("security")}</TabsTrigger>
            <TabsTrigger value="avatar">{tSettings("avatar")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">
                {tSettings("profile")}
              </h2>
              <ProfileForm initialName={user.name} initialEmail={user.email} />
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">
                {tSettings("security")}
              </h2>
              <PasswordChangeForm />
            </div>
          </TabsContent>

          <TabsContent value="avatar" className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-gray-900">
                {tSettings("avatar")}
              </h2>
              <AvatarUpload
                initialAvatarUrl={user.avatarUrl}
                userName={user.name}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
