"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";

import { Building2, Network, UsersRound } from "lucide-react";

import { OrganizationChart } from "@/components/organization-chart/organization-chart";
import { type OrganizationChartResponse } from "@/types/organization-chart";

export default function OrganizationChartPage() {
  const [response, setResponse] = useState<OrganizationChartResponse | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizationChart = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const apiResponse = await fetch("/api/employees/organization-chart", {
        method: "GET",
        cache: "no-store",
        signal,
      });

      const data = await apiResponse.json().catch(() => null);

      if (!apiResponse.ok) {
        throw new Error(
          data?.message ?? "Impossible de charger l’organigramme.",
        );
      }

      if (!data || !Array.isArray(data.data) || !data.meta) {
        throw new Error("La réponse du serveur est invalide.");
      }

      setResponse(data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setError(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadOrganizationChart(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadOrganizationChart]);

  if (loading) {
    return <OrganizationChartLoader />;
  }

  if (error) {
    return (
      <OrganizationChartError
        message={error}
        onRetry={() => void loadOrganizationChart()}
      />
    );
  }

  if (!response || response.data.length === 0) {
    return <OrganizationChartEmpty />;
  }

  return (
    <div
      className={[
        "flex h-full min-h-0",
        "flex-col",
        "overflow-y-auto",
        "overscroll-contain",
        "p-4 sm:p-5 lg:p-7",
      ].join(" ")}
      style={{
        scrollbarGutter: "stable",
      }}
    >
      {/* En-tête */}

      <header className="mb-4 shrink-0 lg:mb-5">
        <p className="text-xs text-app-muted">
          Employés
          <span className="mx-2">›</span>
          Organigramme
        </p>

        <h1 className="mt-2 text-xl font-bold text-app-text sm:text-2xl">
          Organigramme hiérarchique
        </h1>

        <p className="mt-1 text-sm text-app-muted">
          Visualisez les responsables et leurs collaborateurs.
        </p>
      </header>

      {/* Statistiques */}

      <section className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3 lg:mb-5">
        <OrganizationStatCard
          icon={<UsersRound className="h-5 w-5" />}
          label="Employés affichés"
          value={response.meta.totalEmployees}
          variant="blue"
        />

        <OrganizationStatCard
          icon={<Network className="h-5 w-5" />}
          label="Responsables principaux"
          value={response.meta.totalRoots}
          variant="purple"
        />

        <OrganizationStatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Départements"
          value={response.meta.totalDepartments}
          variant="green"
        />
      </section>

      {/*
       * L'organigramme remplit l'espace restant.
       *
       * Sur un petit écran, min-h déclenche le défilement
       * de la page uniquement lorsque cela devient nécessaire.
       */}

      <div
        className={["min-h-[500px]", "flex-1", "lg:min-h-[540px]"].join(" ")}
      >
        <OrganizationChart employees={response.data} />
      </div>
    </div>
  );
}

type OrganizationStatCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant: "blue" | "purple" | "green";
};

const statStyles = {
  blue: "bg-blue-50 text-blue-600",

  purple: "bg-violet-50 text-violet-600",

  green: "bg-emerald-50 text-emerald-600",
};

function OrganizationStatCard({
  icon,
  label,
  value,
  variant,
}: OrganizationStatCardProps) {
  return (
    <article
      className={[
        "flex min-h-[72px]",
        "items-center gap-3",
        "rounded-2xl",
        "bg-white px-4 sm:px-5",
        "shadow-[0_4px_20px_rgba(15,23,42,0.04)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-xl",
          statStyles[variant],
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-lg font-bold text-app-text">{value}</p>

        <p className="truncate text-xs text-app-muted">{label}</p>
      </div>
    </article>
  );
}

function OrganizationChartLoader() {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />

        <p className="mt-3 text-sm text-slate-500">
          Chargement de l’organigramme...
        </p>
      </div>
    </div>
  );
}

function OrganizationChartError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center p-5">
      <div className="text-center">
        <p className="text-sm font-medium text-red-600">{message}</p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-app-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

function OrganizationChartEmpty() {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center p-5">
      <div className="text-center">
        <Network className="mx-auto h-10 w-10 text-slate-300" />

        <p className="mt-3 text-sm text-slate-500">
          Aucun employé disponible pour construire l’organigramme.
        </p>
      </div>
    </div>
  );
}
