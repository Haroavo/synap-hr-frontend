import type { LucideIcon } from "lucide-react";

import {
  BriefcaseBusiness,
  Building2,
  CalendarCog,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Network,
  Palette,
  Settings,
  UsersRound,
} from "lucide-react";

export type CompanyBrand = {
  name: string;
  logoUrl?: string | null;
};

export type SubMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  activePathPatterns?: string[];
};

export function isSubMenuItemActive(pathname: string, item: SubMenuItem): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const hrefMatches = item.href === "/dashboard"
    ? normalizedPath === item.href
    : normalizedPath === item.href || normalizedPath.startsWith(`${item.href}/`);

  if (hrefMatches) return true;

  return isSubMenuItemPatternActive(normalizedPath, item);
}

export function isSubMenuItemPatternActive(pathname: string, item: SubMenuItem): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return (item.activePathPatterns ?? []).some((pattern) => {
    const expression = pattern
      .split("/")
      .map((segment) => segment.startsWith(":") ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("/");
    return new RegExp(`^${expression}$`).test(normalizedPath);
  });
}

export type SubMenuSection = {
  title: string;
  items: SubMenuItem[];
};

export type SidebarMenu = {
  id: string;
  label: string;
  icon: LucideIcon;
  sections: SubMenuSection[];
};

export const sidebarMenus: SidebarMenu[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    sections: [
      {
        title: "Pilotage",
        items: [
          { label: "Vue d’ensemble", href: "/dashboard", icon: LayoutDashboard },
          { label: "Analyses RH", href: "/dashboard/analytics", icon: ChartNoAxesCombined },
        ],
      },
    ],
  },
  {
    id: "employees",
    label: "Personnel",
    icon: UsersRound,
    sections: [
      {
        title: "Gestion du personnel",
        items: [
          { label: "Employés", href: "/employees", icon: UsersRound },
          { label: "Organigramme", href: "/employees/organization-chart", icon: Network },
        ],
      },
      {
        title: "Administration RH",
        items: [
          { label: "Contrats", href: "/contracts", icon: FileText },
        ],
      },
    ],
  },
  {
    id: "attendance",
    label: "Temps et absences",
    icon: CalendarDays,
    sections: [
      {
        title: "Suivi du temps",
        items: [
          { label: "Calendrier RH", href: "/dashboard/calendar", icon: CalendarClock },
          {
            label: "Planning des employés",
            href: "/employee-schedules",
            icon: CalendarRange,
            activePathPatterns: ["/employees/:employeeId/schedule"],
          },
          { label: "Pointages", href: "/attendances", icon: ClipboardCheck },
          { label: "Congés et absences", href: "/leave-management/requests", icon: CalendarDays },
        ],
      },
    ],
  },
  {
    id: "company",
    label: "Structure de l’entreprise",
    icon: Building2,
    sections: [
      {
        title: "Référentiel entreprise",
        items: [
          { label: "Départements", href: "/dashboard/departments", icon: Building2 },
          { label: "Postes", href: "/dashboard/positions", icon: BriefcaseBusiness },
          { label: "Types de contrat", href: "/dashboard/contract-types", icon: FileText },
        ],
      },
    ],
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    sections: [
      {
        title: "Préférences",
        items: [
          { label: "Apparence", href: "/settings/appearance", icon: Palette },
        ],
      },
      {
        title: "Règles RH",
        items: [
          { label: "Gestion des congés et absences", href: "/settings/leave-management", icon: CalendarCog },
        ],
      },
    ],
  },
];
