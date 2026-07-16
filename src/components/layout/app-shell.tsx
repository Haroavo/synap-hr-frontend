"use client";

import { MainSidebar } from "@/components/layout/main-sidebar";
import { SubSidebar } from "@/components/layout/sub-sidebar";

import {
  sidebarMenus,
  type CompanyBrand,
  type SidebarMenu,
} from "@/config/sidebar-navigation";

import { synapTheme } from "@/config/theme";

import { usePathname } from "next/navigation";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AppNavbar } from "./app-navbar";

type AppShellUser = {
  username: string;
  roles: string[];
};

type AppShellProps = {
  children: ReactNode;
  company: CompanyBrand;
  user: AppShellUser;
};

function pathMatchesMenu(pathname: string, menu: SidebarMenu): boolean {
  return menu.sections.some((section) =>
    section.items.some((item) => {
      if (item.href === "/dashboard") {
        return pathname === item.href;
      }

      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }),
  );
}

function getUserInitials(username: string): string {
  return username
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({ children, company, user }: AppShellProps) {
  const pathname = usePathname();

  const menuFromCurrentPath = useMemo(
    () => sidebarMenus.find((menu) => pathMatchesMenu(pathname, menu)),
    [pathname],
  );

  const [activeMenuId, setActiveMenuId] = useState(
    menuFromCurrentPath?.id ?? sidebarMenus[0].id,
  );

  const [subMenuCollapsed, setSubMenuCollapsed] = useState(false);

  useEffect(() => {
    if (menuFromCurrentPath) {
      setActiveMenuId(menuFromCurrentPath.id);
    }
  }, [menuFromCurrentPath]);

  const activeMenu =
    sidebarMenus.find((menu) => menu.id === activeMenuId) ?? sidebarMenus[0];

  function handleSelectMenu(menuId: string) {
    setActiveMenuId(menuId);
    setSubMenuCollapsed(false);
  }

  return (
    <div
      className="flex h-dvh w-full overflow-hidden"
      style={{
        backgroundColor: synapTheme.background,
      }}
    >
      <MainSidebar
        menus={sidebarMenus}
        activeMenuId={activeMenuId}
        onSelectMenu={handleSelectMenu}
        userInitials={getUserInitials(user.username)}
      />

      <SubSidebar
        menu={activeMenu}
        company={company}
        collapsed={subMenuCollapsed}
        onToggle={() => setSubMenuCollapsed((current) => !current)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppNavbar />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
