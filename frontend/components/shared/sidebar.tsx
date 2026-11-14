"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Tags,
  PiggyBank,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Movimenti", href: "/transactions", icon: ArrowLeftRight },
  { label: "Conti Finanziari", href: "/accounts", icon: Landmark },
  { label: "Categorie & Tag", href: "/categories", icon: Tags },
  { label: "Budget & Risparmio", href: "/budgets", icon: PiggyBank },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-100">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Expense<span className="text-emerald-600">Tracker</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-600"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between gap-3 rounded-xl p-2.5 bg-white border border-gray-200/80 shadow-xs">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {user?.email || "Utente"}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Valuta: <span className="font-semibold text-emerald-700">{user?.base_currency || "EUR"}</span>
              </span>
            </div>

            <button
              onClick={logout}
              title="Disconnetti"
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

