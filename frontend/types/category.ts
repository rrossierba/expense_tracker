import type { components } from "./generated";

export type CategoryType = components["schemas"]["CategoryType"];
export type Category = components["schemas"]["CategoryResponse"];
export type CategoryCreatePayload = Omit<
  components["schemas"]["CategoryCreate"],
  "type"
> &
  Partial<Pick<components["schemas"]["CategoryCreate"], "type">>;
export type CategoryUpdatePayload = components["schemas"]["CategoryUpdate"];
export type Tag = components["schemas"]["TagResponse"];
export type TagCreatePayload = components["schemas"]["TagCreate"];
export type TagUpdatePayload = components["schemas"]["TagUpdate"];

