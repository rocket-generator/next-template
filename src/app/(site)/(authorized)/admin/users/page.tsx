import { Suspense } from "react";
import { User } from "@/models/user";
import { auth } from "@/libraries/auth";
import { UserRepository } from "@/repositories/user_repository";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AuthError from "@/exceptions/auth_error";
import { headers } from "next/headers";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import CRUDTable from "@/components/organisms/DataTable";
import { Plus } from "lucide-react";

type SearchParams = {
  offset?: string;
  limit?: string;
  order?: string;
  direction?: string;
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: SearchParams;
};

export default async function Page(props: Props) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const offset = searchParams.offset ? parseInt(searchParams.offset) : 0;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const order = searchParams.order ? String(searchParams.order) : "name";
  const direction = searchParams.direction
    ? String(searchParams.direction)
    : "asc";

  const tMenu = await getTranslations("AdminMenu");
  const tUser = await getTranslations("Users");
  const tCrud = await getTranslations("Crud");

  let data: { data: User[]; count: number } | null = null;
  try {
    const repository = new UserRepository(session?.access_token);
    data = await repository.get(offset, limit, order, direction);
    console.log(data);
  } catch (error) {
    if (error instanceof AuthError) {
      const heads = await headers();
      const host = heads.get("host");
      const protocol = heads.get("x-forwarded-proto") || "http";
      const pathname = `/admin/users?offset=${offset}&limit=${limit}&order=${order}&direction=${direction}`;
      const fullUrl = `${protocol}://${host}${pathname}`;
      redirect("/auth/signin?callback_url=" + encodeURIComponent(fullUrl));
    }
    console.log(error);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-stone-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <AdminPageHeader
              breadcrumbLinks={[{ href: "/", label: tMenu("home") }]}
              title={tUser("title")}
              buttons={[
                {
                  href: "/admin/users/create",
                  label: tCrud("create"),
                  icon: <Plus className="w-5 h-5" />,
                },
              ]}
            />
            <CRUDTable
              basePath={"/admin/users"}
              count={data?.count || 0}
              offset={offset}
              limit={limit}
              order={order}
              direction={direction}
              data={data?.data || []}
              structure={[
                {
                  name: tUser("name"),
                  key: "name",
                  type: "text",
                  options: {},
                  isSortable: true,
                },
                {
                  name: tUser("email"),
                  key: "email",
                  type: "text",
                  options: {},
                  isSortable: true,
                },
                {
                  name: tUser("permissions"),
                  key: "permissions",
                  type: "array",
                  options: {},
                  isSortable: true,
                },
              ]}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
