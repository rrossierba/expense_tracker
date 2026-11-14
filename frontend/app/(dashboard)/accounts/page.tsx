"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Plus,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { api } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import type { Account, AccountCreatePayload, AccountType } from "../../../types/account";
import { PageHeader } from "../../../components/shared/page-header";
import { Modal } from "../../../components/shared/modal";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/async-state";
import {
  Field,
  FormError,
  SelectInput,
  TextInput,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../../components/shared/form-controls";

const accountTypes: Array<{ value: AccountType; label: string }> = [
  { value: "CHECKING", label: "Conto corrente" },
  { value: "SAVINGS", label: "Conto risparmio" },
  { value: "CREDIT_CARD", label: "Carta di credito" },
  { value: "CASH", label: "Contanti" },
  { value: "INVESTMENT", label: "Investimenti" },
];

const typeMeta: Record<AccountType, { label: string; icon: typeof Landmark }> = {
  CHECKING: { label: "Conto corrente", icon: Landmark },
  SAVINGS: { label: "Risparmio", icon: Building2 },
  CREDIT_CARD: { label: "Carta di credito", icon: CreditCard },
  CASH: { label: "Contanti", icon: Banknote },
  INVESTMENT: { label: "Investimenti", icon: TrendingUp },
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operazione non riuscita";
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CHECKING");
  const [currency, setCurrency] = useState("EUR");
  const [initialBalance, setInitialBalance] = useState("0");
  const [color, setColor] = useState("#10b981");

  const accountsQuery = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => api.get<Account[]>("/accounts"),
  });

  const createAccount = useMutation({
    mutationFn: (payload: AccountCreatePayload) =>
      api.post<Account>("/accounts", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
      setOpen(false);
      setName("");
      setInitialBalance("0");
    },
  });

  const archiveAccount = useMutation({
    mutationFn: (id: string) => api.delete<Account>(`/accounts/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createAccount.mutate({
      name: name.trim(),
      type,
      currency: currency.toUpperCase(),
      initial_balance: Number(initialBalance),
      color,
    });
  };

  const totalBalance = (accountsQuery.data ?? []).reduce(
    (sum, account) => sum + Number(account.current_balance),
    0
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Patrimonio"
        title="Conti finanziari"
        description="Riunisci conti, carte e liquidità in un'unica vista aggiornata."
        action={
          <button className={primaryButtonClass} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Nuovo conto
          </button>
        }
      />

      <section className="overflow-hidden rounded-3xl bg-gray-950 p-6 text-white shadow-xl shadow-gray-200 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Saldo complessivo
            </p>
            <p className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {formatCurrency(totalBalance, accountsQuery.data?.[0]?.currency ?? "EUR")}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Somma dei saldi dei conti attivi
            </p>
          </div>
          <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 sm:flex">
            <WalletCards className="h-8 w-8" />
          </div>
        </div>
      </section>

      {accountsQuery.isLoading ? (
        <LoadingState />
      ) : accountsQuery.isError ? (
        <ErrorState message={errorMessage(accountsQuery.error)} />
      ) : !accountsQuery.data?.length ? (
        <EmptyState
          icon={Landmark}
          title="Nessun conto configurato"
          description="Crea il primo conto per iniziare a registrare movimenti e monitorare il patrimonio."
        />
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accountsQuery.data.map((account) => {
            const meta = typeMeta[account.type];
            const Icon = meta.icon;
            return (
              <article
                key={account.id}
                className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm"
                    style={{ backgroundColor: account.color || "#10b981" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    title="Archivia conto"
                    aria-label={`Archivia ${account.name}`}
                    disabled={archiveAccount.isPending}
                    onClick={() => {
                      if (window.confirm(`Archiviare il conto “${account.name}”?`)) {
                        archiveAccount.mutate(account.id);
                      }
                    }}
                    className="rounded-xl p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-5 text-sm font-bold text-gray-900">{account.name}</p>
                <p className="mt-1 text-xs text-gray-400">{meta.label}</p>
                <p className="mt-5 text-2xl font-extrabold tracking-tight text-gray-950">
                  {formatCurrency(account.current_balance, account.currency)}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400">
                  <span>Saldo iniziale</span>
                  <span className="font-semibold text-gray-600">
                    {formatCurrency(account.initial_balance, account.currency)}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Aggiungi un conto"
        description="Inserisci il saldo reale di partenza: i movimenti successivi lo aggiorneranno automaticamente."
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field label="Nome del conto" htmlFor="account-name">
            <TextInput
              id="account-name"
              required
              autoFocus
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Es. Conto principale"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipologia" htmlFor="account-type">
              <SelectInput
                id="account-type"
                value={type}
                onChange={(event) => setType(event.target.value as AccountType)}
              >
                {accountTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Valuta" htmlFor="account-currency">
              <SelectInput
                id="account-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollaro</option>
                <option value="GBP">GBP — Sterlina</option>
                <option value="CHF">CHF — Franco svizzero</option>
              </SelectInput>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Saldo iniziale" htmlFor="initial-balance">
              <TextInput
                id="initial-balance"
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(event) => setInitialBalance(event.target.value)}
              />
            </Field>
            <Field label="Colore" htmlFor="account-color">
              <TextInput
                id="account-color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-[42px] p-1.5"
              />
            </Field>
          </div>
          <FormError
            message={createAccount.isError ? errorMessage(createAccount.error) : null}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className={secondaryButtonClass} onClick={() => setOpen(false)}>
              Annulla
            </button>
            <button type="submit" className={primaryButtonClass} disabled={createAccount.isPending}>
              {createAccount.isPending ? "Salvataggio…" : "Crea conto"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
