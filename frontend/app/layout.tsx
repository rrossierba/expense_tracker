import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthProvider } from "../components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Expense Tracker | Gestione Finanziaria Personale",
  description: "Traccia entrate, spese, trasferimenti e pianifica i tuoi budget personali",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-gray-50 text-gray-900">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
