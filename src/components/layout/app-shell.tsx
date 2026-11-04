"use client";

import { MainSidebar } from "@/components/layout/main-sidebar";
import { SubSidebar } from "@/components/layout/sub-sidebar";

import {
  isSubMenuItemActive,
  isSubMenuItemPatternActive,
  sidebarMenus,
  type CompanyBrand,
  type SidebarMenu,
} from "@/config/sidebar-navigation";

import { synapTheme } from "@/config/theme";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

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
    section.items.some((item) => isSubMenuItemActive(pathname, item)),
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

  const menuFromCurrentPath = useMemo(() => {
    const specificMatch = sidebarMenus.find((menu) =>
      menu.sections.some((section) =>
        section.items.some((item) => isSubMenuItemPatternActive(pathname, item)),
      ),
    );

    return specificMatch ?? sidebarMenus.find((menu) => pathMatchesMenu(pathname, menu));
  }, [pathname]);

  const [activeMenuId, setActiveMenuId] = useState(
    menuFromCurrentPath?.id ?? sidebarMenus[0].id,
  );

  const [subMenuCollapsed, setSubMenuCollapsed] = useState(false);
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  useEffect(() => {
    if (menuFromCurrentPath) {
      setActiveMenuId(menuFromCurrentPath.id);
    }
    setMobileNavigationOpen(false);
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
        <AppNavbar onOpenNavigation={() => setMobileNavigationOpen(true)} />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {mobileNavigationOpen && (
        <div
          className="fixed inset-0 z-[80] bg-[#152B3B]/35 lg:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileNavigationOpen(false);
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation SynapRH"
            className="flex h-full w-[min(88vw,360px)] flex-col overflow-hidden border-r border-[#E4EBE8] bg-white shadow-xl"
          >
            <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-[#E4EBE8] px-5">
              <div>
                <p className="text-sm font-bold tracking-tight text-[#152B3B]">SynapRH</p>
                <p className="mt-0.5 max-w-60 truncate text-xs text-[#71838D]">{company.name}</p>
              </div>
              <button
                type="button"
                aria-label="Fermer la navigation"
                onClick={() => setMobileNavigationOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-[#F4F7F6] hover:text-[#152B3B]"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <nav aria-label="Navigation mobile" className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {sidebarMenus.map((menu) => (
                <section key={menu.id} className="mb-5 last:mb-0">
                  <h2 className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#71838D]">
                    {menu.label}
                  </h2>
                  {menu.sections.map((section) => (
                    <div key={section.title} className="mt-2">
                      <p className="px-3 pb-1 text-[10px] font-semibold text-[#9AA8AE]">
                        {section.title}
                      </p>
                      <div className="grid gap-1">
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const active = isSubMenuItemActive(pathname, item);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              onClick={() => setMobileNavigationOpen(false)}
                              className={[
                                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                                active
                                  ? "bg-[#EAF5F1] text-[#16775C]"
                                  : "text-[#647783] hover:bg-[#F7FAF9] hover:text-[#152B3B]",
                              ].join(" ")}
                            >
                              <ItemIcon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
                              <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </nav>

            <footer className="shrink-0 border-t border-[#E4EBE8] px-5 py-4 text-xs text-[#71838D]">
              Connecté en tant que <span className="font-semibold text-[#152B3B]">{user.username}</span>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
