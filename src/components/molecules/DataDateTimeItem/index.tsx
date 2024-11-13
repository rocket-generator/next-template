import * as React from "react";

type Props = {
  className?: string;
  record: { [key: string]: any };
  name: string;
  columnKey: string;
  options: { [key: string]: any } | undefined;
};

export default function DataDateTimeItem(props: Props) {
  let label = props.record[props.columnKey] || "";
  if (
    props.options &&
    props.options["labels"] &&
    props.options["labels"][label]
  ) {
    label = props.options["labels"][label];
  }
  // Convert to Tokyo timezone
  const tokyoDate = new Date(
    props.record[props.columnKey] * 1000
  ).toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
  });
  const date = new Date(tokyoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return (
    <div className="text-gray-900">
      {`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`}
    </div>
  );
}
