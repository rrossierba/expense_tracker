import type { LucideIcon } from "lucide-react";
import { AlertCircle, Loader2 } from "lucide-react";

export function LoadingState({ label = "Caricamento dati…" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-medium text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/60 p-8 text-center">
      <AlertCircle className="h-7 w-7 text-red-500" />
      <p className="mt-3 text-sm font-semibold text-red-800">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-bold text-gray-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}
