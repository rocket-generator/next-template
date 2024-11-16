"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/libraries/css";
import { usePathname } from "next/navigation";
import Link from "next/link";

export type MenuItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

type Props = {
  menuItems: MenuItem[];
  title: string;
  icon?: React.ReactNode;
};

export default function SideMenu({ menuItems, title, icon }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <>
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

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white border-r",
          !isOpen && "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {icon || <div className="w-8 h-8 bg-blue-600 rounded-md" />}
            <span className="text-xl font-semibold">{title}</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
