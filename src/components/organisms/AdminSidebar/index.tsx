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
import LanguageSwitcher from "@/components/molecules/LanguageSwitcher";

export type AdminMenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

type Props = {
  menuItems: AdminMenuItem[];
  title: string;
  icon?: React.ReactNode;
  signInUser: UserModel | null;
  onSignOut: () => void;
};

export default function AdminSidebar({
  menuItems,
  title,
  icon,
  signInUser,
  onSignOut,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Menu.Admin");
  const tCommon = useTranslations("Common");

  const handleSettings = () => {
    router.push("/settings");
  };

  return (
    <Sidebar data-testid="admin-sidebar">
      <SidebarHeader data-testid="admin-sidebar-header">
        <div
          className="flex items-center gap-2 px-2"
          data-testid="admin-sidebar-title"
        >
          {icon && <span data-testid="admin-sidebar-icon">{icon}</span>}
          <span
            className="text-xl font-semibold"
            data-testid="admin-sidebar-title-text"
          >
            {title}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent data-testid="admin-sidebar-content">
        <SidebarGroup>
          <SidebarGroupLabel data-testid="admin-sidebar-group-label">
            {t("administration")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu data-testid="admin-sidebar-menu">
              {menuItems.map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  data-testid={`admin-menu-item-${item.href.split("/").pop()}`}
                >
                  <SidebarMenuButton
                    asChild
                    data-testid={`admin-menu-button-${item.href
                      .split("/")
                      .pop()}`}
                  >
                    <a href={item.href}>
                      <span
                        data-testid={`admin-menu-icon-${item.href
                          .split("/")
                          .pop()}`}
                      >
                        {item.icon}
                      </span>
                      <span
                        data-testid={`admin-menu-label-${item.href
                          .split("/")
                          .pop()}`}
                      >
                        {item.label}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter data-testid="admin-sidebar-footer">
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
                <SidebarMenuButton data-testid="admin-user-menu-trigger">
                  <Avatar className="w-6 h-6" data-testid="admin-user-avatar">
                    <AvatarFallback data-testid="admin-user-avatar-fallback">
                      {signInUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span data-testid="admin-user-name">
                    {signInUser?.name || "User"}
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
                data-testid="admin-user-menu-dropdown"
              >
                <DropdownMenuItem
                  onClick={handleSettings}
                  data-testid="admin-settings-menu-item"
                >
                  <Settings
                    className="w-4 h-4 mr-2"
                    data-testid="admin-settings-icon"
                  />
                  <span>{tCommon("settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onSignOut}
                  data-testid="admin-signout-menu-item"
                >
                  <LogOut
                    className="w-4 h-4 mr-2"
                    data-testid="admin-signout-icon"
                  />
                  <span>{tCommon("signout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
