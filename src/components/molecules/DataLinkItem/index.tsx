import * as React from "react";
import Link from "next/link";

type Props = {
  className: string;
  record: { [key: string]: any };
  name: string;
  columnKey: string;
  type: string | undefined;
  options: { [key: string]: any };
};

export default function DataLinkItem(props: Props) {
  const link_key: string = (props.options["key"] as string) || "id";
  const link_base_url: string = (props.options["base_url"] as string) || "";
  const link_display: string = (props.options["display"] as string) || "name";

  console.log("columnKey", props.columnKey);

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const recordValue = getNestedValue(props.record, props.columnKey);
  console.log("recordValue", recordValue);
  if (!recordValue) {
    return (
      <div className="text-blue-600 hover:text-blue-800 underline hover:no-underline">
        {""}
      </div>
    );
  }
  return (
    <div className="text-blue-600 hover:text-blue-800 underline hover:no-underline">
      <Link
        className={"text-indigo-900 hover:text-indigo-900"}
        href={link_base_url + recordValue[link_key]}
      >
        {recordValue[link_display]}
      </Link>
    </div>
  );
}
