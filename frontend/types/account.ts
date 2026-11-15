import type { components } from "./generated";

export type AccountType = components["schemas"]["AccountType"];
export type Account = components["schemas"]["AccountResponse"];
export type AccountCreatePayload = Omit<
  components["schemas"]["AccountCreate"],
  "type" | "currency" | "color" | "icon" | "initial_balance"
> &
  Partial<
    Pick<
      components["schemas"]["AccountCreate"],
      "type" | "currency" | "color" | "icon" | "initial_balance"
    >
  >;
export type AccountUpdatePayload = components["schemas"]["AccountUpdate"];

