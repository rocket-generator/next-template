import React from "react";
import { Checkbox } from "@/components/atoms/checkbox";
import { Label } from "@/components/atoms/label";
import { cn } from "@/libraries/css";

type Props = {
  name: string;
  data_key: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
  options: Record<string, unknown> | undefined;
  disabled?: boolean;
  className?: string;
};

export default function DataCheckboxMultiInputField(props: Props) {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const newValues = checked
      ? [...(props.value || []), optionValue]
      : (props.value || []).filter((v) => v !== optionValue);
    props.onChange(newValues);
  };
  const options = props.options ? props.options["options"] : [];
  return (
    <div className={cn("col-span-full space-y-4", props.className)}>
      <Label>{props.name}</Label>
      <div className="grid grid-cols-2 gap-4">
        {(options as { name: string; value: string }[]).map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${props.data_key}-${option.value}`}
              checked={(props.value || []).includes(option.value)}
              onCheckedChange={(checked) =>
                handleCheckboxChange(option.value, checked as boolean)
              }
              disabled={props.disabled}
            />
            <Label
              htmlFor={`${props.data_key}-${option.value}`}
              className="text-sm font-normal"
            >
              {option.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
