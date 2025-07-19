"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { changePassword } from "@/app/(site)/(authorized)/(app)/settings/actions";
import type { PasswordChangeResult } from "@/app/(site)/(authorized)/(app)/settings/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  PasswordChangeRequest,
  createPasswordChangeRequestSchema,
} from "@/requests/password_change_request";
import { cn } from "@/libraries/css";

interface PasswordChangeFormProps {
  onSuccess?: (message: string) => void;
}

export const PasswordChangeForm = ({ onSuccess }: PasswordChangeFormProps) => {
  const tSettings = useTranslations("Settings");
  const tAuth = useTranslations("Auth");
  const tCrud = useTranslations("Crud");

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 国際化されたバリデーションスキーマを作成
  const passwordChangeSchema = useMemo(
    () => createPasswordChangeRequestSchema(tAuth),
    [tAuth]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setError,
  } = useForm<PasswordChangeRequest>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleFormSubmit = async (formData: PasswordChangeRequest) => {
    setIsLoading(true);
    setServerError(null);

    const result: PasswordChangeResult = await changePassword(formData);

    if (result.success) {
      // フォームをリセット
      reset();
      onSuccess?.(tSettings(result.message || "password_updated"));
    } else {
      if (result.field) {
        setError(result.field as keyof PasswordChangeRequest, {
          message: tSettings(`validation.${result.error}`),
        });
      } else {
        setServerError(tSettings(`validation.${result.error}`));
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{tSettings("current_password")}</Label>
        <Input
          id="currentPassword"
          type="password"
          {...register("currentPassword")}
          placeholder={tSettings("current_password_placeholder")}
          className={cn(errors.currentPassword && "border-red-500")}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-500">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{tAuth("new_password")}</Label>
        <Input
          id="newPassword"
          type="password"
          {...register("newPassword")}
          placeholder={tSettings("new_password_placeholder")}
          className={cn(errors.newPassword && "border-red-500")}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-500">{errors.newPassword.message}</p>
        )}
        <p className="text-xs text-gray-500">
          {tAuth("validation.password_complexity")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {tSettings("confirm_new_password")}
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          placeholder={tSettings("confirm_new_password_placeholder")}
          className={cn(errors.confirmPassword && "border-red-500")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-500">{serverError}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          className="flex-1"
        >
          {isLoading ? tCrud("saving") : tSettings("change_password")}
        </Button>
      </div>
    </form>
  );
};
