"use client";

import {
  sidebarMenus,
  type SidebarMenu,
  type SubMenuItem,
} from "@/config/sidebar-navigation";
import { synapTheme } from "@/config/theme";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type CurrentNavigation = {
  parentMenu: SidebarMenu | null;
  currentItem: SubMenuItem | null;
};

function routeMatches(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentNavigation(pathname: string): CurrentNavigation {
  let selectedMenu: SidebarMenu | null = null;
  let selectedItem: SubMenuItem | null = null;
  let longestMatchingPath = 0;

  for (const menu of sidebarMenus) {
    for (const section of menu.sections) {
      for (const item of section.items) {
        if (
          routeMatches(pathname, item.href) &&
          item.href.length > longestMatchingPath
        ) {
          selectedMenu = menu;
          selectedItem = item;
          longestMatchingPath = item.href.length;
        }
      }
    }
  }

  return {
    parentMenu: selectedMenu,
    currentItem: selectedItem,
  };
}

function formatPathSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AppNavbar() {
  const pathname = usePathname();

  const { parentMenu, currentItem } = getCurrentNavigation(pathname);

  const fallbackLabel = formatPathSegment(
    pathname.split("/").filter(Boolean).at(-1) ?? "Accueil",
  );

  return (
    <header
      className="flex h-16 shrink-0 items-center border-b bg-white px-5 lg:px-7"
      style={{
        borderColor: synapTheme.border,
      }}
    >
      <nav
        aria-label="Fil d’Ariane"
        className="flex min-w-0 items-center gap-2"
      >
        <Link
          href="/dashboard"
          aria-label="Accueil"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#EAF6FF] hover:text-[#218BE4]"
        >
          <Home className="h-[17px] w-[17px]" strokeWidth={1.8} />
        </Link>

        {parentMenu && (
          <>
            <ChevronRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-slate-300"
              strokeWidth={1.8}
            />

            <span className="hidden max-w-52 truncate text-sm font-medium text-slate-500 sm:block">
              {parentMenu.label}
            </span>
          </>
        )}

        <ChevronRight
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-slate-300"
          strokeWidth={1.8}
        />

        <span
          aria-current="page"
          className="min-w-0 truncate text-sm font-semibold"
          style={{
            color: synapTheme.text,
          }}
        >
          {currentItem?.label ?? fallbackLabel}
        </span>
      </nav>
    </header>
  );
}
