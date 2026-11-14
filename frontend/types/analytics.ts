export interface AccountBalance {
  account_id: string;
  account_name: string;
  currency: string;
  initial_balance: string | number;
  current_balance: string | number;
}

export interface DashboardSummary {
  period_start: string;
  period_end: string;
  total_income: string | number;
  total_expense: string | number;
  net_balance: string | number;
  net_worth: string | number;
  account_balances: AccountBalance[];
}

export interface CategoryBreakdownItem {
  category_id: string | null;
  category_name: string;
  total: string | number;
  percentage: number;
}

export interface CategoryBreakdownResponse {
  period_start: string;
  period_end: string;
  total_expense: string | number;
  breakdown: CategoryBreakdownItem[];
}

export interface MonthlyTrendItem {
  year: number;
  month: number;
  total_income: string | number;
  total_expense: string | number;
  net: string | number;
}

export interface MonthlyTrendResponse {
  months: number;
  data: MonthlyTrendItem[];
}

