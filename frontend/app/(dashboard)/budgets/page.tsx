"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleDollarSign, Plus, Target, Trash2, Wallet } from "lucide-react";
import { api } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import type { Budget, BudgetCreatePayload, BudgetPeriod, SavingsGoal, SavingsGoalCreatePayload } from "../../../types/budget";
import type { Category } from "../../../types/category";
import { useAuth } from "../../../components/providers/auth-provider";
import { PageHeader } from "../../../components/shared/page-header";
import { Modal } from "../../../components/shared/modal";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/async-state";
import { Field, FormError, SelectInput, TextInput, primaryButtonClass, secondaryButtonClass } from "../../../components/shared/form-controls";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operazione non riuscita";
}

export default function BudgetsPage() {
  const { user } = useAuth();
  const currency = user?.base_currency ?? "EUR";
  const queryClient = useQueryClient();
  const [budgetModal, setBudgetModal] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTHLY");
  const [threshold, setThreshold] = useState("80");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  const budgetsQuery = useQuery<Budget[]>({ queryKey: ["budgets"], queryFn: () => api.get<Budget[]>("/budgets") });
  const goalsQuery = useQuery<SavingsGoal[]>({ queryKey: ["savings-goals"], queryFn: () => api.get<SavingsGoal[]>("/savings-goals") });
  const categoriesQuery = useQuery<Category[]>({ queryKey: ["categories"], queryFn: () => api.get<Category[]>("/categories") });

  const categoriesById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data]
  );

  const createBudget = useMutation({
    mutationFn: (payload: BudgetCreatePayload) => api.post<Budget>("/budgets", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setBudgetModal(false);
      setLimit("");
    },
  });
  const deleteBudget = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
  const createGoal = useMutation({
    mutationFn: (payload: SavingsGoalCreatePayload) => api.post<SavingsGoal>("/savings-goals", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      setGoalModal(false);
      setGoalName("");
      setGoalTarget("");
    },
  });
  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.delete(`/savings-goals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
  const depositGoal = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post<SavingsGoal>(`/savings-goals/${id}/deposit`, { amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] }),
  });

  const submitBudget = (event: FormEvent) => {
    event.preventDefault();
    createBudget.mutate({ category_id: categoryId || null, amount_limit: Number(limit), period, notify_threshold: Number(threshold) });
  };
  const submitGoal = (event: FormEvent) => {
    event.preventDefault();
    createGoal.mutate({ name: goalName.trim(), target_amount: Number(goalTarget), color: "#10b981", icon: "target" });
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Pianificazione" title="Budget e risparmio" description="Definisci limiti di spesa e trasforma gli obiettivi futuri in progressi misurabili." />

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="font-bold text-gray-950">Budget di spesa</h2><p className="mt-1 text-xs text-gray-400">Controlla quanto puoi ancora spendere.</p></div>
            <button className={primaryButtonClass} onClick={() => setBudgetModal(true)}><Plus className="h-4 w-4" /> Budget</button>
          </div>
          {budgetsQuery.isLoading ? <LoadingState /> : budgetsQuery.isError ? <ErrorState message={errorMessage(budgetsQuery.error)} /> : !budgetsQuery.data?.length ? (
            <EmptyState icon={CircleDollarSign} title="Nessun budget attivo" description="Imposta un limite mensile globale o dedicato a una categoria." />
          ) : (
            <div className="space-y-4">
              {budgetsQuery.data.map((budget) => {
                const progress = Math.min(Math.max(budget.usage_percentage, 0), 100);
                const warning = budget.usage_percentage >= budget.notify_threshold;
                return (
                  <article key={budget.id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-bold text-gray-900">{budget.category_id ? categoriesById.get(budget.category_id) ?? "Categoria" : "Budget globale"}</p><p className="mt-1 text-xs text-gray-400">{budget.period === "MONTHLY" ? "Mensile" : "Annuale"}</p></div>
                      <button aria-label="Elimina budget" onClick={() => deleteBudget.mutate(budget.id)} className="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-4 flex items-end justify-between"><p className="text-xl font-extrabold text-gray-950">{formatCurrency(budget.spent_amount, currency)}</p><p className="text-xs font-semibold text-gray-400">di {formatCurrency(budget.amount_limit, currency)}</p></div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full transition-all ${warning ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${progress}%` }} /></div>
                    <p className={`mt-2 text-xs font-semibold ${warning ? "text-amber-600" : "text-gray-400"}`}>{budget.usage_percentage.toFixed(0)}% utilizzato · {formatCurrency(budget.remaining_amount, currency)} disponibili</p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="font-bold text-gray-950">Obiettivi di risparmio</h2><p className="mt-1 text-xs text-gray-400">Metti da parte denaro con uno scopo.</p></div>
            <button className={secondaryButtonClass} onClick={() => setGoalModal(true)}><Plus className="h-4 w-4" /> Obiettivo</button>
          </div>
          {goalsQuery.isLoading ? <LoadingState /> : goalsQuery.isError ? <ErrorState message={errorMessage(goalsQuery.error)} /> : !goalsQuery.data?.length ? (
            <EmptyState icon={Target} title="Nessun obiettivo" description="Crea un traguardo per un viaggio, un acquisto o il fondo emergenze." />
          ) : (
            <div className="space-y-4">
              {goalsQuery.data.map((goal) => (
                <article key={goal.id} className="rounded-2xl bg-gray-950 p-5 text-white">
                  <div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><Target className="h-5 w-5" /></div><div><p className="text-sm font-bold">{goal.name}</p><p className="mt-0.5 text-xs text-gray-400">{goal.progress_percentage.toFixed(0)}% completato</p></div></div><button aria-label="Elimina obiettivo" onClick={() => deleteGoal.mutate(goal.id)} className="rounded-lg p-2 text-gray-500 transition hover:bg-white/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button></div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }} /></div>
                  <div className="mt-4 flex items-end justify-between"><p className="text-lg font-extrabold">{formatCurrency(goal.current_amount, currency)}</p><p className="text-xs text-gray-400">Obiettivo {formatCurrency(goal.target_amount, currency)}</p></div>
                  {!goal.is_completed && <button type="button" onClick={() => { const value = window.prompt("Quanto vuoi aggiungere?"); const amount = Number(value); if (amount > 0) depositGoal.mutate({ id: goal.id, amount }); }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/15"><Wallet className="h-3.5 w-3.5" /> Aggiungi fondi</button>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={budgetModal} onClose={() => setBudgetModal(false)} title="Nuovo budget" description="Riceverai un segnale visivo quando raggiungi la soglia indicata.">
        <form className="space-y-5" onSubmit={submitBudget}>
          <Field label="Categoria" htmlFor="budget-category"><SelectInput id="budget-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Tutte le spese</option>{(categoriesQuery.data ?? []).filter((item) => item.type === "EXPENSE").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Limite" htmlFor="budget-limit"><TextInput id="budget-limit" required min="0.01" step="0.01" type="number" value={limit} onChange={(event) => setLimit(event.target.value)} placeholder="500" /></Field><Field label="Periodo" htmlFor="budget-period"><SelectInput id="budget-period" value={period} onChange={(event) => setPeriod(event.target.value as BudgetPeriod)}><option value="MONTHLY">Mensile</option><option value="YEARLY">Annuale</option></SelectInput></Field></div>
          <Field label="Soglia di avviso (%)" htmlFor="budget-threshold"><TextInput id="budget-threshold" required min="1" max="100" type="number" value={threshold} onChange={(event) => setThreshold(event.target.value)} /></Field>
          <FormError message={createBudget.isError ? errorMessage(createBudget.error) : null} />
          <div className="flex justify-end gap-3"><button type="button" className={secondaryButtonClass} onClick={() => setBudgetModal(false)}>Annulla</button><button type="submit" className={primaryButtonClass} disabled={createBudget.isPending}>Crea budget</button></div>
        </form>
      </Modal>

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Nuovo obiettivo di risparmio">
        <form className="space-y-5" onSubmit={submitGoal}>
          <Field label="Nome" htmlFor="goal-name"><TextInput id="goal-name" autoFocus required value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Es. Fondo emergenze" /></Field>
          <Field label="Importo obiettivo" htmlFor="goal-target"><TextInput id="goal-target" required min="0.01" step="0.01" type="number" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} /></Field>
          <FormError message={createGoal.isError ? errorMessage(createGoal.error) : null} />
          <div className="flex justify-end gap-3"><button type="button" className={secondaryButtonClass} onClick={() => setGoalModal(false)}>Annulla</button><button type="submit" className={primaryButtonClass} disabled={createGoal.isPending}>Crea obiettivo</button></div>
        </form>
      </Modal>
    </div>
  );
}
