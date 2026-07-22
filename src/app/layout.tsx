import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ThemeProvider, defaultTheme } from "@/components/theme/theme-provider";

import { ConditionalAppShell } from "@/components/layout/conditional-app-shell";
import { getCurrentUser } from "@/lib/auth";

import "./globals.css";

import "@xyflow/react/dist/style.css";

export const metadata: Metadata = {
  title: "SynapRH",
  description: "Système de gestion des ressources humaines",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getCurrentUser();

  const initialTheme = defaultTheme;

  return (
    <html lang="fr">
      <body>
        <ThemeProvider initialTheme={initialTheme}>
          <ConditionalAppShell user={user}>{children}</ConditionalAppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
