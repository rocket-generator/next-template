import { Suspense } from "react";
import { UserRepository } from "@/repositories/user_repository";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataForm from "@/components/organisms/DataForm";
import { notFound } from "next/navigation";
import { User } from "@/models/user";
import { updateUser } from "./actions";
import { UserUpdateRequest } from "@/requests/admin/user_update_request";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const id = (await params).id;
  const tMenu = await getTranslations("Menu.Admin");
  const tUser = await getTranslations("Users");

  let data: User | null = null;
  try {
    const repository = new UserRepository();
    data = await repository.findById(id);
  } catch (error) {
    console.log(error);
    return notFound();
  }

  const structure = [
    {
      name: tUser("name"),
      key: "name",
      type: "text",
      value: data.name,
      required: true,
      placeholder: tUser("name"),
    },
    {
      name: tUser("email"),
      key: "email",
      type: "text",
      value: data.email,
      required: true,
      placeholder: tUser("email"),
    },
    {
      name: tUser("password"),
      key: "password",
      type: "password",
      value: "",
      required: false,
      placeholder: tUser("password_placeholder"),
    },
    {
      name: tUser("permissions"),
      key: "permissions",
      type: "checkbox_multi",
      value: data.permissions,
      required: true,
      placeholder: tUser("permissions"),
      options: {
        options: [{ name: "Admin", value: "admin" }],
      },
    },
  ];

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
              buttons={[]}
            />
            <DataForm<UserUpdateRequest>
              structure={structure}
              submitAction={async (data) => {
                "use server";
                const success = await updateUser(id, data);
                if (success) {
                  redirect(`/admin/users/${id}`);
                }
                return false;
              }}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
