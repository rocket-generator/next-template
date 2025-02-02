import * as React from "react";

type Props = {
  className?: string;
  record: { [key: string]: unknown };
  name: string;
  columnKey: string;
  options?: { [key: string]: unknown } | undefined;
};

export default function DataTextItem(props: Props) {
  const value = (props.record[props.columnKey] as string) || "";
  const className =
    props.className || "text-gray-900 whitespace-normal break-words max-w-xs";
  return <div className={className}>{value}</div>;
}
