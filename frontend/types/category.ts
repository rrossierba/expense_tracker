export type CategoryType = "INCOME" | "EXPENSE";

export interface Category {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Category[];
}

export interface CategoryCreatePayload {
  name: string;
  type?: CategoryType;
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface CategoryUpdatePayload {
  name?: string;
  type?: CategoryType;
  parent_id?: string | null;
  icon?: string | null;
  color?: string | null;
  is_archived?: boolean;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagCreatePayload {
  name: string;
  color?: string | null;
}

export interface TagUpdatePayload {
  name?: string;
  color?: string | null;
}

