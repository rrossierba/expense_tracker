export type BudgetPeriod = "MONTHLY" | "YEARLY";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount_limit: string | number;
  period: BudgetPeriod;
  notify_threshold: number;
  spent_amount: string | number;
  remaining_amount: string | number;
  usage_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetCreatePayload {
  category_id?: string | null;
  amount_limit: string | number;
  period?: BudgetPeriod;
  notify_threshold?: number;
}

export interface BudgetUpdatePayload {
  amount_limit?: string | number;
  period?: BudgetPeriod;
  notify_threshold?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: string | number;
  current_amount: string | number;
  icon: string | null;
  color: string | null;
  is_completed: boolean;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalCreatePayload {
  name: string;
  target_amount: string | number;
  icon?: string | null;
  color?: string | null;
}

export interface SavingsGoalUpdatePayload {
  name?: string;
  target_amount?: string | number;
  icon?: string | null;
  color?: string | null;
  is_completed?: boolean;
}

