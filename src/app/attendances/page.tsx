"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { AttendanceRecords } from "@/components/attendances/attendance-records";

type AttendanceType = "ENTER" | "EXIT";

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DEPARTED";

type EmployeeOption = {
  _id?: string;
  id?: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string | null;
  profilePictureUrl?: string | null;
  status: EmployeeStatus;
};

type EmployeesApiResponse = {
  data: EmployeeOption[];
};

type ApiErrorResponse = {
  message?: string | string[];
};

type AttendanceFormState = {
  employeeId: string;
  type: AttendanceType;
};

function getEmployeeId(employee: EmployeeOption): string {
  return employee._id ?? employee.id ?? "";
}

function getEmployeeFullName(employee: EmployeeOption): string {
  if (employee.fullName?.trim()) {
    return employee.fullName.trim();
  }

  return [employee.firstName, employee.lastName].filter(Boolean).join(" ");
}

function getEmployeeInitials(employee: EmployeeOption): string {
  const firstInitial = employee.firstName?.charAt(0) ?? "";
  const lastInitial = employee.lastName?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getErrorMessage(
  response: ApiErrorResponse | null,
  defaultMessage: string,
): string {
  if (Array.isArray(response?.message)) {
    return response.message.join(", ");
  }

  return response?.message ?? defaultMessage;
}

export default function AttendancePage() {
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [form, setForm] = useState<AttendanceFormState>({
    employeeId: "",
    type: "ENTER",
  });

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0);

  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  const activeEmployees = useMemo(() => {
    return employees
      .filter((employee) => employee.status === "ACTIVE")
      .sort((firstEmployee, secondEmployee) =>
        getEmployeeFullName(firstEmployee).localeCompare(
          getEmployeeFullName(secondEmployee),
          "fr",
        ),
      );
  }, [employees]);

  const selectedEmployee = useMemo(() => {
    return (
      activeEmployees.find(
        (employee) => getEmployeeId(employee) === form.employeeId,
      ) ?? null
    );
  }, [activeEmployees, form.employeeId]);

  const filteredEmployees = useMemo(() => {
    const query = normalizeText(employeeSearch);

    if (!query) {
      return activeEmployees.slice(0, 8);
    }

    return activeEmployees
      .filter((employee) => {
        const searchableContent = normalizeText(
          [
            getEmployeeFullName(employee),
            employee.firstName,
            employee.lastName,
            employee.badgeNumber,
            employee.email ?? "",
          ].join(" "),
        );

        return searchableContent.includes(query);
      })
      .slice(0, 10);
  }, [activeEmployees, employeeSearch]);

  const loadEmployees = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      try {
        setLoadingEmployees(true);
        setError(null);

        const response = await fetch(
          "/api/employees?page=1&limit=100&sortBy=lastName&sortOrder=asc",
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data = (await response.json().catch(() => null)) as
          | EmployeesApiResponse
          | ApiErrorResponse
          | null;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data as ApiErrorResponse | null,
              "Impossible de charger les employés.",
            ),
          );
        }

        if (!data || !("data" in data) || !Array.isArray(data.data)) {
          throw new Error("La liste des employés est invalide.");
        }

        setEmployees(data.data);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setEmployees([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossible de charger les employés.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoadingEmployees(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadEmployees(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadEmployees]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setHighlightedSuggestion(0);
  }, [employeeSearch]);

  function selectEmployee(employee: EmployeeOption): void {
    const employeeId = getEmployeeId(employee);

    if (!employeeId) {
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      employeeId,
    }));

    setEmployeeSearch(getEmployeeFullName(employee));
    setSuggestionsOpen(false);
    setHighlightedSuggestion(0);
    setError(null);
    setSuccess(null);
  }

  function clearEmployee(): void {
    setForm((currentForm) => ({
      ...currentForm,
      employeeId: "",
    }));

    setEmployeeSearch("");
    setSuggestionsOpen(true);
    setHighlightedSuggestion(0);
  }

  function handleEmployeeSearchChange(value: string): void {
    setEmployeeSearch(value);
    setSuggestionsOpen(true);
    setSuccess(null);

    if (form.employeeId) {
      setForm((currentForm) => ({
        ...currentForm,
        employeeId: "",
      }));
    }
  }

  function handleEmployeeInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (!suggestionsOpen && event.key === "ArrowDown") {
      event.preventDefault();
      setSuggestionsOpen(true);
      return;
    }

    if (!suggestionsOpen) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setHighlightedSuggestion((currentIndex) =>
        Math.min(currentIndex + 1, filteredEmployees.length - 1),
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setHighlightedSuggestion((currentIndex) => Math.max(currentIndex - 1, 0));
    }

    if (event.key === "Enter" && filteredEmployees.length > 0) {
      event.preventDefault();

      const employee = filteredEmployees[highlightedSuggestion];

      if (employee) {
        selectEmployee(employee);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSuggestionsOpen(false);
    }
  }

  function resetForm(): void {
    setForm({
      employeeId: "",
      type: "ENTER",
    });

    setEmployeeSearch("");
    setSuggestionsOpen(false);
    setHighlightedSuggestion(0);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!form.employeeId || !selectedEmployee) {
      setError("Sélectionnez un employé dans les suggestions.");
      setSuggestionsOpen(true);
      return;
    }

    try {
      setSaving(true);

      /*
       * punchedAt n'est pas envoyé.
       * Le backend utilise automatiquement new Date().
       *
       * checkpointNumber n'est pas envoyé.
       * Le backend utilise automatiquement la valeur 1.
       */
      const response = await fetch("/api/attendances", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          employeeId: form.employeeId,
          type: form.type,
        }),
      });

      const data = (await response
        .json()
        .catch(() => null)) as ApiErrorResponse | null;

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Impossible d’enregistrer le pointage."),
        );
      }

      const employeeName = getEmployeeFullName(selectedEmployee);
      const attendanceLabel = form.type === "ENTER" ? "entrée" : "sortie";

      setSuccess(
        `${employeeName} : ${attendanceLabel} enregistrée avec succès.`,
      );
      setRecordsRefreshKey((current) => current + 1);

      setForm((currentForm) => ({
        employeeId: "",
        type: currentForm.type,
      }));

      setEmployeeSearch("");
      setSuggestionsOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-5 lg:p-7">
      <header className="mx-auto mb-6 max-w-3xl">
        <p className="text-xs text-app-muted">
          Gestion du temps
          <span className="mx-2">›</span>
          Pointage
        </p>

        <h1 className="mt-2 text-2xl font-bold text-app-text">
          Nouveau pointage
        </h1>

        <p className="mt-1 text-sm text-app-muted">
          Enregistrez l’entrée ou la sortie d’un employé.
        </p>
      </header>

      <main className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className={[
            "overflow-visible",
            "rounded-[24px]",
            "bg-white",
            "shadow-[0_8px_30px_rgba(15,23,42,0.06)]",
          ].join(" ")}
        >
          <div className="rounded-t-[24px] border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-app-primary">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Informations du pointage
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  La date et l’heure sont enregistrées automatiquement.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            {/* Type de pointage */}

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Type de pointage
              </label>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm((currentForm) => ({
                      ...currentForm,
                      type: "ENTER",
                    }));

                    setSuccess(null);
                  }}
                  className={[
                    "flex min-h-[82px]",
                    "items-center gap-3",
                    "rounded-2xl",
                    "border p-4",
                    "text-left",
                    "transition",

                    form.type === "ENTER"
                      ? [
                          "border-emerald-300",
                          "bg-emerald-50",
                          "ring-2 ring-emerald-100",
                        ].join(" ")
                      : [
                          "border-slate-200",
                          "hover:border-emerald-200",
                          "hover:bg-emerald-50/40",
                        ].join(" "),
                  ].join(" ")}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <LogIn className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Entrée
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Arrivée de l’employé
                    </p>
                  </div>

                  {form.type === "ENTER" && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((currentForm) => ({
                      ...currentForm,
                      type: "EXIT",
                    }));

                    setSuccess(null);
                  }}
                  className={[
                    "flex min-h-[82px]",
                    "items-center gap-3",
                    "rounded-2xl",
                    "border p-4",
                    "text-left",
                    "transition",

                    form.type === "EXIT"
                      ? [
                          "border-orange-300",
                          "bg-orange-50",
                          "ring-2 ring-orange-100",
                        ].join(" ")
                      : [
                          "border-slate-200",
                          "hover:border-orange-200",
                          "hover:bg-orange-50/40",
                        ].join(" "),
                  ].join(" ")}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <LogOut className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Sortie
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Départ de l’employé
                    </p>
                  </div>

                  {form.type === "EXIT" && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-orange-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Recherche de l’employé */}

            <div ref={searchContainerRef} className="relative">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="attendance-employee"
                  className="text-sm font-semibold text-slate-700"
                >
                  Employé
                </label>

                <button
                  type="button"
                  onClick={() => void loadEmployees()}
                  disabled={loadingEmployees}
                  className="flex items-center gap-1.5 text-xs font-medium text-app-primary transition hover:opacity-75 disabled:opacity-50"
                >
                  <RefreshCw
                    className={[
                      "h-3.5 w-3.5",
                      loadingEmployees ? "animate-spin" : "",
                    ].join(" ")}
                  />
                  Actualiser
                </button>
              </div>

              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="attendance-employee"
                  type="text"
                  autoComplete="off"
                  value={employeeSearch}
                  disabled={loadingEmployees}
                  placeholder={
                    loadingEmployees
                      ? "Chargement des employés..."
                      : "Rechercher par nom ou matricule..."
                  }
                  onFocus={() => setSuggestionsOpen(true)}
                  onChange={(event) =>
                    handleEmployeeSearchChange(event.target.value)
                  }
                  onKeyDown={handleEmployeeInputKeyDown}
                  className={[
                    "h-12 w-full",
                    "rounded-xl",
                    "border",
                    selectedEmployee
                      ? "border-emerald-300"
                      : "border-slate-200",
                    "bg-white",
                    "pl-10 pr-20",
                    "text-sm text-slate-700",
                    "outline-none",
                    "transition",
                    "placeholder:text-slate-400",
                    "focus:border-app-primary",
                    "focus:ring-2 focus:ring-blue-100",
                    "disabled:cursor-not-allowed",
                    "disabled:bg-slate-50",
                  ].join(" ")}
                  aria-autocomplete="list"
                  aria-expanded={suggestionsOpen}
                  aria-controls="employee-suggestions"
                />

                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {employeeSearch && (
                    <button
                      type="button"
                      title="Effacer l’employé"
                      aria-label="Effacer l’employé"
                      onClick={clearEmployee}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <ChevronDown
                    className={[
                      "h-4 w-4 text-slate-400 transition",
                      suggestionsOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </div>
              </div>

              {selectedEmployee && (
                <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  Employé sélectionné : {getEmployeeFullName(selectedEmployee)}
                </div>
              )}

              {/* Suggestions */}

              {suggestionsOpen && !loadingEmployees && (
                <div
                  id="employee-suggestions"
                  role="listbox"
                  className={[
                    "absolute left-0 right-0 top-full z-50",
                    "mt-2",
                    "max-h-[300px]",
                    "overflow-y-auto",
                    "rounded-2xl",
                    "border border-slate-200",
                    "bg-white",
                    "p-2",
                    "shadow-[0_18px_50px_rgba(15,23,42,0.16)]",
                  ].join(" ")}
                >
                  {filteredEmployees.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <UserRound className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Aucun employé trouvé
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Essayez un autre nom ou matricule.
                      </p>
                    </div>
                  ) : (
                    filteredEmployees.map((employee, index) => {
                      const employeeId = getEmployeeId(employee);
                      const employeeName = getEmployeeFullName(employee);
                      const isSelected = employeeId === form.employeeId;
                      const isHighlighted = index === highlightedSuggestion;

                      return (
                        <button
                          key={employeeId}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlightedSuggestion(index)}
                          onClick={() => selectEmployee(employee)}
                          className={[
                            "flex w-full",
                            "items-center gap-3",
                            "rounded-xl",
                            "px-3 py-3",
                            "text-left",
                            "transition",

                            isSelected
                              ? "bg-blue-50"
                              : isHighlighted
                                ? "bg-slate-50"
                                : "hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-xs font-bold text-app-primary">
                            {employee.profilePictureUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={employee.profilePictureUrl}
                                alt={employeeName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getEmployeeInitials(employee)
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {employeeName}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                              <span>{employee.badgeNumber}</span>

                              {employee.email && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">
                                    {employee.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="h-5 w-5 shrink-0 text-app-primary" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Informations automatiques */}

            <div className="flex items-start gap-3 rounded-2xl bg-blue-50 px-4 py-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-app-primary" />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Enregistrement automatique
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  La date et l’heure actuelles seront utilisées. Le point de
                  pointage principal numéro 1 sera sélectionné automatiquement.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                {success}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 rounded-b-[24px] border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-7">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className={[
                "h-11 rounded-xl",
                "border border-slate-200",
                "bg-white px-5",
                "text-sm font-medium",
                "text-slate-600",
                "transition",
                "hover:bg-slate-50",
                "disabled:cursor-not-allowed",
                "disabled:opacity-50",
              ].join(" ")}
            >
              Réinitialiser
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                loadingEmployees ||
                !form.employeeId ||
                !selectedEmployee
              }
              className={[
                "flex h-11",
                "items-center gap-2",
                "rounded-xl",
                "bg-app-primary",
                "px-5",
                "text-sm font-semibold",
                "text-white",
                "transition",
                "hover:opacity-90",
                "disabled:cursor-not-allowed",
                "disabled:opacity-60",
              ].join(" ")}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Enregistrement...
                </>
              ) : form.type === "ENTER" ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Enregistrer l’entrée
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Enregistrer la sortie
                </>
              )}
            </button>
          </div>
        </form>
        </div>
        <AttendanceRecords refreshKey={recordsRefreshKey} />
      </main>
    </div>
  );
}
