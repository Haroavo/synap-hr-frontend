"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  IdCard,
  KeyRound,
  LogIn,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DEPARTED";

type ContractStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ENDED" | "CANCELLED";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type DepartmentInfo = {
  _id: string;
  code: string;
  name: string;
  active: boolean;

  parentDepartment?: {
    _id: string;
    code: string;
    name: string;
    active: boolean;
  } | null;
};

type PositionInfo = {
  _id: string;
  code: string;
  title: string;
  level: number;
  active: boolean;
};

type ManagerInfo = {
  _id: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  status: EmployeeStatus;
  profilePictureUrl?: string | null;
};

type EmployeeInfo = {
  _id: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  hireDate: string;
  status: EmployeeStatus;
  profilePictureUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  department: DepartmentInfo | null;
  position: PositionInfo | null;
  manager: ManagerInfo | null;
};

type ContractTypeInfo = {
  _id: string;
  code: string;
  label: string;
  requiresEndDate: boolean;
  active: boolean;
};

type ContractInfo = {
  _id: string;
  contractNumber: string;
  startDate: string;
  endDate?: string | null;
  probationEndDate?: string | null;
  status: ContractStatus;
  documentUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  contractType: ContractTypeInfo | null;
};

type ScheduleTimeSlot = {
  startTime: string;
  endTime: string;
  work: boolean;
};

type ScheduleDay = {
  day: DayOfWeek;
  timeSlots: ScheduleTimeSlot[];
};

type ScheduleInfo = {
  _id: string;
  timezone: string;
  active: boolean;
  days: ScheduleDay[];

  summary: {
    workingDays: number;
    restDays: number;
    weeklyWorkMinutes: number;
    weeklyBreakMinutes: number;
  };
};

type AccountInfo = {
  _id: string;
  username: string;
  roles: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type EmployeeProfileResponse = {
  employee: EmployeeInfo;
  activeContract: ContractInfo | null;
  contracts: ContractInfo[];
  schedule: ScheduleInfo | null;
  account: AccountInfo | null;
};

/*
 * ============================================================
 * LIBELLÉS
 * ============================================================
 */

const employeeStatusLabels: Record<EmployeeStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  DEPARTED: "Parti",
};

const contractStatusLabels: Record<ContractStatus, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  ENDED: "Terminé",
  CANCELLED: "Annulé",
};

const dayLabels: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",

  ADMIN: "Administrateur",

  HR_MANAGER: "Responsable RH",

  MANAGER: "Manager",

  EMPLOYEE: "Employé",
};

/*
 * ============================================================
 * UTILITAIRES
 * ============================================================
 */

