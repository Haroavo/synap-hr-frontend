"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, UserRound } from "lucide-react";
import { employeesApi } from "@/API";

type EmployeeSearchItem = {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  badgeNumber: string;
  departmentName?: string | null;
};

export function EmployeeScheduleFinder() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<EmployeeSearchItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const search = query.trim();
    const controller = new AbortController();
    setError("");

    if (search.length < 2) {
      setEmployees([]);
      setLoading(false);
      return () => controller.abort();
    }

    setEmployees([]);
    setLoading(true);
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams({
        page: "1",
        limit: "8",
        sortBy: "lastName",
        sortOrder: "asc",
        search,
      });

      void employeesApi.list(params, controller.signal)
        .then(async (response) => {
          const data = await response.json().catch(() => null) as { data?: EmployeeSearchItem[]; message?: string | string[] } | null;
          if (!response.ok) {
            const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
            throw new Error(message ?? "La recherche des employés a échoué.");
          }
          setEmployees(Array.isArray(data?.data) ? data.data : []);
        })
        .catch((cause) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "La recherche des employés a échoué.");
          setEmployees([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function openSchedule(employee: EmployeeSearchItem) {
    setOpen(false);
    setQuery("");
    router.push(`/employees/${encodeURIComponent(employee._id)}/schedule`);
  }

  return (
    <section className="relative z-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Rechercher un employé</h2>
        <p className="mt-1 text-xs text-slate-500">Recherchez par nom, prénom ou matricule pour ouvrir son planning.</p>
      </div>
      <div className="relative max-w-2xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
          placeholder="Nom, prénom ou matricule…"
          aria-label="Rechercher un employé pour afficher son planning"
          aria-expanded={open && query.trim().length >= 2}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-app-primary focus:ring-2 focus:ring-blue-100"
        />
        {open && query.trim().length > 0 && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {query.trim().length < 2 ? (
              <p className="px-3 py-3 text-sm text-slate-500">Saisissez au moins 2 caractères.</p>
            ) : loading ? (
              <p className="px-3 py-3 text-sm text-slate-500">Recherche des employés…</p>
            ) : error ? (
              <p role="alert" className="px-3 py-3 text-sm text-rose-600">{error}</p>
            ) : employees.length ? (
              employees.map((employee) => (
                <button
                  key={employee._id}
                  type="button"
                  onClick={() => openSchedule(employee)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"><UserRound className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{employee.badgeNumber}{employee.departmentName ? ` · ${employee.departmentName}` : ""}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-slate-500">Aucun employé correspondant.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
