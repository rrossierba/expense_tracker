"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CircleDollarSign, Hash, Plus, Tags, Trash2 } from "lucide-react";
import { api } from "../../../lib/api-client";
import type {
  Category,
  CategoryCreatePayload,
  CategoryType,
  Tag,
  TagCreatePayload,
} from "../../../types/category";
import { PageHeader } from "../../../components/shared/page-header";
import { Modal } from "../../../components/shared/modal";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/async-state";
import {
  Field,
  FormError,
  SelectInput,
  TextInput,
  primaryButtonClass,
  secondaryButtonClass,
} from "../../../components/shared/form-controls";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Operazione non riuscita";
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [categoryModal, setCategoryModal] = useState(false);
  const [tagModal, setTagModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("EXPENSE");
  const [categoryColor, setCategoryColor] = useState("#10b981");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6366f1");

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });
  const tagsQuery = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => api.get<Tag[]>("/tags"),
  });

  const createCategory = useMutation({
    mutationFn: (payload: CategoryCreatePayload) =>
      api.post<Category>("/categories", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryModal(false);
      setCategoryName("");
    },
  });
  const archiveCategory = useMutation({
    mutationFn: (id: string) => api.delete<Category>(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
  const createTag = useMutation({
    mutationFn: (payload: TagCreatePayload) => api.post<Tag>("/tags", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tags"] });
      setTagModal(false);
      setTagName("");
    },
  });
  const deleteTag = useMutation({
    mutationFn: (id: string) => api.delete(`/tags/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });

  const submitCategory = (event: FormEvent) => {
    event.preventDefault();
    createCategory.mutate({
      name: categoryName.trim(),
      type: categoryType,
      color: categoryColor,
    });
  };
  const submitTag = (event: FormEvent) => {
    event.preventDefault();
    createTag.mutate({ name: tagName.trim(), color: tagColor });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organizzazione"
        title="Categorie e tag"
        description="Dai una struttura ai movimenti per ottenere analisi più leggibili e ricerche immediate."
      />

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-950">Categorie</h2>
              <p className="mt-1 text-xs text-gray-400">Classifica entrate e uscite.</p>
            </div>
            <button className={primaryButtonClass} onClick={() => setCategoryModal(true)}>
              <Plus className="h-4 w-4" /> Categoria
            </button>
          </div>
          {categoriesQuery.isLoading ? (
            <LoadingState />
          ) : categoriesQuery.isError ? (
            <ErrorState message={errorMessage(categoriesQuery.error)} />
          ) : !categoriesQuery.data?.length ? (
            <EmptyState icon={CircleDollarSign} title="Nessuna categoria" description="Crea categorie personali per organizzare i movimenti." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {categoriesQuery.data.map((category) => (
                <article key={category.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4">
                  <span
                    className="h-10 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color || "#94a3b8" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{category.name}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {category.type === "INCOME" ? "Entrata" : "Uscita"}
                      {category.user_id === null ? " · predefinita" : " · personale"}
                    </p>
                  </div>
                  {category.user_id !== null && (
                    <button
                      type="button"
                      aria-label={`Archivia ${category.name}`}
                      title="Archivia"
                      onClick={() => archiveCategory.mutate(category.id)}
                      className="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-950">Tag personali</h2>
              <p className="mt-1 text-xs text-gray-400">Etichette trasversali e flessibili.</p>
            </div>
            <button className={secondaryButtonClass} onClick={() => setTagModal(true)}>
              <Plus className="h-4 w-4" /> Tag
            </button>
          </div>
          {tagsQuery.isLoading ? (
            <LoadingState />
          ) : tagsQuery.isError ? (
            <ErrorState message={errorMessage(tagsQuery.error)} />
          ) : !tagsQuery.data?.length ? (
            <EmptyState icon={Tags} title="Nessun tag" description="Aggiungi un tag come Viaggio, Lavoro o Famiglia." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tagsQuery.data.map((tag) => (
                <span
                  key={tag.id}
                  className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-2 pl-3 pr-1.5 text-sm font-semibold text-gray-700"
                >
                  <Hash className="h-3.5 w-3.5" style={{ color: tag.color || "#6366f1" }} />
                  {tag.name}
                  <button
                    type="button"
                    aria-label={`Elimina tag ${tag.name}`}
                    onClick={() => deleteTag.mutate(tag.id)}
                    className="rounded-full p-1 text-gray-300 transition hover:bg-red-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title="Nuova categoria">
        <form className="space-y-5" onSubmit={submitCategory}>
          <Field label="Nome" htmlFor="category-name">
            <TextInput id="category-name" autoFocus required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Es. Casa" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="category-type">
              <SelectInput id="category-type" value={categoryType} onChange={(event) => setCategoryType(event.target.value as CategoryType)}>
                <option value="EXPENSE">Uscita</option>
                <option value="INCOME">Entrata</option>
              </SelectInput>
            </Field>
            <Field label="Colore" htmlFor="category-color">
              <TextInput id="category-color" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} className="h-[42px] p-1.5" />
            </Field>
          </div>
          <FormError message={createCategory.isError ? errorMessage(createCategory.error) : null} />
          <div className="flex justify-end gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setCategoryModal(false)}>Annulla</button>
            <button type="submit" className={primaryButtonClass} disabled={createCategory.isPending}>Crea categoria</button>
          </div>
        </form>
      </Modal>

      <Modal open={tagModal} onClose={() => setTagModal(false)} title="Nuovo tag">
        <form className="space-y-5" onSubmit={submitTag}>
          <Field label="Nome" htmlFor="tag-name">
            <TextInput id="tag-name" autoFocus required value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Es. Viaggio" />
          </Field>
          <Field label="Colore" htmlFor="tag-color">
            <TextInput id="tag-color" type="color" value={tagColor} onChange={(event) => setTagColor(event.target.value)} className="h-[42px] p-1.5" />
          </Field>
          <FormError message={createTag.isError ? errorMessage(createTag.error) : null} />
          <div className="flex justify-end gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setTagModal(false)}>Annulla</button>
            <button type="submit" className={primaryButtonClass} disabled={createTag.isPending}>Crea tag</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
