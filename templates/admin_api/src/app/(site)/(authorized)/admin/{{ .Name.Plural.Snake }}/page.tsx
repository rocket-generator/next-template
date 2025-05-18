import { Suspense } from "react";
import { {{ .Name.Singular.Title }} } from "@/models/{{ .Name.Singular.Snake }}";
import { auth } from "@/libraries/auth";
import { {{ .Name.Singular.Title }}Repository } from "@/repositories/{{ .Name.Singular.Snake }}_repository";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import AuthError from "@/exceptions/auth_error";
import { headers } from "next/headers";
import AdminPageHeader from "@/components/molecules/AdminPageHeader";
import DataTable from "@/components/organisms/DataTable";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/atoms/skeleton";

type SearchParams = {
  offset?: string;
  limit?: string;
  order?: string;
  direction?: string;
  query?: string;
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
  const query = searchParams.query ? String(searchParams.query) : "";

  const tMenu = await getTranslations("Menu.Admin");
  const t = await getTranslations("{{ .Name.Plural.Title }}");
  const tCrud = await getTranslations("Crud");

  let data: { data: {{ .Name.Singular.Title }}[]; count: number } | null = null;
  try {
    const repository = new {{ .Name.Singular.Title }}Repository(session?.access_token);
    data = await repository.get(offset, limit, order, direction, query);
  } catch (error) {
    if (error instanceof AuthError) {
      const heads = await headers();
      const host = await heads.get("host");
      const protocol = (await heads.get("x-forwarded-proto")) || "http";
      const pathname = `/admin/{{ .Name.Plural.Snake }}?offset=${offset}&limit=${limit}&order=${order}&direction=${direction}&query=${query}`;
      const fullUrl = `${protocol}://${host}${pathname}`;
      redirect("/auth/signin?callback_url=" + encodeURIComponent(fullUrl));
    }
    console.log(error);
  }

  return (
    <Suspense fallback={<Skeleton className="w-full h-full rounded-full" />}>
      <main>
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-stone-800">
          <div className="px-4 sm:px-6 lg:px-8">
            <AdminPageHeader
              breadcrumbLinks={[
                { href: "/admin/dashboard", label: tMenu("dashboard") },
              ]}
              title={t("title")}
              buttons={[
                {
                  href: "/admin/{{ .Name.Plural.Snake }}/create",
                  label: tCrud("create"),
                  icon: <Plus className="w-5 h-5" />,
                },
              ]}
            />
            <DataTable
              basePath={"/admin/{{ .Name.Plural.Snake }}"}
              count={data?.count || 0}
              offset={offset}
              limit={limit}
              order={order}
              direction={direction}
              query={query}
              data={data?.data || []}
              structure={[
{{- range .Columns}}
                {
                    name: t("{{ .Name.Original }}"),
                    key: "{{ .Name.Original }}",
                    type: "{{ .ObjectType }}",
                    options: {},
                    isSortable: true,
                },
{{- end }}
              ]}
            />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
