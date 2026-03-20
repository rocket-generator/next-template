import Pagination from "@/components/molecules/Pagination";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/libraries/css";
import Link from "next/link";
import DataTextItem from "@/components/molecules/DataTextItem";
import DataLinkItem from "@/components/molecules/DataLinkItem";
import DataDateTimeItem from "@/components/molecules/DataDateTimeItem";
import SearchForm from "@/components/molecules/SearchForm";
import ClickableRow from "./ClickableRow";

type DataRecord = {
  id: string;
  [key: string]: unknown;
};

type ColumnStructure = {
  name: string;
  key: string;
  type: string | undefined;
  options: Record<string, unknown> | undefined;
  isSortable?: boolean;
};

type Props = {
  count: number;
  offset: number;
  limit: number;
  order?: string;
  direction?: string;
  query?: string;
  data: DataRecord[];
  structure: ColumnStructure[];
  basePath: string;
};

export default function CRUDTable({
  order,
  direction,
  query = "",
  ...props
}: Props) {
  const getAlignment = (column: ColumnStructure) => {
    const optionAlign = column.options?.align;
    if (
      optionAlign === "left" ||
      optionAlign === "center" ||
      optionAlign === "right"
    ) {
      return optionAlign;
    }
    switch (column.type) {
      case "number":
        return "right";
      case "boolean":
        return "center";
      default:
        return "left";
    }
  };

  const getTextAlignClass = (align: string) => {
    switch (align) {
      case "right":
        return "text-right";
      case "center":
        return "text-center";
      default:
        return "text-left";
    }
  };

  const getJustifyClass = (align: string) => {
    switch (align) {
      case "right":
        return "justify-end";
      case "center":
        return "justify-center";
      default:
        return "justify-start";
    }
  };

  const getSortLink = (key: string) => {
    const newDirection = order === key && direction === "asc" ? "desc" : "asc";
    const params = new URLSearchParams({
      order: key,
      direction: newDirection,
    });
    if (query) {
      params.set("query", query);
    }
    return `${props.basePath}?${params.toString()}`;
  };

  const getStickyHeaderClass = (index: number) =>
    index === 0 ? "sticky left-0 z-20 bg-gray-50" : "";

  const getStickyCellClass = (index: number) =>
    index === 0 ? "sticky left-0 z-10 bg-white" : "";

  const getRowHref = (record: DataRecord) => `${props.basePath}/${record.id}`;

  return (
    <>
      <div
        className="mt-4 flex items-center justify-between"
        data-testid="datatable-toolbar"
      >
        <SearchForm defaultValue={query} />
      </div>
      <div className="mt-8 flow-root">
        <div className="-my-2 py-2">
          <div
            className="overflow-hidden border border-gray-300 shadow ring-1 ring-black ring-opacity-5"
            data-testid="datatable-frame"
          >
            <div
              className="overflow-x-auto scrollbar-hidden"
              data-testid="datatable-scroll-container"
            >
              <div
                className="inline-block min-w-full align-middle"
                data-testid="datatable-width-wrapper"
              >
                <table className="min-w-full w-max border-separate border-spacing-0 divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {props.structure.map((column, index) => {
                        const isSortable = column.isSortable ?? false;
                        const isSorted = order === column.key;
                        const align = getAlignment(column);
                        const className = cn(
                          "py-3.5 px-3 text-sm font-semibold text-gray-900",
                          "border-r border-b border-gray-300",
                          getTextAlignClass(align),
                          index === 0 ? "pl-4 sm:pl-6" : "",
                          getStickyHeaderClass(index),
                          isSortable ? "cursor-pointer hover:bg-gray-100" : ""
                        );
                        return (
                          <th
                            scope="col"
                            className={className}
                            key={"head-" + column.key}
                            data-testid={`datatable-header-${column.key}`}
                          >
                            {isSortable ? (
                              <Link
                                href={getSortLink(column.key)}
                                className={cn(
                                  "flex items-center gap-1 group w-full",
                                  getJustifyClass(align)
                                )}
                              >
                                {column.name}
                                <span
                                  className="ml-1 inline-flex items-center -space-x-2"
                                  data-testid={`datatable-sort-${column.key}`}
                                >
                                  <ArrowUp
                                    data-testid={`datatable-sort-up-${column.key}`}
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      isSorted && direction === "asc"
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    )}
                                  />
                                  <ArrowDown
                                    data-testid={`datatable-sort-down-${column.key}`}
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      isSorted && direction === "desc"
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    )}
                                  />
                                </span>
                              </Link>
                            ) : (
                              column.name
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {props &&
                      props.data &&
                      props.data.map((record) => (
                        <ClickableRow
                          key={"row-" + record.id}
                          href={getRowHref(record)}
                          className="group cursor-pointer focus-visible:outline-none"
                          testId={`datatable-row-${record.id}`}
                        >
                          {props.structure.map((column, colIndex) => {
                            const align = getAlignment(column);
                            const className = cn(
                              "whitespace-nowrap py-1 text-sm text-gray-500",
                              "border-r border-gray-200",
                              "group-hover:bg-sky-50 group-focus-within:bg-sky-50 transition-colors",
                              getTextAlignClass(align),
                              colIndex === 0 ? "pl-4 pr-3 sm:pl-6" : "px-3",
                              getStickyCellClass(colIndex)
                            );
                            if (column.type == "link") {
                              return (
                                <td
                                  className={className}
                                  key={"column-" + column.key}
                                  data-testid={`datatable-cell-${record.id}-${column.key}`}
                                >
                                  <DataLinkItem
                                    record={record}
                                    name={column.name}
                                    columnKey={column.key}
                                    options={column.options}
                                    key={column.key}
                                  />
                                </td>
                              );
                            } else if (column.type == "datetime") {
                              return (
                                <td
                                  className={className}
                                  key={"column-" + column.key}
                                  data-testid={`datatable-cell-${record.id}-${column.key}`}
                                >
                                  <DataDateTimeItem
                                    record={record}
                                    name={column.name}
                                    columnKey={column.key}
                                    options={column.options}
                                    key={column.key}
                                  />
                                </td>
                              );
                            } else if (column.type == "boolean") {
                              return (
                                <td
                                  className={className}
                                  key={"column-" + column.key}
                                  data-testid={`datatable-cell-${record.id}-${column.key}`}
                                >
                                  <div
                                    className={`text-${
                                      record[column.key] ? "green" : "red"
                                    }-600 font-medium`}
                                  >
                                    {record[column.key] ? "✔" : "✘"}
                                  </div>
                                </td>
                              );
                            } else {
                              return (
                                <td
                                  className={className}
                                  key={"column-" + column.key}
                                  data-testid={`datatable-cell-${record.id}-${column.key}`}
                                >
                                  <DataTextItem
                                    record={record}
                                    name={column.name}
                                    columnKey={column.key}
                                    options={column.options}
                                    key={column.key}
                                  />
                                </td>
                              );
                            }
                          })}
                        </ClickableRow>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Pagination
          count={props.count}
          offset={props.offset}
          limit={props.limit}
          basePath={props.basePath}
        />
      </div>
    </>
  );
}
