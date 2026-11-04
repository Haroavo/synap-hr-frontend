"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {
  CalendarCog,
  FlaskConical,
  Layers3,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Settings2,
  Undo2,
} from "lucide-react";

import { Alert, Badge, Button, FormActions } from "@/components/ui";

import { cn } from "@/lib/cn";

import { useLeavePolicy } from "./leave-policy-provider";

const NAVIGATION_ITEMS = [
  {
    label: "Général et acquisition",
    href: "/settings/leave-management/general",
    icon: Settings2,
  },
  {
    label: "Cumul et expiration",
    href: "/settings/leave-management/accumulation",
    icon: Layers3,
  },
  {
    label: "Simulation",
    href: "/settings/leave-management/simulation",
    icon: FlaskConical,
  },
];

export function LeaveSettingsHeader() {
  const { version, hasChanges, loading, reload } = useLeavePolicy();

  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs text-app-muted">
          Paramètres
          <span className="mx-2">›</span>
          Gestion des congés
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-app-text">
            Configuration des congés
          </h1>

          {version !== null && (
            <Badge variant="primary">Version {version}</Badge>
          )}

          {hasChanges && <Badge variant="warning">Non enregistré</Badge>}
        </div>

        <p className="mt-1 max-w-3xl text-sm text-app-muted">
          Configurez les règles appliquées aux congés annuels des employés.
        </p>
      </div>

      <Button
        variant="outline"
        loading={loading}
        leftIcon={<RefreshCw className="h-4 w-4" />}
        onClick={() => void reload()}
      >
        Actualiser
      </Button>
    </header>
  );
}

export function LeaveSettingsNavigation() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
      <div className="flex min-w-max items-center gap-2">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-2",
                "rounded-xl px-4",
                "text-sm font-medium",
                "transition",
                active
                  ? "bg-app-primary text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />

              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function LeaveSettingsMessages() {
  const { error, success, dismissError, dismissSuccess } = useLeavePolicy();

  if (!error && !success) {
    return null;
  }

  return (
    <div className="mb-5 space-y-3">
      {error && (
        <Alert
          variant="error"
          title="Une erreur est survenue"
          onClose={dismissError}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          title="Enregistrement réussi"
          onClose={dismissSuccess}
        >
          {success}
        </Alert>
      )}
    </div>
  );
}

export function LeaveSettingsActions() {
  const { hasChanges, saving, savePolicy, cancelChanges, restoreDefaults } =
    useLeavePolicy();

  return (
    <FormActions
      visible={hasChanges}
      message="Des modifications ne sont pas encore enregistrées."
    >
      <Button
        variant="secondary"
        disabled={saving}
        leftIcon={<RotateCcw className="h-4 w-4" />}
        onClick={restoreDefaults}
      >
        Valeurs par défaut
      </Button>

      <Button
        variant="outline"
        disabled={saving}
        leftIcon={<Undo2 className="h-4 w-4" />}
        onClick={cancelChanges}
      >
        Annuler
      </Button>

      <Button
        loading={saving}
        leftIcon={<Save className="h-4 w-4" />}
        onClick={() => void savePolicy()}
      >
        Enregistrer
      </Button>
    </FormActions>
  );
}

export function LeaveSettingsLoader() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-app-primary" />

        <p className="text-sm text-slate-500">Chargement des paramètres...</p>
      </div>
    </div>
  );
}

export function LeaveSettingsIcon() {
  return <CalendarCog className="h-5 w-5" />;
}
