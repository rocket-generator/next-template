import * as React from "react";
import Link from "next/link";

type Props = {
  className?: string;
  record: { [key: string]: any };
  name: string;
  columnKey: string;
  options: { [key: string]: any } | undefined;
};

export default function DataLinkItem(props: Props) {
  const link_key: string =
    (props.options && (props.options["key"] as string)) || "id";
  const link_base_url: string =
    (props.options && (props.options["base_url"] as string)) || "";
  const link_display: string =
    (props.options && (props.options["display"] as string)) || "name";

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
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
        href={link_base_url + recordValue[link_key]}
      >
        {recordValue[link_display]}
      </Link>
    </div>
  );
}
