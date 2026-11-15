import type { components } from "./generated";

export type User = components["schemas"]["UserResponse"];
export type TokenResponse = components["schemas"]["TokenResponse"];
export type LoginCredentials = components["schemas"]["UserLogin"];
export type RegisterPayload = Omit<
  components["schemas"]["UserCreate"],
  "base_currency" | "timezone"
> &
  Partial<Pick<components["schemas"]["UserCreate"], "base_currency" | "timezone">>;

