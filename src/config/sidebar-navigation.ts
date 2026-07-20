import type { LucideIcon } from "lucide-react";

import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  ContactRound,
  FileBadge2,
  FileText,
  FolderKanban,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Network,
  Palette,
  ReceiptText,
  Settings,
  ShieldCheck,
  Tags,
  TimerReset,
  UserCog,
  UsersRound,
  WalletCards,
} from "lucide-react";

export type CompanyBrand = {
  name: string;
  logoUrl?: string | null;
};

export type SubMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

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
        title: "Aperçu",
        items: [
          {
            label: "Tableau de bord",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Analyses RH",
            href: "/dashboard/analytics",
            icon: ChartNoAxesCombined,
          },
        ],
      },
    ],
  },

  {
    id: "employees",
    label: "Employés",
    icon: UsersRound,
    sections: [
      {
        title: "Gestion du personnel",
        items: [
          {
            label: "Employés",
            href: "/employees",
            icon: UsersRound,
          },
          {
            label: "Organigramme",
            href: "/dashboard/organization",
            icon: Network,
          },
          {
            label: "Contrats",
            href: "/dashboard/contracts",
            icon: FileBadge2,
          },
          {
            label: "Dossiers employés",
            href: "/dashboard/employee-files",
            icon: ContactRound,
          },
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
        title: "Structure de l’entreprise",
        items: [
          {
            label: "Départements",
            href: "/dashboard/departments",
            icon: Building2,
          },
          {
            label: "Postes",
            href: "/dashboard/positions",
            icon: BriefcaseBusiness,
          },
          {
            label: "Natures de contrat",
            href: "/dashboard/contract-types",
            icon: FileText,
          },
          {
            label: "Catégories professionnelles",
            href: "/dashboard/professional-categories",
            icon: Tags,
          },
          {
            label: "Horaires de travail",
            href: "/dashboard/work-schedules",
            icon: CalendarClock,
          },
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
        title: "Temps et activités",
        items: [
          {
            label: "Congés et absences",
            href: "/dashboard/leave",
            icon: CalendarDays,
          },
          {
            label: "Pointage",
            href: "/dashboard/attendance",
            icon: ClipboardCheck,
          },
          {
            label: "Calendrier",
            href: "/dashboard/calendar",
            icon: CalendarClock,
          },
          {
            label: "Historique",
            href: "/dashboard/attendance-history",
            icon: TimerReset,
          },
        ],
      },
    ],
  },

  {
    id: "payroll",
    label: "Paie",
    icon: WalletCards,
    sections: [
      {
        title: "Gestion de la paie",
        items: [
          {
            label: "Bulletins de paie",
            href: "/dashboard/payroll",
            icon: ReceiptText,
          },
          {
            label: "Variables de paie",
            href: "/dashboard/payroll-variables",
            icon: BarChart3,
          },
          {
            label: "Historique des paiements",
            href: "/dashboard/payroll-history",
            icon: Landmark,
          },
        ],
      },
    ],
  },

  {
    id: "documents",
    label: "Documents",
    icon: FolderKanban,
    sections: [
      {
        title: "Documents RH",
        items: [
          {
            label: "Documents employés",
            href: "/dashboard/documents",
            icon: FolderKanban,
          },
          {
            label: "Modèles de documents",
            href: "/dashboard/document-templates",
            icon: FileText,
          },
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
        title: "Personnalisation",
        items: [
          {
            label: "Apparence",
            href: "/settings/appearance",
            icon: Palette,
          },
          {
            label: "Informations entreprise",
            href: "/dashboard/settings/company",
            icon: Building2,
          },
        ],
      },
      {
        title: "Administration",
        items: [
          {
            label: "Paramètres RH",
            href: "/dashboard/settings/hr",
            icon: Settings,
          },
          {
            label: "Utilisateurs et rôles",
            href: "/dashboard/settings/users",
            icon: UserCog,
          },
          {
            label: "Sécurité",
            href: "/dashboard/settings/security",
            icon: ShieldCheck,
          },
          {
            label: "Autorisations",
            href: "/dashboard/settings/permissions",
            icon: KeyRound,
          },
        ],
      },
    ],
  },
];
