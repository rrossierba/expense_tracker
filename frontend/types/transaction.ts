import type { components } from "./generated";

export type TransactionType = components["schemas"]["TransactionType"];
export type RecurrenceFrequency =
  components["schemas"]["RecurrenceFrequency"];
export type Transaction = components["schemas"]["TransactionResponse"];
export type TransactionCreatePayload = Omit<
  components["schemas"]["TransactionCreate"],
  "exchange_rate" | "type" | "is_cleared" | "tag_ids"
> &
  Partial<
    Pick<
      components["schemas"]["TransactionCreate"],
      "exchange_rate" | "type" | "is_cleared" | "tag_ids"
    >
  >;
export type TransactionUpdatePayload =
  components["schemas"]["TransactionUpdate"];

export interface TransactionFilterParams {
  start_date?: string;
  end_date?: string;
  account_id?: string;
  category_id?: string;
  tx_type?: TransactionType;
  search?: string;
  limit?: number;
  offset?: number;
}

export type RecurringTransaction =
  components["schemas"]["RecurringTransactionResponse"];
export type RecurringTransactionCreatePayload = Omit<
  components["schemas"]["RecurringTransactionCreate"],
  "auto_create"
> &
  Partial<
    Pick<components["schemas"]["RecurringTransactionCreate"], "auto_create">
  >;
export type RecurringTransactionUpdatePayload =
  components["schemas"]["RecurringTransactionUpdate"];

