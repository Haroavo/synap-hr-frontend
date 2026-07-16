"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import type { AuthenticatedUser } from "@/lib/auth";

type ConditionalAppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser | null;
};

const routesWithoutSidebar = [
  "/",
  "/authentication",
  "/forgot-password",
  "/reset-password",
  "/change-password",
  "/profile",
];

function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === "/";
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

export function ConditionalAppShell({
  children,
  user,
}: ConditionalAppShellProps) {
  const pathname = usePathname();

  const shouldHideSidebar = routesWithoutSidebar.some((route) =>
    matchesRoute(pathname, route),
  );

  if (shouldHideSidebar) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  const company = {
    name: "Entreprise cliente",
    logoUrl: "/images/logo_aelovis.png",
  };

  return (
    <AppShell
      company={company}
      user={{
        username: user.username,
        roles: user.roles,
      }}
    >
      {children}
    </AppShell>
  );
}
