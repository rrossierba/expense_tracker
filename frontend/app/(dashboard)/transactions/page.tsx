"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "../../../lib/api-client";
import { formatCurrency, formatDate } from "../../../lib/utils";
import type { Account } from "../../../types/account";
import type { Category } from "../../../types/category";
import type {
  Transaction,
  TransactionCreatePayload,
  TransactionType,
  TransactionUpdatePayload,
} from "../../../types/transaction";
import { useAuth } from "../../../components/providers/auth-provider";
import { PageHeader } from "../../../components/shared/page-header";
import { Modal } from "../../../components/shared/modal";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/async-state";
import {
  Field,
  FormError,
  SelectInput,
  TextInput,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../../components/shared/form-controls";

const typeLabels: Record<TransactionType, string> = {
  EXPENSE: "Uscita",
  INCOME: "Entrata",
  TRANSFER: "Trasferimento",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operazione non riuscita";
}

function localDateTimeValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function dateToLocalInput(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localDateTimeValue);
  const [payee, setPayee] = useState("");
  const [description, setDescription] = useState("");

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["transactions", typeFilter],
    queryFn: () =>
      api.get<Transaction[]>("/transactions", {
        params: { limit: 100, tx_type: typeFilter === "ALL" ? undefined : typeFilter },
      }),
  });
  const accountsQuery = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: () => api.get<Account[]>("/accounts"),
  });
  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });

  const createTransaction = useMutation({
    mutationFn: (payload: TransactionCreatePayload) =>
      api.post<Transaction>("/transactions", payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-categories"] }),
      ]);
      setOpen(false);
      setAmount("");
      setPayee("");
      setDescription("");
      setDate(localDateTimeValue());
    },
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TransactionUpdatePayload }) =>
      api.patch<Transaction>(`/transactions/${id}`, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-categories"] }),
      ]);
      setOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
      ]);
    },
  });

  const accountsById = useMemo(
    () => new Map((accountsQuery.data ?? []).map((account) => [account.id, account])),
    [accountsQuery.data]
  );
  const categoriesById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category])),
    [categoriesQuery.data]
  );
  const visibleTransactions = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("it");
    if (!needle) return transactionsQuery.data ?? [];
    return (transactionsQuery.data ?? []).filter((transaction) =>
      [transaction.payee, transaction.description, categoriesById.get(transaction.category_id ?? "")?.name]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase("it").includes(needle))
    );
  }, [categoriesById, search, transactionsQuery.data]);

  const availableCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.type === (type === "INCOME" ? "INCOME" : "EXPENSE")
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload: TransactionUpdatePayload = {
      account_id: accountId,
      destination_account_id: type === "TRANSFER" ? destinationAccountId : null,
      category_id: type === "TRANSFER" || !categoryId ? null : categoryId,
      amount: Number(amount),
      type,
      date: new Date(date).toISOString(),
      payee: payee.trim() || null,
      description: description.trim() || null,
    };

    if (editingTransaction) {
      updateTransaction.mutate({ id: editingTransaction.id, payload });
    } else {
      createTransaction.mutate(payload as TransactionCreatePayload);
    }
  };

  const openForm = () => {
    setEditingTransaction(null);
    setType("EXPENSE");
    setAccountId((current) => current || accountsQuery.data?.[0]?.id || "");
    setDestinationAccountId("");
    setCategoryId("");
    setAmount("");
    setDate(localDateTimeValue());
    setPayee("");
    setDescription("");
    setOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setAccountId(transaction.account_id);
    setDestinationAccountId(transaction.destination_account_id ?? "");
    setCategoryId(transaction.category_id ?? "");
    setAmount(String(transaction.amount));
    setDate(dateToLocalInput(transaction.date));
    setPayee(transaction.payee ?? "");
    setDescription(transaction.description ?? "");
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operatività"
        title="Movimenti"
        description="Registra entrate, spese e trasferimenti. Ogni operazione aggiorna automaticamente i saldi."
        action={
          <button className={primaryButtonClass} onClick={openForm}>
            <Plus className="h-4 w-4" /> Nuovo movimento
          </button>
        }
      />

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Cerca movimenti</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca esercente, descrizione o categoria…"
              className={`${inputClass} mt-0 pl-10`}
            />
          </label>
          <SelectInput
            aria-label="Filtra per tipo"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "ALL" | TransactionType)}
            className="mt-0 sm:w-48"
          >
            <option value="ALL">Tutti i tipi</option>
            <option value="EXPENSE">Uscite</option>
            <option value="INCOME">Entrate</option>
            <option value="TRANSFER">Trasferimenti</option>
          </SelectInput>
        </div>
      </section>

      {transactionsQuery.isLoading ? (
        <LoadingState />
      ) : transactionsQuery.isError ? (
        <ErrorState message={errorMessage(transactionsQuery.error)} />
      ) : !visibleTransactions.length ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={search ? "Nessun risultato" : "Nessun movimento registrato"}
          description={
            search
              ? "Prova a modificare i termini di ricerca o il filtro selezionato."
              : "Aggiungi la prima entrata o uscita per iniziare a leggere l'andamento delle tue finanze."
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Movimento</th>
                  <th className="px-5 py-3.5">Conto</th>
                  <th className="px-5 py-3.5">Categoria</th>
                  <th className="px-5 py-3.5">Data</th>
                  <th className="px-5 py-3.5 text-right">Importo</th>
                  <th className="w-14 px-3 py-3.5"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleTransactions.map((transaction) => {
                  const isIncome = transaction.type === "INCOME";
                  const isTransfer = transaction.type === "TRANSFER";
                  const Icon = isIncome ? ArrowDownLeft : isTransfer ? ArrowRightLeft : ArrowUpRight;
                  return (
                    <tr key={transaction.id} className="transition hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              isIncome
                                ? "bg-emerald-50 text-emerald-600"
                                : isTransfer
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {transaction.payee || transaction.description || typeLabels[transaction.type]}
                            </p>
                            <p className="max-w-56 truncate text-xs text-gray-400">
                              {transaction.description || typeLabels[transaction.type]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-600">
                        {accountsById.get(transaction.account_id)?.name ?? "Conto non disponibile"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {isTransfer
                          ? "Trasferimento"
                          : categoriesById.get(transaction.category_id ?? "")?.name ?? "Senza categoria"}
                      </td>
                      <td className="px-5 py-4 text-gray-500">{formatDate(transaction.date)}</td>
                      <td
                        className={`px-5 py-4 text-right font-extrabold ${
                          isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-gray-900"
                        }`}
                      >
                        {isIncome ? "+" : isTransfer ? "" : "−"}
                        {formatCurrency(
                          transaction.amount,
                          accountsById.get(transaction.account_id)?.currency ?? user?.base_currency ?? "EUR"
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label="Modifica movimento"
                            title="Modifica"
                            onClick={() => openEditForm(transaction)}
                            className="rounded-lg p-2 text-gray-300 transition hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Elimina movimento"
                            title="Elimina"
                            disabled={deleteTransaction.isPending}
                            onClick={() => {
                              if (window.confirm("Eliminare definitivamente questo movimento?")) {
                                deleteTransaction.mutate(transaction.id);
                              }
                            }}
                            className="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Modifica movimento" : "Registra un movimento"}
        description={
          editingTransaction
            ? "Aggiorna i dati del movimento e i saldi verranno ricalcolati."
            : "Il saldo del conto verrà aggiornato al salvataggio."
        }
      >
        {!accountsQuery.data?.length ? (
          <ErrorState message="Prima di registrare un movimento devi creare almeno un conto." />
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-2">
              {(["EXPENSE", "INCOME", "TRANSFER"] as TransactionType[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setType(item);
                    setCategoryId("");
                  }}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                    type === item
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {typeLabels[item]}
                </button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Conto" htmlFor="transaction-account">
                <SelectInput
                  id="transaction-account"
                  required
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  {(accountsQuery.data ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {formatCurrency(account.current_balance, account.currency)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Importo" htmlFor="transaction-amount">
                <TextInput
                  id="transaction-amount"
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0,00"
                />
              </Field>
            </div>
            {type === "TRANSFER" ? (
              <Field label="Conto di destinazione" htmlFor="destination-account">
                <SelectInput
                  id="destination-account"
                  required
                  value={destinationAccountId}
                  onChange={(event) => setDestinationAccountId(event.target.value)}
                >
                  <option value="">Seleziona il conto</option>
                  {(accountsQuery.data ?? [])
                    .filter((account) => account.id !== accountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </SelectInput>
              </Field>
            ) : (
              <Field label="Categoria" htmlFor="transaction-category">
                <SelectInput
                  id="transaction-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">Senza categoria</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            )}
            <Field label="Data e ora" htmlFor="transaction-date">
              <TextInput
                id="transaction-date"
                required
                type="datetime-local"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={type === "INCOME" ? "Provenienza" : "Esercente"} htmlFor="transaction-payee">
                <TextInput
                  id="transaction-payee"
                  maxLength={150}
                  value={payee}
                  onChange={(event) => setPayee(event.target.value)}
                  placeholder={type === "INCOME" ? "Es. Datore di lavoro" : "Es. Supermercato"}
                />
              </Field>
              <Field label="Nota" htmlFor="transaction-description">
                <TextInput
                  id="transaction-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Dettaglio facoltativo"
                />
              </Field>
            </div>
            <FormError
              message={
                editingTransaction
                  ? updateTransaction.isError
                    ? errorMessage(updateTransaction.error)
                    : null
                  : createTransaction.isError
                    ? errorMessage(createTransaction.error)
                    : null
              }
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => {
                  setOpen(false);
                  setEditingTransaction(null);
                }}
              >
                Annulla
              </button>
              <button
                type="submit"
                className={primaryButtonClass}
                disabled={
                  editingTransaction ? updateTransaction.isPending : createTransaction.isPending
                }
              >
                {editingTransaction
                  ? updateTransaction.isPending
                    ? "Salvataggio…"
                    : "Aggiorna movimento"
                  : createTransaction.isPending
                    ? "Salvataggio…"
                    : "Salva movimento"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
