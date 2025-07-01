"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { Button } from "@/components/atoms/button";
import { Avatar } from "@/components/atoms/avatar";
import {
  uploadAvatar,
  removeAvatar,
} from "@/app/(site)/(authorized)/(app)/settings/actions";
import type { AvatarUploadResult } from "@/app/(site)/(authorized)/(app)/settings/actions";

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  userName: string;
  onSuccess?: (message: string) => void;
}

export const AvatarUpload = ({
  initialAvatarUrl,
  userName,
  onSuccess,
}: AvatarUploadProps) => {
  const tSettings = useTranslations("Settings");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialAvatarUrl || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("avatar", file);

    const result: AvatarUploadResult = await uploadAvatar(formData);

    if (result.success) {
      setAvatarUrl(result.avatarUrl || null);
      onSuccess?.(tSettings(result.message));
    } else {
      setError(tSettings(`validation.${result.error}`));
    }

    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    setError("");

    const result: AvatarUploadResult = await removeAvatar();

    if (result.success) {
      setAvatarUrl(null);
      onSuccess?.(tSettings(result.message));
    } else {
      setError(tSettings(`validation.${result.error}`));
    }

    setIsLoading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <span className="text-2xl font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadClick}
              disabled={isLoading}
            >
              {tSettings("upload_avatar")}
            </Button>

            {avatarUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={isLoading}
              >
                {tSettings("remove_avatar")}
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-500">
            {tSettings("avatar_upload_description")}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
