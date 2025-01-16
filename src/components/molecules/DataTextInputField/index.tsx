import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { cn } from "@/libraries/css";

type Props = {
  name: string;
  data_key: string;
  type: string;
  value: string | number | boolean | readonly string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options: { [key: string]: any } | undefined;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

export default function DataTextInputField(props: Props) {
  return (
    <div className="col-span-full space-y-1">
      <Label htmlFor={props.data_key}>{props.name}</Label>
      <Input
        key={props.data_key}
        id={props.data_key}
        name={props.data_key}
        type={props.type}
        onChange={props.onChange || (() => {})}
        value={props.value || ""}
        required={props.required || false}
        disabled={props.disabled || false}
        placeholder={props.placeholder}
        className={cn(
          "block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",
          props.className
        )}
      />
    </div>
  );
}
