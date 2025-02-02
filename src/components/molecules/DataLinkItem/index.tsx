import * as React from "react";
import Link from "next/link";

type Props = {
  className?: string;
  record: { [key: string]: unknown };
  name: string;
  columnKey: string;
  options: { [key: string]: unknown } | undefined;
};

export default function DataLinkItem(props: Props) {
  const link_key: string =
    (props.options && (props.options["key"] as string)) || "id";
  const link_base_url: string =
    (props.options && (props.options["base_url"] as string)) || "";
  const link_display: string =
    (props.options && (props.options["display"] as string)) || "name";
  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split(".").reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };
  const recordValue = getNestedValue(props.record, props.columnKey);
  const className =
    props.className ||
    "text-blue-600 hover:text-blue-800 underline hover:no-underline";
  if (!recordValue) {
    return <div className={className}>{""}</div>;
  }
  return (
    <div className={className}>
      <Link
        className={"text-indigo-900 hover:text-indigo-900"}
        href={
          link_base_url + (recordValue as { [key: string]: string })[link_key]
        }
      >
        {(recordValue as { [key: string]: string })[link_display]}
      </Link>
    </div>
  );
}
