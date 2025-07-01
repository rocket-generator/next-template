import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Label } from "@/components/atoms/label";
import { cn } from "@/libraries/css";

type Props = {
  name: string;
  data_key: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  options: Record<string, unknown> | undefined;
  disabled?: boolean;
  className?: string;
};

export default function DataSelectSingleInputField(props: Props) {
  const options = props.options?.options || [];
  return (
    <div className="col-span-full space-y-2" data-testid="select-field-container">
      <Label htmlFor={props.data_key} data-testid="select-label">{props.name}</Label>
      <Select
        value={props.value}
        onValueChange={props.onChange}
        disabled={props.disabled}
        required={props.required}
        data-testid="select-root"
      >
        <SelectTrigger id={props.data_key} className={cn(props.className)} data-testid="select-trigger">
          <SelectValue placeholder={props.placeholder} data-testid="select-input" />
        </SelectTrigger>
        <SelectContent data-testid="select-content">
          {(options as { name: string; value: string }[]).map((option) => (
            <SelectItem key={option.value} value={option.value} data-testid={`select-item-${option.value}`}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
