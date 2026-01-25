"use client";
import DataTextInputField from "@/components/molecules/DataTextInputField";
import DataSelectInputField from "@/components/molecules/DataSelectSingleInputField";
import DataCheckboxMultiInputField from "@/components/molecules/DataCheckboxMultiInputField";
import DataDateTimeInputField from "@/components/molecules/DataDateTimeInputField";
import {
  Controller,
  SubmitHandler,
  useForm,
  Path,
  PathValue,
  FieldError,
} from "react-hook-form";
import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/libraries/css";

type Props<T extends Record<string, unknown>> = {
  structure: {
    name: string;
    key: string;
    type: string;
    value: string | number | boolean | string[] | undefined;
    required: boolean;
    placeholder: string;
    options?: { [key: string]: unknown } | undefined;
  }[];
  submitAction?: (data: T) => Promise<boolean>;
};

export default function DataForm<T extends Record<string, unknown>>({
  structure,
  submitAction,
}: Props<T>) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({
    mode: "onChange",
  });
  const t = useTranslations("Components.DataForm");
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit: SubmitHandler<T> = async (data) => {
    setIsLoading(true);
    try {
      if (submitAction) {
        await submitAction(data);
      }
    } catch (error) {
      console.error("onSubmit error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">
          <div className="mt-10 space-y-6">
            {structure.map((field) => {
              const requiredMessage = t("validation.required", {
                field: field.name,
              });
              return (
                <div key={field.key} className="sm:col-span-6">
                  <Controller
                    name={field.key as Path<T>}
                    control={control}
                    defaultValue={field.value as PathValue<T, Path<T>>}
                    rules={{
                      required:
                        field.required && field.type !== "checkbox_multi"
                          ? requiredMessage
                          : false,
                    }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => {
                      if (
                        field.type === "text" ||
                        field.type === "string" ||
                        field.type === "number"
                      ) {
                        return (
                          <DataTextInputField
                            data_key={field.key}
                            name={field.name}
                            type="text"
                            value={value as string}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={isLoading}
                            options={field.options}
                            className={cn(
                              error && "border-red-500 focus:ring-red-500"
                            )}
                          />
                        );
                      } else if (field.type === "password") {
                        return (
                          <DataTextInputField
                            data_key={field.key}
                            name={field.name}
                            type="password"
                            value={value as string}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={isLoading}
                            options={field.options}
                            className={cn(
                              error && "border-red-500 focus:ring-red-500"
                            )}
                          />
                        );
                      } else if (field.type === "select_single") {
                        return (
                          <DataSelectInputField
                            data_key={field.key}
                            name={field.name}
                            value={value as string}
                            onChange={onChange}
                            placeholder={field.placeholder}
                            required={field.required}
                            options={field.options}
                            disabled={isLoading}
                            className={cn(
                              error && "border-red-500 focus:ring-red-500"
                            )}
                          />
                        );
                      } else if (field.type === "checkbox_multi") {
                        return (
                          <DataCheckboxMultiInputField
                            data_key={field.key}
                            name={field.name}
                            value={Array.isArray(value) ? value : []}
                            onChange={(newValue) => {
                              onChange(newValue.length === 0 ? [] : newValue);
                            }}
                            placeholder={field.placeholder}
                            required={field.required}
                            options={field.options}
                            disabled={isLoading}
                            className={cn(
                              error && "border-red-500 focus:ring-red-500"
                            )}
                          />
                        );
                      } else if (field.type === "datetime") {
                        return (
                          <DataDateTimeInputField
                            data_key={field.key}
                            name={field.name}
                            value={value as number}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            disabled={isLoading}
                            options={field.options}
                          />
                        );
                      }
                      return <div>Invalid field type</div>;
                    }}
                  />
                  {errors[field.key as string] && (
                    <p className="mt-1 text-sm text-red-500">
                      {((errors[field.key as string] as FieldError)
                        ?.message as string) || requiredMessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button
          type="button"
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {isLoading ? t("saving") : t("save")}
        </button>
      </div>
    </form>
  );
}
