import { cn } from "@/libraries/css";
import * as React from "react";

type Props = {
  className?: string;
  record: { [key: string]: unknown };
  name: string;
  columnKey: string;
  options?: { [key: string]: unknown } | undefined;
};

export default function DataBooleanItem(props: Props) {
  const value = props.record[props.columnKey] || false ? "✔" : "✘";
  const className = cn(
    props.className ||
      "text-gray-900 whitespace-normal break-words max-w-xs font-medium",
    value ? "text-green-600" : "text-red-600"
  );
  return <div className={className}>{value}</div>;
}
