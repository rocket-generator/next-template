"use client";

import React from "react";
import { Settings, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { User as UserModel } from "@/models/user";
import { usePathname, useRouter } from "next/navigation";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/atoms/sidebar";
import { cn } from "@/libraries/css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/atoms/avatar";
import { CheckCircle } from "lucide-react";
import LanguageSwitcher from "@/components/molecules/LanguageSwitcher";

const normalizePath = (path: string) => {
  if (!path || path === "/") {
    return "/";
  }
  return path.replace(/\/+$/, "");
};

const isActivePath = (pathname: string, href: string) => {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/") {
    return currentPath === "/";
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
};

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
  const pathname = usePathname();
  const t = useTranslations("Common");
  const { state } = useSidebar();
  const hasAdminPermission =
    Array.isArray(signInUser?.permissions) &&
    signInUser?.permissions.includes("admin");
  const triggerLabel =
    state === "collapsed" ? t("open_sidebar") : t("close_sidebar");
  const triggerTooltip = state === "collapsed" ? t("open_sidebar") : undefined;

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleAdmin = () => {
    router.push("/admin/dashboard");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="group/header relative flex items-center gap-2 px-2">
          <div className="flex items-center gap-2">
            {icon || <CheckCircle className="h-4 w-4 text-blue-600" />}
            <span className="sr-only">{title}</span>
          </div>
          <SidebarTrigger
            className={cn(
              "absolute right-1 top-1/2 hidden -translate-y-1/2 md:inline-flex transition-opacity",
              state === "collapsed"
                ? "opacity-0 pointer-events-none group-hover/header:opacity-100 group-hover/header:pointer-events-auto"
                : "opacity-100"
            )}
            label={triggerLabel}
            tooltip={triggerTooltip}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("application")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active}>
                      <a
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
                  {state === "collapsed" ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {signInUser?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{signInUser?.name || "User"}</span>
                    </>
                  )}
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
                {hasAdminPermission && (
                  <DropdownMenuItem onClick={handleAdmin}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    <span>{t("admin_console")}</span>
                  </DropdownMenuItem>
                )}
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
