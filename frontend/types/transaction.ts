import { Tag } from "./category";

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  amount: string | number;
  exchange_rate: string | number;
  type: TransactionType;
  date: string;
  payee: string | null;
  description: string | null;
  receipt_url: string | null;
  is_cleared: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface TransactionCreatePayload {
  account_id: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount: string | number;
  exchange_rate?: string | number;
  type?: TransactionType;
  date: string;
  payee?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  is_cleared?: boolean;
  tag_ids?: string[];
}

export interface TransactionUpdatePayload {
  account_id?: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount?: string | number;
  exchange_rate?: string | number;
  type?: TransactionType;
  date?: string;
  payee?: string | null;
  description?: string | null;
  receipt_url?: string | null;
  is_cleared?: boolean;
  tag_ids?: string[];
}

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

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null;
  category_id: string | null;
  amount: string | number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  start_date: string;
  next_execution_date: string;
  end_date: string | null;
  auto_create: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransactionCreatePayload {
  account_id: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount: string | number;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  start_date: string;
  next_execution_date: string;
  end_date?: string | null;
  auto_create?: boolean;
}

export interface RecurringTransactionUpdatePayload {
  account_id?: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount?: string | number;
  type?: TransactionType;
  frequency?: RecurrenceFrequency;
  next_execution_date?: string;
  end_date?: string | null;
  auto_create?: boolean;
  is_active?: boolean;
}

