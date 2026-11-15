import type { components } from "./generated";

export type BudgetPeriod = components["schemas"]["BudgetPeriod"];
export type Budget = components["schemas"]["BudgetResponse"];
export type BudgetCreatePayload = Omit<
  components["schemas"]["BudgetCreate"],
  "period" | "notify_threshold"
> &
  Partial<
    Pick<components["schemas"]["BudgetCreate"], "period" | "notify_threshold">
  >;
export type BudgetUpdatePayload = components["schemas"]["BudgetUpdate"];
export type SavingsGoal = components["schemas"]["SavingsGoalResponse"];
export type SavingsGoalCreatePayload = components["schemas"]["SavingsGoalCreate"];
export type SavingsGoalUpdatePayload = components["schemas"]["SavingsGoalUpdate"];

