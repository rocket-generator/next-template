import DataTextItem from "@/components/molecules/DataTextItem";
import DataLinkItem from "@/components/molecules/DataLinkItem";
import DataDateTimeItem from "@/components/molecules/DataDateTimeItem";
import DataBooleanItem from "@/components/molecules/DataBooleanItem";

type Props = {
  data: { [key: string]: unknown };
  structure: {
    name: string;
    key: string;
    type: string;
    options?: { [key: string]: unknown } | undefined;
  }[];
};

export default function DescriptionList(props: Props) {
  return (
    <div>
      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          {props.structure.map((column, index) => {
            let value: React.ReactNode | string = "";
            if (column.type == "link" && props.data[column.key] != null) {
              value = (
                <DataLinkItem
                  record={props.data}
                  name={column.name}
                  columnKey={column.key}
                  options={column.options || {}}
                  key={index + "-" + column.key}
                />
              );
            } else if (column.type === "datetime") {
              value = (
                <DataDateTimeItem
                  record={props.data}
                  name={column.name}
                  columnKey={column.key}
                  options={column.options}
                  key={column.key}
                />
              );
            } else if (column.type === "boolean") {
              value = (
                <DataBooleanItem
                  record={props.data}
                  name={column.name}
                  columnKey={column.key}
                  options={column.options}
                  key={column.key}
                />
              );
            } else {
              value = (
                <DataTextItem
                  record={props.data}
                  name={column.name}
                  columnKey={column.key}
                  options={column.options}
                  key={index + "-" + column.key}
                />
              );
            }
            return (
              <div
                key={column.key}
                className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0"
              >
                <dt className="text-sm font-medium leading-6 text-gray-900">
                  {column.name}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
