"use client";

import { useState } from "react";
import { Menu, X, Users, Settings, Home, BarChart2 } from "lucide-react";
import { cn } from "@/libraries/css";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

const menuItems: MenuItem[] = [
  { icon: <Home className="w-5 h-5" />, label: "ダッシュボード", href: "/" },
  {
    icon: <Users className="w-5 h-5" />,
    label: "ユーザー管理",
    href: "/admin/users",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    label: "統計",
    href: "/admin/statistics",
  },
  { icon: <Settings className="w-5 h-5" />, label: "設定", href: "/settings" },
];

const SideMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ハンバーガーメニューボタン（モバイルのみ） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md",
          "transition-all duration-300 hover:bg-gray-100",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r",
          !isOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo and service name */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md"></div>
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          {/* 閉じるボタン（モバイルのみ） */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default SideMenu;
