"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api-client";
import { useAuth } from "../../components/providers/auth-provider";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  DashboardSummary,
  CategoryBreakdownResponse,
} from "../../types/analytics";
import { Transaction } from "../../types/transaction";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowLeftRight,
  ChevronRight,
  CreditCard,
  PieChart as PieChartIcon,
  Loader2,
  Wallet,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const baseCurrency = user?.base_currency || "EUR";

  // Fetch Dashboard KPI Summary
  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.get<DashboardSummary>("/analytics/summary"),
  });

  // Fetch Category Breakdown for current month
  const { data: categoryData, isLoading: isCategoriesLoading } =
    useQuery<CategoryBreakdownResponse>({
      queryKey: ["dashboard-categories"],
      queryFn: () => api.get<CategoryBreakdownResponse>("/analytics/categories"),
    });

  // Fetch Recent Transactions (last 6)
  const { data: recentTransactions, isLoading: isTxLoading } = useQuery<
    Transaction[]
  >({
    queryKey: ["recent-transactions"],
    queryFn: () => api.get<Transaction[]>("/transactions", { params: { limit: 6 } }),
  });

  return (
    <div className="space-y-8">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Panoramica del tuo patrimonio e andamento delle spese questo mese
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50 transition"
          >
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>I miei Conti</span>
          </Link>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nuovo Movimento</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Worth Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Patrimonio Netto
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {isSummaryLoading ? (
              <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(summary?.net_worth ?? 0, baseCurrency)}
              </h2>
            )}
            <p className="mt-1 text-xs text-gray-400">Totale saldi conti attivi</p>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Entrate del Mese
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {isSummaryLoading ? (
              <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <h2 className="text-2xl font-bold text-green-600 tracking-tight">
                +{formatCurrency(summary?.total_income ?? 0, baseCurrency)}
              </h2>
            )}
            <p className="mt-1 text-xs text-gray-400">Totale incassato questo mese</p>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Uscite del Mese
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {isSummaryLoading ? (
              <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <h2 className="text-2xl font-bold text-red-600 tracking-tight">
                -{formatCurrency(summary?.total_expense ?? 0, baseCurrency)}
              </h2>
            )}
            <p className="mt-1 text-xs text-gray-400">Totale spese sostenute</p>
          </div>
        </div>

        {/* Net Monthly Balance Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Risparmio Netto
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <PiggyBank className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            {isSummaryLoading ? (
              <div className="h-8 w-36 bg-gray-200 animate-pulse rounded-lg" />
            ) : (
              <h2
                className={`text-2xl font-bold tracking-tight ${
                  Number(summary?.net_balance ?? 0) >= 0
                    ? "text-gray-900"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(summary?.net_balance ?? 0, baseCurrency)}
              </h2>
            )}
            <p className="mt-1 text-xs text-gray-400">Saldo entrate - uscite mese</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Accounts & Category Breakdown (Left) vs Recent Transactions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Accounts Summary & Category Progress */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Accounts List */}
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">I tuoi Conti</h3>
              <Link
                href="/accounts"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                Gestisci
              </Link>
            </div>

            {isSummaryLoading ? (
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
                <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
              </div>
            ) : summary?.account_balances.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <Wallet className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-xs font-medium text-gray-500">
                  Nessun conto configurato
                </p>
                <Link
                  href="/accounts"
                  className="mt-3 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Crea il primo conto
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {summary?.account_balances.map((acc) => (
                  <div
                    key={acc.account_id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-3 hover:bg-gray-100/70 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-xs text-gray-600 font-bold text-xs">
                        {acc.currency}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {acc.account_name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(acc.current_balance, acc.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown Card */}
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Spese per Categoria
                </h3>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                Dettagli
              </Link>
            </div>

            {isCategoriesLoading ? (
              <div className="space-y-3">
                <div className="h-8 bg-gray-100 animate-pulse rounded-lg" />
                <div className="h-8 bg-gray-100 animate-pulse rounded-lg" />
              </div>
            ) : !categoryData?.breakdown.length ? (
              <p className="text-xs text-gray-400 text-center py-4">
                Nessuna spesa registrata nel mese corrente.
              </p>
            ) : (
              <div className="space-y-4">
                {categoryData.breakdown.slice(0, 5).map((cat, idx) => (
                  <div key={cat.category_id || idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700 truncate max-w-[150px]">
                        {cat.category_name}
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {formatCurrency(cat.total, baseCurrency)} ({cat.percentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Transactions Table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Movimenti Recenti
                </h3>
                <p className="text-xs text-gray-400">
                  Le ultime transazioni registrate
                </p>
              </div>
              <Link
                href="/transactions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition"
              >
                <span>Tutti i movimenti</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {isTxLoading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
                <ArrowLeftRight className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-600">
                  Ancora nessun movimento registrato
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Registra la tua prima entrata o spesa per iniziare a monitorare
                </p>
                <Link
                  href="/transactions"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Aggiungi movimento</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 pl-1">Tipo</th>
                      <th className="pb-3">Descrizione / Esercente</th>
                      <th className="pb-3">Data</th>
                      <th className="pb-3 text-right pr-1">Importo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentTransactions.map((tx) => {
                      const isIncome = tx.type === "INCOME";
                      const isTransfer = tx.type === "TRANSFER";

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-gray-50/70 transition"
                        >
                          {/* Type Icon */}
                          <td className="py-3.5 pl-1">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                isIncome
                                  ? "bg-green-50 text-green-600"
                                  : isTransfer
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : isTransfer ? (
                                <ArrowRightLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                          </td>

                          {/* Description & Payee */}
                          <td className="py-3.5">
                            <div className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-[280px]">
                              {tx.payee || tx.description || "Movimento senza nome"}
                            </div>
                            {tx.description && tx.payee && (
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                {tx.description}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>

                          {/* Amount */}
                          <td
                            className={`py-3.5 pr-1 text-right font-bold whitespace-nowrap ${
                              isIncome
                                ? "text-green-600"
                                : isTransfer
                                ? "text-blue-600"
                                : "text-gray-900"
                            }`}
                          >
                            {isIncome ? "+" : isTransfer ? "" : "-"}
                            {formatCurrency(tx.amount, baseCurrency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

