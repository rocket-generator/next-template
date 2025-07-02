"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { changePassword } from "@/app/(site)/(authorized)/(app)/settings/actions";
import type { PasswordChangeResult } from "@/app/(site)/(authorized)/(app)/settings/actions";

interface PasswordChangeFormProps {
  onSuccess?: (message: string) => void;
}

export const PasswordChangeForm = ({ onSuccess }: PasswordChangeFormProps) => {
  const tSettings = useTranslations("Settings");
  const tAuth = useTranslations("Auth");
  const tCrud = useTranslations("Crud");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const result: PasswordChangeResult = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (result.success) {
      // フォームをリセット
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.(tSettings(result.message || "password_updated"));
    } else {
      if (result.field) {
        setErrors({
          [result.field]: tSettings(`validation.${result.error}`),
        });
      } else {
        setErrors({
          general: tSettings(`validation.${result.error}`),
        });
      }
    }

    setIsLoading(false);
  };

  const isFormValid = currentPassword && newPassword && confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{tSettings("current_password")}</Label>
        <Input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={tSettings("current_password_placeholder")}
          className={errors.currentPassword ? "border-red-500" : ""}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-500">{errors.currentPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{tAuth("new_password")}</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={tSettings("new_password_placeholder")}
          className={errors.newPassword ? "border-red-500" : ""}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-500">{errors.newPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {tSettings("confirm_new_password")}
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={tSettings("confirm_new_password_placeholder")}
          className={errors.confirmPassword ? "border-red-500" : ""}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {errors.general && (
        <p className="text-sm text-red-500">{errors.general}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="flex-1"
        >
          {isLoading ? tCrud("saving") : tSettings("change_password")}
        </Button>
      </div>
    </form>
  );
};
