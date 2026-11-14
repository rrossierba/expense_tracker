export type AccountType =
  | "CHECKING"
  | "SAVINGS"
  | "CREDIT_CARD"
  | "CASH"
  | "INVESTMENT";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  initial_balance: string | number;
  current_balance: string | number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreatePayload {
  name: string;
  type?: AccountType;
  initial_balance?: string | number;
  currency?: string;
  color?: string | null;
  icon?: string | null;
}

export interface AccountUpdatePayload {
  name?: string;
  type?: AccountType;
  color?: string | null;
  icon?: string | null;
  is_archived?: boolean;
}

