"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { SidebarMenuButton } from "@/components/atoms/sidebar";
import { useLocale } from "next-intl";

export type SupportedLocale = "ja" | "en";

export type LanguageSwitcherProps = {
  userLanguage?: string | undefined;
  onSelect: (locale: SupportedLocale) => void | Promise<void>;
};

const resolveInitialLocale = (userLanguage?: string): SupportedLocale => {
  const supported: SupportedLocale[] = ["ja", "en"];
  const userLang = (userLanguage || "").toLowerCase();
  if ((supported as readonly string[]).includes(userLang)) {
    return userLang as SupportedLocale;
  }
  const browserLang =
    typeof navigator !== "undefined"
      ? (navigator.language?.slice(0, 2).toLowerCase() as string)
      : "en";
  if ((supported as readonly string[]).includes(browserLang)) {
    return browserLang as SupportedLocale;
  }
  return "en";
};

const LanguageSwitcher = ({
  userLanguage,
  onSelect,
}: LanguageSwitcherProps) => {
  const [open, setOpen] = React.useState<boolean>(false);
  const runtimeLocale = useLocale();
  const effectiveLocale: SupportedLocale =
    runtimeLocale === "ja" || runtimeLocale === "en"
      ? (runtimeLocale as SupportedLocale)
      : resolveInitialLocale(userLanguage);

  const handleSelect = async (locale: SupportedLocale) => {
    await onSelect(locale);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton data-testid="language-switcher-button">
          <Globe className="w-4 h-4 mr-2" />
          <span>{effectiveLocale === "ja" ? "日本語" : "English"}</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        className="w-[--radix-popper-anchor-width]"
      >
        <DropdownMenuItem
          data-testid="language-option-ja"
          onClick={() => handleSelect("ja")}
        >
          日本語
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="language-option-en"
          onClick={() => handleSelect("en")}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
