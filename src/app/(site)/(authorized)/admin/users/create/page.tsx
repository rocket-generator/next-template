import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataForm from "@/components/organisms/DataForm";
import { User } from "@/models/user";
import { createUser } from "./actions";
import { redirect } from "next/navigation";
import {
  UserCreateRequestSchema,
  UserCreateRequest,
} from "@/requests/admin/user_create_request";

export default async function Page() {
  const tMenu = await getTranslations("AdminMenu");
  const tUser = await getTranslations("Users");
  const data: User = {
    id: "",
    name: "",
    email: "",
    permissions: [],
  };

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
      placeholder: tUser("password"),
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
              breadcrumbLinks={[{ href: "/admin", label: tMenu("home") }]}
              title="新規ユーザー作成"
              buttons={[]}
            />
            <DataForm<typeof UserCreateRequestSchema>
              structure={structure}
              submitAction={async (data) => {
                "use server";
                const id = await createUser(data);
                if (id) {
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
