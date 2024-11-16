import React from "react";
import {
  ChevronLeft,
  ChevronFirst,
  ChevronRight,
  ChevronLast,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  count: number;
  offset: number;
  limit: number;
  basePath: string;
};

export default async function Pagination({
  count,
  offset,
  limit,
  basePath,
}: Props) {
  const currentPage = Math.floor((offset ?? 0) / (limit ?? 20)) + 1;
  const totalPages = Math.max(1, Math.ceil(count / (limit ?? 20)));
  const t = await getTranslations("Components.Pagination");

  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const generateLink = (page: number) => {
    const newOffset = (page - 1) * limit;
    return `${basePath}?offset=${newOffset}&limit=${limit}`;
  };

  const pageNumbers = generatePageNumbers();

  const start = count > 0 ? (offset ?? 0) + 1 : 0;
  const end = Math.min((offset ?? 0) + (limit ?? 20), count);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <Link
          href={generateLink(Math.max(1, currentPage - 1))}
          className={
            "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50" +
            (currentPage === 1
              ? " pointer-events-none text-gray-400"
              : " text-gray-900")
          }
          aria-disabled={currentPage === 1}
          tabIndex={currentPage === 1 ? -1 : undefined}
        >
          {t("previous")}
        </Link>
        <Link
          href={generateLink(Math.min(totalPages, currentPage + 1))}
          className={
            "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50" +
            (currentPage === totalPages
              ? " pointer-events-none text-gray-400"
              : " text-gray-900")
          }
          aria-disabled={currentPage === totalPages}
          tabIndex={currentPage === totalPages ? -1 : undefined}
        >
          {t("next")}
        </Link>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            {count > 0 ? (
              <>
                <span className="font-medium">{start}</span> -{" "}
                <span className="font-medium">{end}</span> /{" "}
                <span className="font-medium">{count}</span>
              </>
            ) : (
              t("no_result_found")
            )}
          </p>
        </div>
        {count > 0 && (
          <div>
            <nav
              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
              aria-label="Pagination"
            >
              <Link
                href={generateLink(1)}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
              >
                <span className="sr-only">{t("first")}</span>
                <ChevronFirst className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href={generateLink(Math.max(1, currentPage - 1))}
                className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
              >
                <span className="sr-only">{t("previous")}</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
              {pageNumbers.map((page) => (
                <Link
                  key={page}
                  href={generateLink(page)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 pointer-events-none"
                      : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  }`}
                  aria-disabled={page === currentPage}
                  tabIndex={page === currentPage ? -1 : undefined}
                >
                  {page}
                </Link>
              ))}
              <Link
                href={generateLink(Math.min(totalPages, currentPage + 1))}
                className={`relative inline-flex items-center px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : undefined}
              >
                <span className="sr-only">{t("next")}</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href={generateLink(totalPages)}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages
                    ? "pointer-events-none text-gray-400"
                    : "text-gray-900"
                }`}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : undefined}
              >
                <span className="sr-only">{t("last")}</span>
                <ChevronLast className="h-5 w-5" aria-hidden="true" />
              </Link>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
