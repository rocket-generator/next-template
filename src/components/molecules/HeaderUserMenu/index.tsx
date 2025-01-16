"use client";

import { User, Settings, LogOut } from "lucide-react";
import { User as UserModel } from "@/models/admin/user";
import { useState, useRef, useEffect } from "react";
import { signOutAction } from "./actions";

type Props = {
  signInUser: UserModel | null;
};

export default function HeaderUserMenu({ signInUser }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <User className="w-5 h-5" />
        <span className="text-sm font-medium">{signInUser?.name}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border">
          <button
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              /* TODO: 設定画面への遷移処理 */
            }}
          >
            <Settings className="w-4 h-4" />
            設定
          </button>
          <button
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={signOutAction}
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
