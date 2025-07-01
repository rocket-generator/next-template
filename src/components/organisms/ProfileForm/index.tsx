"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { updateProfile } from "@/app/(site)/(authorized)/(app)/settings/actions";
import type { ProfileUpdateResult } from "@/app/(site)/(authorized)/(app)/settings/actions";

interface ProfileFormProps {
  initialName: string;
  initialEmail: string;
  onSuccess?: (message: string) => void;
}

export const ProfileForm = ({
  initialName,
  initialEmail,
  onSuccess,
}: ProfileFormProps) => {
  const tSettings = useTranslations("Settings");
  const tAuth = useTranslations("Auth");
  const tCrud = useTranslations("Crud");

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const result: ProfileUpdateResult = await updateProfile({
      name,
      email,
    });

    if (result.success) {
      onSuccess?.(tSettings(result.message as keyof IntlMessages["Settings"]));
    } else {
      if (result.field) {
        setErrors({
          [result.field]: tSettings(
            `validation.${result.error}` as keyof IntlMessages["Settings"]["validation"]
          ),
        });
      } else {
        setErrors({
          general: tSettings(
            `validation.${result.error}` as keyof IntlMessages["Settings"]["validation"]
          ),
        });
      }
    }

    setIsLoading(false);
  };

  const isChanged = name !== initialName || email !== initialEmail;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{tAuth("name")}</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tAuth("name_placeholder")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{tAuth("email")}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      {errors.general && (
        <p className="text-sm text-red-500">{errors.general}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!isChanged || isLoading}
          className="flex-1"
        >
          {isLoading ? tCrud("saving") : tCrud("save")}
        </Button>
      </div>
    </form>
  );
};
