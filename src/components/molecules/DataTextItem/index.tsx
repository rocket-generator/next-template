import * as React from "react";

type Props = {
  className: string;
  record: { [key: string]: any };
  name: string;
  columnKey: string;
  type: string | undefined;
  options: { [key: string]: any };
};

export default function DataTextItem(props: Props) {
  let label = props.record[props.columnKey] || "";
  if (props.options["labels"] && props.options["labels"][label]) {
    label = props.options["labels"][label];
  }
  return (
    <div className="text-gray-900 whitespace-normal break-words max-w-xs">
      {label}
    </div>
  );
}
