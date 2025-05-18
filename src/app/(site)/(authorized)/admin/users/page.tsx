import { Suspense } from "react";
import { User } from "@/models/user";
import { UserRepository } from "@/repositories/user_repository";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AuthError from "@/exceptions/auth_error";
import { headers } from "next/headers";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataTable from "@/components/organisms/DataTable";
import { Plus } from "lucide-react";
import DataTableSkeleton from "@/components/molecules/DataTableSkeleton";

type SearchParams = {
  offset?: string;
  limit?: string;
  order?: string;
  direction?: string;
  query?: string;
  [key: string]: string | string[] | undefined;
};

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const offset = searchParams.offset ? parseInt(searchParams.offset) : 0;
  const limit = searchParams.limit ? parseInt(searchParams.limit) : 20;
  const order = searchParams.order ? String(searchParams.order) : "name";
  const direction = searchParams.direction
    ? String(searchParams.direction)
    : "asc";
  const query = searchParams.query ? String(searchParams.query) : "";

  const tMenu = await getTranslations("Menu.Admin");
  const tUser = await getTranslations("Users");
  const tCrud = await getTranslations("Crud");

  let data: { data: User[]; count: number } | null = null;
  try {
    const repository = new UserRepository();
    data = await repository.get(offset, limit, order, direction, query);
  } catch (error) {
    if (error instanceof AuthError) {
      const heads = await headers();
      const host = await heads.get("host");
      const protocol = (await heads.get("x-forwarded-proto")) || "http";
      const pathname = `/admin/users?offset=${offset}&limit=${limit}&order=${order}&direction=${direction}&query=${query}`;
      const fullUrl = `${protocol}://${host}${pathname}`;
      redirect("/auth/signin?callback_url=" + encodeURIComponent(fullUrl));
    }
    console.log(error);
  }
  const structure = [
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
  ];

  return (
    <Suspense fallback={<DataTableSkeleton columnCount={structure.length} />}>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-stone-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <AdminPageHeader
              breadcrumbLinks={[
                { href: "/admin/dashboard", label: tMenu("dashboard") },
              ]}
              title={tUser("title")}
              buttons={[
                {
                  href: "/admin/users/create",
                  label: tCrud("create"),
                  icon: <Plus className="w-5 h-5" />,
                },
              ]}
            />
            <DataTable
              basePath={"/admin/users"}
              count={data?.count || 0}
              offset={offset}
              limit={limit}
              order={order}
              direction={direction}
              query={query}
              data={data?.data || []}
              structure={structure}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
