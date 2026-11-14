"use client";

import React from "react";
import { Menu, Calendar } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const today = formatDate(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 sm:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{today}</span>
        </div>
      </div>
    </header>
  );
}

