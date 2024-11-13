import * as React from "react";

type Props = {
  className?: string;
  record: { [key: string]: any };
  name: string;
  columnKey: string;
  options?: { [key: string]: any } | undefined;
};

export default function DataTextItem(props: Props) {
  const value = props.record[props.columnKey] || "";
  const className =
    props.className || "text-gray-900 whitespace-normal break-words max-w-xs";
  return <div className={className}>{value}</div>;
}
