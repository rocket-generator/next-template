"use client";

import React from "react";
import { Settings, LogOut } from "lucide-react";
import { User as UserModel } from "@/models/user";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/atoms/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { CheckCircle } from "lucide-react";
import LanguageSwitcher from "@/components/molecules/LanguageSwitcher";

export type MenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

type Props = {
  menuItems: MenuItem[];
  title: string;
  icon?: React.ReactNode;
  signInUser: UserModel | null;
  onSignOut: () => void;
};

export default function AppSidebar({
  menuItems,
  title,
  icon,
  signInUser,
  onSignOut,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Common");

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          {icon || <CheckCircle className="w-8 h-8 text-blue-600" />}
          <span className="text-xl font-semibold">{title}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("application")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Language Switcher */}
        <SidebarMenu>
          <SidebarMenuItem>
            <LanguageSwitcher
              userLanguage={signInUser?.language}
              onSelect={async (locale) => {
                const { setLanguageAction } = await import(
                  "@/app/(site)/(authorized)/(app)/actions"
                );
                await setLanguageAction(locale, true);
                window.location.reload();
              }}
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="w-6 h-6">
                    <AvatarFallback>
                      {signInUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{signInUser?.name || "User"}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span>{t("settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>{t("signout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