function formatDate(value?: string | null): string {
  if (!value) {
    return "Non renseigné";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Jamais";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Non renseigné";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function getInitials(firstName: string, lastName: string): string {
  const firstInitial = firstName?.charAt(0) ?? "";

  const lastInitial = lastName?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function calculateSeniority(hireDateValue: string): string {
  const hireDate = new Date(hireDateValue);

  if (Number.isNaN(hireDate.getTime())) {
    return "Non disponible";
  }

  const today = new Date();

  let months =
    (today.getFullYear() - hireDate.getFullYear()) * 12 +
    today.getMonth() -
    hireDate.getMonth();

  if (today.getDate() < hireDate.getDate()) {
    months -= 1;
  }

  months = Math.max(0, months);

  const years = Math.floor(months / 12);

  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? "s" : ""}`;
  }

  return `${years} an${years > 1 ? "s" : ""} et ${remainingMonths} mois`;
}

function createPhoneHref(phone: string): string {
  const normalized = phone.replace(/[^\d+]/g, "");

  return `tel:${normalized}`;
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function EmployeeProfilePage() {
  const params = useParams<{
    employeeId: string;
  }>();

  const router = useRouter();

  const employeeId = params.employeeId;

  const [profile, setProfile] = useState<EmployeeProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * CHARGEMENT DU PROFIL
   * ============================================================
   */

  const loadProfile = useCallback(
    async (signal?: AbortSignal) => {
      if (!employeeId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/employees/${employeeId}/profile`, {
          method: "GET",

          cache: "no-store",

          signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message ?? "Impossible de charger le profil.");
        }

        setProfile(data);
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
    },
    [employeeId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadProfile(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProfile]);

  const seniority = useMemo(
    () => (profile ? calculateSeniority(profile.employee.hireDate) : ""),
    [profile],
  );

  if (loading) {
    return <ProfileLoader />;
  }

  if (error) {
    return <ProfileError message={error} onRetry={() => void loadProfile()} />;
  }

  if (!profile) {
    return <ProfileEmpty />;
  }

  const { employee, activeContract, contracts, schedule, account } = profile;

  return (
    <div className="h-full min-h-0 overflow-auto p-5 lg:p-7">
      {/* ====================================================== */}
      {/* NAVIGATION */}
      {/* ====================================================== */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className={[
            "flex h-10",
            "items-center gap-2",
            "rounded-xl",
            "bg-white px-4",
            "text-sm font-medium",
            "text-slate-600",
            "shadow-sm",
            "transition",
            "hover:bg-slate-50",
            "hover:text-slate-900",
          ].join(" ")}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/employees/${employee._id}/schedule`)}
            className={[
              "flex h-10",
              "items-center gap-2",
              "rounded-xl",
              "bg-white px-4",
              "text-sm font-medium",
              "text-slate-700",
              "shadow-sm",
              "transition",
              "hover:bg-slate-50",
            ].join(" ")}
          >
            <CalendarClock className="h-4 w-4" />
            Voir le planning
          </button>

          <button
            type="button"
            onClick={() => router.push(`/employees/${employee._id}/edit`)}
            className={[
              "flex h-10",
              "items-center gap-2",
              "rounded-xl",
              "bg-app-primary px-4",
              "text-sm font-semibold",
              "text-white",
              "transition",
              "hover:opacity-90",
            ].join(" ")}
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* CARTE PRINCIPALE */}
      {/* ====================================================== */}

      <section
        className={[
          "mb-5",
          "overflow-hidden",
          "rounded-[28px]",
          "bg-white",
          "shadow-[0_12px_40px_rgba(15,23,42,0.08)]",
        ].join(" ")}
      >
        {/* Bannière */}

        <div
          className={[
            "relative h-36",
            "overflow-hidden",
            "bg-[linear-gradient(120deg,var(--color-sidebar),var(--color-primary))]",
          ].join(" ")}
        >
          {/* Décorations */}

          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10" />

          <div className="absolute right-44 top-16 h-28 w-28 rounded-full bg-white/5" />

          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/5" />

          {/* Matricule */}

          <div className="absolute right-5 top-5 sm:right-7 sm:top-6">
            <div
              className={[
                "flex items-center gap-3",
                "rounded-2xl",
                "border border-white/15",
                "bg-white/10",
                "px-4 py-2.5",
                "text-white",
                "shadow-sm",
                "backdrop-blur-md",
              ].join(" ")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <IdCard className="h-4 w-4 text-white/90" />
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">
                  Matricule
                </p>

                <p className="mt-0.5 text-sm font-semibold">
                  {employee.badgeNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu blanc */}

        <div className="relative px-6 pb-7 pt-16 sm:px-8">
          {/* Avatar */}

          <div
            className={[
              "absolute",
              "-top-14 left-6",
              "flex h-28 w-28",
              "items-center",
              "justify-center",
              "overflow-hidden",
              "rounded-[26px]",
              "border-[5px]",
              "border-white",
              "bg-blue-50",
              "text-3xl font-bold",
              "text-app-primary",
              "shadow-[0_10px_28px_rgba(15,23,42,0.18)]",
              "sm:left-8",
            ].join(" ")}
          >
            {employee.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.profilePictureUrl}
                alt={employee.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(employee.firstName, employee.lastName)
            )}
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            {/* Nom et poste */}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="break-words text-2xl font-bold text-app-text lg:text-3xl">
                  {employee.fullName}
                </h1>

                <EmployeeStatusBadge status={employee.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <BriefcaseBusiness className="h-4 w-4 shrink-0 text-app-primary" />

                  <span className="font-semibold text-slate-700">
                    {employee.position?.title ?? "Poste non attribué"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 shrink-0 text-slate-400" />

                  <span className="text-slate-500">
                    {employee.department?.name ?? "Département non attribué"}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations rapides */}

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[390px]">
              <QuickInformation
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date d'embauche"
                value={formatDate(employee.hireDate)}
                variant="blue"
              />

              <QuickInformation
                icon={<Clock3 className="h-4 w-4" />}
                label="Ancienneté"
                value={seniority}
                variant="purple"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* RÉSUMÉ */}
      {/* ====================================================== */}

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Date d’embauche"
          value={formatDate(employee.hireDate)}
          variant="blue"
        />

        <SummaryCard
          icon={<Clock3 className="h-5 w-5" />}
          label="Ancienneté"
          value={seniority}
          variant="purple"
        />

        <SummaryCard
          icon={<FileText className="h-5 w-5" />}
          label="Contrat actuel"
          value={activeContract?.contractType?.code ?? "Aucun contrat actif"}
          variant="orange"
        />

        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Travail hebdomadaire"
          value={
            schedule
              ? formatMinutes(schedule.summary.weeklyWorkMinutes)
              : "Non configuré"
          }
          variant="green"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ==================================================== */}
        {/* COLONNE PRINCIPALE */}
        {/* ==================================================== */}

        <div className="space-y-5">
          {/* Informations personnelles */}

          <ProfileSection
            icon={<UserRound className="h-5 w-5" />}
            title="Informations personnelles"
            description="Coordonnées et informations principales de l’employé."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileInfoCard
                icon={<IdCard className="h-5 w-5" />}
                label="Matricule"
                value={employee.badgeNumber}
                iconClassName="bg-blue-50 text-blue-600"
              />

              <ProfileInfoCard
                icon={<UserRound className="h-5 w-5" />}
                label="Nom complet"
                value={employee.fullName}
                iconClassName="bg-violet-50 text-violet-600"
              />

              <ProfileInfoCard
                icon={<Mail className="h-5 w-5" />}
                label="Adresse e-mail"
                value={employee.email ?? "Non renseignée"}
                secondary={
                  employee.email ? "Cliquer pour envoyer un e-mail" : undefined
                }
                href={employee.email ? `mailto:${employee.email}` : undefined}
                iconClassName="bg-emerald-50 text-emerald-600"
              />

              <ProfileInfoCard
                icon={<Phone className="h-5 w-5" />}
                label="Téléphone"
                value={employee.phone ?? "Non renseigné"}
                secondary={employee.phone ? "Cliquer pour appeler" : undefined}
                href={
                  employee.phone ? createPhoneHref(employee.phone) : undefined
                }
                iconClassName="bg-amber-50 text-amber-600"
              />

              <ProfileInfoCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="Date d'embauche"
                value={formatDate(employee.hireDate)}
                iconClassName="bg-cyan-50 text-cyan-600"
              />

              <ProfileInfoCard
                icon={<BadgeCheck className="h-5 w-5" />}
                label="Statut de l'employé"
                value={<EmployeeStatusBadge status={employee.status} />}
                iconClassName={
                  employee.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-600"
                    : employee.status === "SUSPENDED"
                      ? "bg-amber-50 text-amber-600"
                      : employee.status === "DEPARTED"
                        ? "bg-red-50 text-red-600"
                        : "bg-slate-100 text-slate-500"
                }
              />
            </div>
          </ProfileSection>

          {/* Affectation professionnelle */}

          <ProfileSection
            icon={<Building2 className="h-5 w-5" />}
            title="Affectation professionnelle"
            description="Département, poste et rattachement hiérarchique."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileInfoCard
                icon={<Building2 className="h-5 w-5" />}
                label="Département"
                value={employee.department?.name ?? "Non attribué"}
                secondary={
                  employee.department
                    ? `Code : ${employee.department.code}`
                    : undefined
                }
                iconClassName="bg-blue-50 text-blue-600"
              />

              <ProfileInfoCard
                icon={<BriefcaseBusiness className="h-5 w-5" />}
                label="Poste"
                value={employee.position?.title ?? "Non attribué"}
                secondary={
                  employee.position
                    ? `Niveau ${employee.position.level} · ${employee.position.code}`
                    : undefined
                }
                iconClassName="bg-violet-50 text-violet-600"
              />

              <ProfileInfoCard
                icon={<Building2 className="h-5 w-5" />}
                label="Département parent"
                value={
                  employee.department?.parentDepartment?.name ??
                  "Aucun département parent"
                }
                secondary={
                  employee.department?.parentDepartment
                    ? `Code : ${employee.department.parentDepartment.code}`
                    : undefined
                }
                iconClassName="bg-cyan-50 text-cyan-600"
              />

              {employee.manager ? (
                <ManagerProfileCard
                  manager={employee.manager}
                  onClick={() =>
                    router.push(`/employees/${employee.manager!._id}`)
                  }
                />
              ) : (
                <ProfileInfoCard
                  icon={<UsersRound className="h-5 w-5" />}
                  label="Responsable hiérarchique"
                  value="Aucun responsable"
                  iconClassName="bg-slate-100 text-slate-500"
                />
              )}
            </div>
          </ProfileSection>

          {/* Contrat actuel */}

          <ProfileSection
            icon={<FileText className="h-5 w-5" />}
            title="Contrat actuel"
            description="Informations liées au contrat actuellement actif."
          >
            {activeContract ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <InformationItem
                  icon={<IdCard className="h-4 w-4" />}
                  label="Numéro du contrat"
                  value={activeContract.contractNumber}
                />

                <InformationItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Type de contrat"
                  value={activeContract.contractType?.code ?? "Non renseigné"}
                  secondary={activeContract.contractType?.label}
                />

                <InformationItem
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date de début"
                  value={formatDate(activeContract.startDate)}
                />

                <InformationItem
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Date de fin"
                  value={
                    activeContract.endDate
                      ? formatDate(activeContract.endDate)
                      : "Sans date de fin"
                  }
                />

                <InformationItem
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Fin de période d’essai"
                  value={formatDate(activeContract.probationEndDate)}
                />

                <InformationItem
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Statut du contrat"
                  value={contractStatusLabels[activeContract.status]}
                />

                {activeContract.documentUrl && (
                  <a
                    href={activeContract.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={[
                      "flex items-center",
                      "gap-2",
                      "rounded-xl",
                      "bg-blue-50",
                      "px-4 py-3",
                      "text-sm font-semibold",
                      "text-app-primary",
                      "transition",
                      "hover:bg-blue-100",
                    ].join(" ")}
                  >
                    <FileText className="h-4 w-4" />
                    Consulter le document
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              <EmptySection text="Aucun contrat actif pour cet employé." />
            )}
          </ProfileSection>

          {/* Historique des contrats */}

          <ProfileSection
            icon={<Clock3 className="h-5 w-5" />}
            title="Historique des contrats"
            description="Liste des contrats associés à cet employé."
          >
            {contracts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                      <th className="px-3 py-3">Contrat</th>

                      <th className="px-3 py-3">Type</th>

                      <th className="px-3 py-3">Début</th>

                      <th className="px-3 py-3">Fin</th>

                      <th className="px-3 py-3">Statut</th>

                      <th className="px-3 py-3">Document</th>
                    </tr>
                  </thead>

                  <tbody>
                    {contracts.map((contract) => (
                      <tr
                        key={contract._id}
                        className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-4 text-sm font-medium text-slate-800">
                          {contract.contractNumber}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {contract.contractType?.code ?? "—"}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {formatDate(contract.startDate)}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-600">
                          {contract.endDate
                            ? formatDate(contract.endDate)
                            : "—"}
                        </td>

                        <td className="px-3 py-4">
                          <ContractStatusBadge status={contract.status} />
                        </td>

                        <td className="px-3 py-4">
                          {contract.documentUrl ? (
                            <a
                              href={contract.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Consulter le document"
                              className={[
                                "flex h-8 w-8",
                                "items-center",
                                "justify-center",
                                "rounded-lg",
                                "text-app-primary",
                                "transition",
                                "hover:bg-blue-50",
                              ].join(" ")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptySection text="Aucun historique de contrat." />
            )}
          </ProfileSection>
        </div>

        {/* ==================================================== */}
        {/* COLONNE SECONDAIRE */}
        {/* ==================================================== */}

        <div className="space-y-5">
          {/* Compte utilisateur */}

          <ProfileSection
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Compte utilisateur"
            description="Accès et sécurité du compte."
          >
            {account ? (
              <div className="space-y-4">
                <InformationItem
                  icon={<UserRound className="h-4 w-4" />}
                  label="Nom d’utilisateur"
                  value={account.username}
                />

                <InformationItem
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Rôles"
                  value={account.roles
                    .map((role) => roleLabels[role] ?? role)
                    .join(", ")}
                />

                <InformationItem
                  icon={<LogIn className="h-4 w-4" />}
                  label="Dernière connexion"
                  value={formatDateTime(account.lastLoginAt)}
                />

                <InformationItem
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Mot de passe modifié"
                  value={formatDateTime(account.passwordChangedAt)}
                />

                <BooleanInformation
                  label="Compte actif"
                  value={account.isActive}
                />

                <BooleanInformation
                  label="Changement de mot de passe requis"
                  value={account.mustChangePassword}
                />
              </div>
            ) : (
              <EmptySection text="Cet employé ne possède pas de compte utilisateur." />
            )}
          </ProfileSection>

          {/* Planning */}

          <ProfileSection
            icon={<CalendarClock className="h-5 w-5" />}
            title="Planning hebdomadaire"
            description="Résumé des horaires configurés."
          >
            {schedule ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <SmallMetric
                    label="Jours travaillés"
                    value={`${schedule.summary.workingDays}`}
                  />

                  <SmallMetric
                    label="Jours de repos"
                    value={`${schedule.summary.restDays}`}
                  />

                  <SmallMetric
                    label="Temps de travail"
                    value={formatMinutes(schedule.summary.weeklyWorkMinutes)}
                  />

                  <SmallMetric
                    label="Temps de pause"
                    value={formatMinutes(schedule.summary.weeklyBreakMinutes)}
                  />
                </div>

                <div className="mt-5 space-y-2">
                  {schedule.days.map((day) => {
                    const works = day.timeSlots.some((slot) => slot.work);

                    return (
                      <div
                        key={day.day}
                        className={[
                          "flex items-center",
                          "justify-between",
                          "rounded-xl",
                          "bg-slate-50",
                          "px-3 py-2.5",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {dayLabels[day.day]}
                        </span>

                        <span
                          className={[
                            "rounded-full",
                            "px-2 py-1",
                            "text-[11px]",
                            "font-medium",

                            works
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-200 text-slate-500",
                          ].join(" ")}
                        >
                          {works ? "Travaillé" : "Repos"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(`/employees/${employee._id}/schedule`)
                  }
                  className={[
                    "mt-5 flex w-full",
                    "items-center",
                    "justify-center",
                    "gap-2",
                    "rounded-xl",
                    "bg-blue-50",
                    "px-4 py-3",
                    "text-sm font-semibold",
                    "text-app-primary",
                    "transition",
                    "hover:bg-blue-100",
                  ].join(" ")}
                >
                  Voir le planning détaillé
                  <CalendarClock className="h-4 w-4" />
                </button>
              </>
            ) : (
              <EmptySection text="Aucun planning configuré." />
            )}
          </ProfileSection>

          {/* Informations système */}

          <ProfileSection
            icon={<Clock3 className="h-5 w-5" />}
            title="Informations système"
            description="Métadonnées techniques du profil."
          >
            <div className="space-y-4">
              <InformationItem
                icon={<CalendarDays className="h-4 w-4" />}
                label="Profil créé le"
                value={formatDateTime(employee.createdAt)}
              />

              <InformationItem
                icon={<Clock3 className="h-4 w-4" />}
                label="Dernière modification"
                value={formatDateTime(employee.updatedAt)}
              />

              <InformationItem
                icon={<IdCard className="h-4 w-4" />}
                label="Identifiant interne"
                value={employee._id}
              />
            </div>
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}

/*
 * ============================================================
 * COMPOSANTS VISUELS
 * ============================================================
 */

type QuickInformationProps = {
  icon: ReactNode;
  label: string;
  value: string;
  variant: "blue" | "purple";
};

const quickInformationStyles = {
  blue: "bg-blue-50 text-blue-600",

  purple: "bg-violet-50 text-violet-600",
};

function QuickInformation({
  icon,
  label,
  value,
  variant,
}: QuickInformationProps) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <div
          className={[
            "flex h-7 w-7",
            "items-center",
            "justify-center",
            "rounded-lg",
            quickInformationStyles[variant],
          ].join(" ")}
        >
          {icon}
        </div>

        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

type ProfileSectionProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
};

function ProfileSection({
  icon,
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section
      className={[
        "rounded-2xl",
        "bg-white p-5",
        "shadow-[0_6px_25px_rgba(15,23,42,0.04)]",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-app-primary">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-app-text">{title}</h2>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

/*
 * Carte d'information améliorée.
 *
 * href permet d'utiliser :
 *
 * mailto:
 * tel:
 */
type ProfileInfoCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  secondary?: string;
  href?: string;
  iconClassName?: string;
};

function ProfileInfoCard({
  icon,
  label,
  value,
  secondary,
  href,
  iconClassName = "bg-slate-100 text-slate-500",
}: ProfileInfoCardProps) {
  const content = (
    <>
      <div
        className={[
          "flex h-11 w-11",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-xl",
          iconClassName,
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-slate-400">
          {label}
        </p>

        <div className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value}
        </div>

        {secondary && (
          <p className="mt-1 text-[11px] text-slate-400">{secondary}</p>
        )}
      </div>

      {href && (
        <ChevronRight
          className={[
            "h-5 w-5",
            "shrink-0",
            "text-slate-300",
            "transition",
            "group-hover:translate-x-0.5",
            "group-hover:text-app-primary",
          ].join(" ")}
        />
      )}
    </>
  );

  const className = [
    "group",
    "flex min-h-[94px]",
    "items-center gap-3",
    "rounded-2xl",
    "border border-slate-100",
    "bg-slate-50/70",
    "p-4",
    "text-left",
    "transition-all",

    href
      ? [
          "cursor-pointer",
          "hover:-translate-y-0.5",
          "hover:border-blue-100",
          "hover:bg-white",
          "hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)]",
        ].join(" ")
      : "",
  ].join(" ");

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

/*
 * Carte du responsable hiérarchique.
 *
 * Toute la carte est cliquable.
 */
type ManagerProfileCardProps = {
  manager: ManagerInfo;
  onClick: () => void;
};

function ManagerProfileCard({ manager, onClick }: ManagerProfileCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group",
        "flex min-h-[94px]",
        "w-full",
        "items-center gap-3",
        "rounded-2xl",
        "border border-blue-100",
        "bg-blue-50/50",
        "p-4",
        "text-left",
        "transition-all",
        "hover:-translate-y-0.5",
        "hover:border-blue-200",
        "hover:bg-white",
        "hover:shadow-[0_8px_25px_rgba(15,23,42,0.08)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11",
          "shrink-0",
          "items-center",
          "justify-center",
          "overflow-hidden",
          "rounded-full",
          "bg-blue-100",
          "text-xs font-bold",
          "text-blue-600",
          "ring-4 ring-blue-50",
        ].join(" ")}
      >
        {manager.profilePictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={manager.profilePictureUrl}
            alt={manager.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          getInitials(manager.firstName, manager.lastName)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.07em] text-slate-400">
          Responsable hiérarchique
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {manager.fullName}
        </p>

        <p className="mt-1 truncate text-[11px] text-slate-400">
          {manager.badgeNumber}
          {" · "}
          Consulter le profil
        </p>
      </div>

      <ChevronRight
        className={[
          "h-5 w-5",
          "shrink-0",
          "text-slate-300",
          "transition-transform",
          "group-hover:translate-x-1",
          "group-hover:text-app-primary",
        ].join(" ")}
      />
    </button>
  );
}

type InformationItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
  secondary?: string;
};

function InformationItem({
  icon,
  label,
  value,
  secondary,
}: InformationItemProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>

        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {value}
        </p>

        {secondary && (
          <p className="mt-0.5 text-xs text-slate-400">{secondary}</p>
        )}
      </div>
    </div>
  );
}

function BooleanInformation({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
      <span className="text-sm text-slate-600">{label}</span>

      <span
        className={[
          "flex items-center",
          "gap-1.5",
          "text-xs font-semibold",

          value ? "text-emerald-600" : "text-slate-400",
        ].join(" ")}
      >
        {value ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}

        {value ? "Oui" : "Non"}
      </span>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] text-slate-400">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: string;

  variant: "blue" | "green" | "purple" | "orange";
};

const summaryStyles = {
  blue: "bg-blue-50 text-blue-600",

  green: "bg-emerald-50 text-emerald-600",

  purple: "bg-violet-50 text-violet-600",

  orange: "bg-amber-50 text-amber-600",
};

function SummaryCard({ icon, label, value, variant }: SummaryCardProps) {
  return (
    <article
      className={[
        "group",
        "flex min-h-[82px]",
        "items-center gap-3",
        "rounded-2xl",
        "bg-white px-5",
        "shadow-[0_6px_25px_rgba(15,23,42,0.04)]",
        "transition",
        "hover:-translate-y-0.5",
        "hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11",
          "shrink-0",
          "items-center",
          "justify-center",
          "rounded-xl",

          summaryStyles[variant],
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </article>
  );
}

/*
 * Badge du statut de l'employé.
 */
function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const configuration: Record<
    EmployeeStatus,
    {
      container: string;
      dot: string;
    }
  > = {
    ACTIVE: {
      container: "border-emerald-200 bg-emerald-50 text-emerald-700",

      dot: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]",
    },

    INACTIVE: {
      container: "border-slate-200 bg-slate-100 text-slate-600",

      dot: "bg-slate-400 shadow-[0_0_0_3px_rgba(148,163,184,0.15)]",
    },

    SUSPENDED: {
      container: "border-amber-200 bg-amber-50 text-amber-700",

      dot: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.14)]",
    },

    DEPARTED: {
      container: "border-red-200 bg-red-50 text-red-700",

      dot: "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
    },
  };

  const current = configuration[status];

  return (
    <span
      className={[
        "inline-flex",
        "items-center gap-2",
        "rounded-full",
        "border",
        "px-3 py-1.5",
        "text-xs font-semibold",
        current.container,
      ].join(" ")}
    >
      <span className={["h-2 w-2", "rounded-full", current.dot].join(" ")} />

      {employeeStatusLabels[status]}
    </span>
  );
}

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const styles: Record<ContractStatus, string> = {
    DRAFT: "bg-slate-100 text-slate-500",

    ACTIVE: "bg-emerald-50 text-emerald-600",

    SUSPENDED: "bg-amber-50 text-amber-600",

    ENDED: "bg-blue-50 text-blue-600",

    CANCELLED: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={[
        "inline-flex",
        "rounded-full",
        "px-2.5 py-1",
        "text-[11px]",
        "font-semibold",

        styles[status],
      ].join(" ")}
    >
      {contractStatusLabels[status]}
    </span>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function ProfileLoader() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />

        <p className="mt-3 text-sm text-slate-500">Chargement du profil...</p>
      </div>
    </div>
  );
}

function ProfileError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
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

function ProfileEmpty() {
  return (
    <div className="flex h-full min-h-[500px] items-center justify-center">
      <p className="text-sm text-slate-500">Aucun profil disponible.</p>
    </div>
  );
}
