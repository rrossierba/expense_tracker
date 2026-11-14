"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, BarChart3, PieChart, Scale } from "lucide-react";
import { api } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import type { CategoryBreakdownResponse, DashboardSummary, MonthlyTrendResponse } from "../../../types/analytics";
import { useAuth } from "../../../components/providers/auth-provider";
import { PageHeader } from "../../../components/shared/page-header";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/async-state";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Impossibile caricare le analisi";
}

const palette = ["#10b981", "#14b8a6", "#0ea5e9", "#6366f1", "#8b5cf6", "#f59e0b", "#f43f5e"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.base_currency ?? "EUR";
  const summaryQuery = useQuery<DashboardSummary>({ queryKey: ["dashboard-summary"], queryFn: () => api.get<DashboardSummary>("/analytics/summary") });
  const categoriesQuery = useQuery<CategoryBreakdownResponse>({ queryKey: ["dashboard-categories"], queryFn: () => api.get<CategoryBreakdownResponse>("/analytics/categories") });
  const trendsQuery = useQuery<MonthlyTrendResponse>({ queryKey: ["analytics-trends"], queryFn: () => api.get<MonthlyTrendResponse>("/analytics/trends", { params: { months: 12 } }) });

  const maxTrend = useMemo(
    () => Math.max(1, ...(trendsQuery.data?.data ?? []).flatMap((item) => [Number(item.total_income), Number(item.total_expense)])),
    [trendsQuery.data]
  );
  const savingsRate = Number(summaryQuery.data?.total_income)
    ? (Number(summaryQuery.data?.net_balance) / Number(summaryQuery.data?.total_income)) * 100
    : 0;
  const isLoading = summaryQuery.isLoading || categoriesQuery.isLoading || trendsQuery.isLoading;
  const error = summaryQuery.error || categoriesQuery.error || trendsQuery.error;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Insight" title="Analytics" description="Leggi il rapporto tra entrate, spese e risparmio per prendere decisioni più consapevoli." />

      {isLoading ? <LoadingState label="Elaborazione delle analisi…" /> : error ? <ErrorState message={errorMessage(error)} /> : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Entrate mese</p><ArrowUpRight className="h-5 w-5 text-emerald-500" /></div><p className="mt-4 text-2xl font-extrabold text-emerald-600">{formatCurrency(summaryQuery.data?.total_income ?? 0, currency)}</p></article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Spese mese</p><ArrowDownRight className="h-5 w-5 text-rose-500" /></div><p className="mt-4 text-2xl font-extrabold text-gray-950">{formatCurrency(summaryQuery.data?.total_expense ?? 0, currency)}</p></article>
            <article className="rounded-2xl bg-gray-950 p-5 text-white shadow-lg"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tasso di risparmio</p><Scale className="h-5 w-5 text-emerald-300" /></div><p className="mt-4 text-2xl font-extrabold">{savingsRate.toFixed(1)}%</p></article>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-7 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><BarChart3 className="h-5 w-5" /></div><div><h2 className="font-bold text-gray-950">Andamento ultimi 12 mesi</h2><p className="mt-0.5 text-xs text-gray-400">Entrate e uscite a confronto</p></div></div>
            {!trendsQuery.data?.data.length ? <EmptyState icon={BarChart3} title="Dati insufficienti" description="Lo storico comparirà dopo aver registrato i primi movimenti." /> : (
              <div className="overflow-x-auto pb-2">
                <div className="flex h-64 min-w-[700px] items-end gap-3 border-b border-gray-200 px-2">
                  {trendsQuery.data.data.map((item) => (
                    <div key={`${item.year}-${item.month}`} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2">
                      <div className="flex h-[82%] w-full items-end justify-center gap-1">
                        <div title={`Entrate: ${formatCurrency(item.total_income, currency)}`} className="w-[38%] rounded-t-md bg-emerald-500 transition hover:bg-emerald-600" style={{ height: `${Math.max((Number(item.total_income) / maxTrend) * 100, 2)}%` }} />
                        <div title={`Uscite: ${formatCurrency(item.total_expense, currency)}`} className="w-[38%] rounded-t-md bg-gray-300 transition hover:bg-rose-400" style={{ height: `${Math.max((Number(item.total_expense) / maxTrend) * 100, 2)}%` }} />
                      </div>
                      <span className="pb-2 text-[11px] font-semibold text-gray-400">{new Intl.DateTimeFormat("it-IT", { month: "short" }).format(new Date(item.year, item.month - 1))}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center gap-5 text-xs font-semibold text-gray-500"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Entrate</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Uscite</span></div>
              </div>
            )}
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
              <div className="mb-6 flex items-center gap-3"><PieChart className="h-5 w-5 text-emerald-600" /><h2 className="font-bold text-gray-950">Distribuzione spese</h2></div>
              {!categoriesQuery.data?.breakdown.length ? <EmptyState icon={PieChart} title="Nessuna spesa" description="Registra qualche uscita per vedere la distribuzione." /> : (
                <div className="flex flex-col items-center gap-7 sm:flex-row lg:flex-col xl:flex-row">
                  <div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${categoriesQuery.data.breakdown.map((item, index) => `${palette[index % palette.length]} ${categoriesQuery.data!.breakdown.slice(0, index).reduce((sum, current) => sum + current.percentage, 0)}% ${categoriesQuery.data!.breakdown.slice(0, index + 1).reduce((sum, current) => sum + current.percentage, 0)}%`).join(",")})` }}><div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-xs font-semibold text-gray-400">Totale</span><span className="mt-1 text-sm font-extrabold text-gray-900">{formatCurrency(categoriesQuery.data.total_expense, currency)}</span></div></div>
                  <div className="w-full space-y-3">{categoriesQuery.data.breakdown.slice(0, 7).map((item, index) => <div key={item.category_id ?? item.category_name} className="flex items-center justify-between gap-4 text-sm"><span className="flex min-w-0 items-center gap-2.5 font-medium text-gray-600"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} /><span className="truncate">{item.category_name}</span></span><span className="font-bold text-gray-900">{item.percentage.toFixed(0)}%</span></div>)}</div>
                </div>
              )}
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6"><h2 className="font-bold text-gray-950">Dettaglio per categoria</h2><p className="mt-1 text-xs text-gray-400">Categorie ordinate per incidenza sulla spesa del mese.</p><div className="mt-6 space-y-5">{categoriesQuery.data?.breakdown.map((item, index) => <div key={item.category_id ?? item.category_name}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-semibold text-gray-700">{item.category_name}</span><span className="font-bold text-gray-950">{formatCurrency(item.total, currency)}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${Math.min(item.percentage, 100)}%`, backgroundColor: palette[index % palette.length] }} /></div></div>)}</div></article>
          </section>
        </>
      )}
    </div>
  );
}
