import { Suspense } from "react";
import { auth } from "@/libraries/auth";
import { UserRepository } from "@/repositories/user_repository";
import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataForm from "@/components/organisms/DataForm";
import { notFound } from "next/navigation";
import { User } from "@/models/user";
import { updateUser } from "./actions";
import {
  UserUpdateRequestSchema,
  UserUpdateRequest,
} from "@/requests/admin/user_update_request";
import { redirect } from "next/navigation";

type Props = {
  params: {
    id: string;
  };
};

export default async function Page({ params }: Props) {
  const id = params.id;
  const tMenu = await getTranslations("AdminMenu");
  const tUser = await getTranslations("Users");

  const session = await auth();
  let data: User | null = null;
  try {
    const repository = new UserRepository(session?.access_token);
    data = await repository.getById(id);
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
              breadcrumbLinks={[
                { href: "/admin", label: tMenu("home") },
                { href: "/admin/users", label: tMenu("users") },
              ]}
              title={data.name}
              buttons={[]}
            />
            <DataForm<typeof UserUpdateRequestSchema>
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
            <DataForm
              submitAction={async (data) => {
                "use server";
                await updateUser(id, data);
                return true;
              }}
              structure={structure}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
