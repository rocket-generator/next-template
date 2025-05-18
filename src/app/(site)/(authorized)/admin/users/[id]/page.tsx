import { Suspense } from "react";
import { UserRepository } from "@/repositories/user_repository";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataView from "@/components/organisms/DataView";
import { notFound } from "next/navigation";
import { User } from "@/models/user";
import { deleteUser } from "./actions";
import { Pencil, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const id = (await params).id;

  let data: User | null = null;
  try {
    const repository = new UserRepository();
    data = await repository.findById(id);
  } catch (error) {
    console.log(error);
    return notFound();
  }

  const tMenu = await getTranslations("Menu.Admin");
  const tUser = await getTranslations("Users");
  const tCrud = await getTranslations("Crud");
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-stone-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <AdminPageHeader
              breadcrumbLinks={[
                { href: "/admin/dashboard", label: tMenu("dashboard") },
                { href: "/admin/users", label: tMenu("users") },
              ]}
              title={data.name}
              buttons={[
                {
                  href: `/admin/users/${id}/edit`,
                  label: tCrud("edit"),
                  icon: <Pencil className="w-5 h-5" />,
                },
                {
                  action: async () => {
                    "use server";
                    await deleteUser(id);
                    redirect("/admin/users");
                  },
                  label: tCrud("delete"),
                  variant: "danger",
                  icon: <Trash2 className="w-5 h-5" />,
                },
              ]}
            />
            <DataView
              data={data}
              structure={[
                {
                  name: tUser("name"),
                  key: "name",
                  type: "text",
                  options: {},
                },
                {
                  name: tUser("email"),
                  key: "email",
                  type: "text",
                  options: {},
                },
                {
                  name: tUser("permissions"),
                  key: "permissions",
                  type: "array",
                  options: {},
                },
              ]}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
