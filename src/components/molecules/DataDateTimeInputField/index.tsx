"use client";

import { Input } from "@/components/atoms/input";
import { DateTimePicker } from "@/components/atoms/datetime-picker";
import { useState } from "react";

type Props = {
  name: string;
  data_key: string;
  value: unknown;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options: { [key: string]: unknown } | undefined;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

export default function FormInputField(props: Props) {
  console.log("props", props);
  const [datetimeValue, setDatetimeValue] = useState<number | undefined>(
    props.value as number | undefined
  );
  const onChangeFunction = (date: Date | undefined) => {
    if (!date) {
      setDatetimeValue(0);
      return;
    }
    setDatetimeValue(Math.floor(date.getTime() / 1000));
  };
  const convertUnixToDate = (
    unixTimestamp: number | undefined
  ): Date | undefined => {
    if (unixTimestamp === undefined) return undefined;
    return new Date(unixTimestamp * 1000);
  };
  const dateValue = convertUnixToDate(datetimeValue);
  return (
    <div className="col-span-full">
      <label
        htmlFor={props.data_key}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {props.name}
      </label>
      <div className="mt-2">
        <DateTimePicker
          key={props.data_key}
          value={dateValue}
          onChange={onChangeFunction}
          disabled={props.disabled}
          placeholder={props.placeholder || ""}
        ></DateTimePicker>
      </div>
      <Input
        id={props.data_key}
        name={props.data_key}
        type="hidden"
        onChange={props.onChange}
        value={datetimeValue}
        required={props.required}
        disabled={props.disabled}
        placeholder={props.placeholder || ""}
      />
    </div>
  );
}
