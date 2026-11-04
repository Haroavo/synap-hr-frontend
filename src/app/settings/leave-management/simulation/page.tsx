"use client";

import { type ReactNode, useEffect, useState } from "react";

import {
  Calculator,
  CalendarCheck,
  CalendarClock,
  Clock3,
  Layers3,
  Loader2,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import {
  Alert,
  Badge,
  Button,
  FormField,
  Input,
  SettingsSection,
} from "@/components/ui";

import {
  type ApiErrorResponse,
  createLeavePolicyPayload,
  getApiErrorMessage,
  getTodayDateKey,
  hasLeavePolicyErrors,
  type LeavePolicySimulationResponse,
  type LeavePolicyValidationErrors,
  validateLeavePolicy,
} from "@/features/leave-settings/leave-policy";

import { useLeavePolicy } from "@/features/leave-settings/leave-policy-provider";

import { LeaveSettingsLoader } from "@/features/leave-settings/leave-settings-shell";

import { leavePoliciesApi } from "@/API/leave-policies.api";

/*
 * ============================================================
 * FORMATAGE
 * ============================================================
 */

const NUMBER_FORMATTER = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDays(value: number): string {
  if (!Number.isFinite(value)) {
    return "0 jour";
  }

  return `${NUMBER_FORMATTER.format(value)} jour(s)`;
}

function formatDateKey(
  dateKey: string | null,
  fallback = "Non définie",
): string {
  if (!dateKey) {
    return fallback;
  }

  const date = new Date(`${dateKey.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return DATE_FORMATTER.format(date);
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function isValidDateKey(dateKey: string): boolean {
  if (!dateKey) {
    return false;
  }

  return !Number.isNaN(parseDateKey(dateKey).getTime());
}

function getFirstPolicyError(
  errors: LeavePolicyValidationErrors,
): string | null {
  const firstError = Object.values(errors).find(
    (message) => typeof message === "string" && message.length > 0,
  );

  return firstError ?? null;
}

/*
 * ============================================================
 * PAGE
 * ============================================================
 */

export default function LeavePolicySimulationPage() {
  const { form, loading, hasChanges } = useLeavePolicy();

  const [hireDate, setHireDate] = useState("");

  const [calculationDate, setCalculationDate] = useState(getTodayDateKey());

  const [contractEndDate, setContractEndDate] = useState("");

  const [result, setResult] = useState<LeavePolicySimulationResponse | null>(
    null,
  );

  const [simulating, setSimulating] = useState(false);

  const [simulationError, setSimulationError] = useState<string | null>(null);

  /*
   * Le résultat précédent est invalidé dès qu'une
   * donnée de simulation ou une règle change.
   */
  useEffect(() => {
    setResult(null);
    setSimulationError(null);
  }, [form, hireDate, calculationDate, contractEndDate]);

  if (loading) {
    return <LeaveSettingsLoader />;
  }

  async function runSimulation(): Promise<void> {
    setResult(null);
    setSimulationError(null);

    /*
     * Validation des dates.
     */
    if (!hireDate || !calculationDate) {
      setSimulationError(
        "La date d’embauche et la date de simulation sont obligatoires.",
      );

      return;
    }

    if (!isValidDateKey(hireDate) || !isValidDateKey(calculationDate)) {
      setSimulationError("Une des dates renseignées est invalide.");

      return;
    }

    const parsedHireDate = parseDateKey(hireDate);

    const parsedCalculationDate = parseDateKey(calculationDate);

    if (parsedCalculationDate.getTime() < parsedHireDate.getTime()) {
      setSimulationError(
        "La date de simulation doit être postérieure ou égale à la date d’embauche.",
      );

      return;
    }

    if (contractEndDate) {
      if (!isValidDateKey(contractEndDate)) {
        setSimulationError(
          "La date de fin ou de rupture du contrat est invalide.",
        );

        return;
      }

      const parsedContractEndDate = parseDateKey(contractEndDate);

      if (parsedContractEndDate.getTime() < parsedHireDate.getTime()) {
        setSimulationError(
          "La date de fin du contrat ne peut pas précéder la date d’embauche.",
        );

        return;
      }
    }

    /*
     * La politique doit respecter exactement
     * les mêmes règles que lors de l'enregistrement.
     */
    const policyErrors = validateLeavePolicy(form);

    if (hasLeavePolicyErrors(policyErrors)) {
      const firstError = getFirstPolicyError(policyErrors);

      setSimulationError(
        firstError
          ? `La politique contient une erreur : ${firstError}`
          : "La politique contient des champs invalides.",
      );

      return;
    }

    /*
     * Le payload retire les anciens champs et normalise
     * les propriétés conditionnelles.
     */
    const policyPayload = createLeavePolicyPayload(form);

    try {
      setSimulating(true);

      const response = await leavePoliciesApi.simulate({
        policy: policyPayload,

        hireDate,

        calculationDate,

        contractEndDate: contractEndDate || null,
      });

      const data = (await response.json().catch(() => null)) as
        | LeavePolicySimulationResponse
        | ApiErrorResponse
        | null;

      if (!response.ok) {
        console.error("Erreur POST /api/leave-policies/simulate", {
          status: response.status,

          response: data,

          payload: {
            policy: policyPayload,

            hireDate,

            calculationDate,

            contractEndDate: contractEndDate || null,
          },
        });

        throw new Error(
          getApiErrorMessage(
            data as ApiErrorResponse | null,
            "Impossible d’effectuer la simulation.",
          ),
        );
      }

      if (!data || !("availableEarnedDays" in data)) {
        throw new Error("La réponse de simulation est invalide.");
      }

      setResult(data);
    } catch (error) {
      setSimulationError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant la simulation.",
      );
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="grid gap-5">
      {hasChanges && (
        <Alert
          variant="warning"
          title="Simulation d’une politique non enregistrée"
        >
          Le calcul utilise les valeurs actuellement affichées dans les
          formulaires, même si elles ne sont pas encore enregistrées.
        </Alert>
      )}

      {simulationError && (
        <Alert
          variant="error"
          title="Simulation impossible"
          onClose={() => setSimulationError(null)}
        >
          {simulationError}
        </Alert>
      )}

      <SettingsSection
        title="Paramètres de simulation"
        description="Calculez les droits acquis au prorata à une date précise."
        icon={<Calculator className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            label="Date d’embauche"
            htmlFor="simulation-hire-date"
            required
          >
            <Input
              id="simulation-hire-date"
              type="date"
              value={hireDate}
              max={calculationDate || undefined}
              onChange={(event) => setHireDate(event.target.value)}
            />
          </FormField>

          <FormField
            label="Date de simulation"
            htmlFor="simulation-date"
            required
          >
            <Input
              id="simulation-date"
              type="date"
              value={calculationDate}
              min={hireDate || undefined}
              onChange={(event) => setCalculationDate(event.target.value)}
            />
          </FormField>

          <FormField
            label="Fin ou rupture du contrat"
            htmlFor="contract-end-date"
            hint="Facultatif. Le calcul s’arrêtera à cette date lorsqu’elle précède la date de simulation."
          >
            <Input
              id="contract-end-date"
              type="date"
              value={contractEndDate}
              min={hireDate || undefined}
              onChange={(event) => setContractEndDate(event.target.value)}
            />
          </FormField>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">Exemple</p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Avec un taux de 2,5 jours et une rupture le 2 juillet, le droit du
            mois est calculé ainsi : 2,5 × 2 ÷ 31 = 0,16 jour.
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            loading={simulating}
            disabled={simulating || !hireDate || !calculationDate}
            leftIcon={<Calculator className="h-4 w-4" />}
            onClick={() => void runSimulation()}
          >
            Calculer le prorata
          </Button>
        </div>
      </SettingsSection>

      {result && (
        <>
          <SettingsSection
            title="Résultat du calcul"
            description="Droits générés selon la politique actuellement configurée."
            icon={<CalendarCheck className="h-5 w-5" />}
          >
            {!result.policyActive && (
              <Alert variant="warning" className="mb-5">
                La politique simulée est actuellement désactivée. Le calcul
                reste présenté uniquement à titre de simulation.
              </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SimulationCard
                icon={<CalendarClock className="h-5 w-5" />}
                label="Droits bruts acquis"
                value={formatDays(result.grossEarnedDays)}
                description="Total théorique depuis le début de l’éligibilité."
              />

              <SimulationCard
                icon={<Layers3 className="h-5 w-5" />}
                label="Droits conservés"
                value={formatDays(result.retainedEarnedDays)}
                description="Droits restants après expiration et plafond."
              />

              <SimulationCard
                icon={<ShieldCheck className="h-5 w-5" />}
                label="Droits disponibles"
                value={formatDays(result.availableEarnedDays)}
                description="Droits utilisables avant déduction des congés."
              />

              <SimulationCard
                icon={<Clock3 className="h-5 w-5" />}
                label="Ancienneté requise"
                value={result.waitingReached ? "Atteinte" : "Non atteinte"}
                description={
                  form.accrualStartRule === "IMMEDIATE"
                    ? "Aucune période d’attente."
                    : result.availabilityDate
                      ? `Disponibilité prévue le ${formatDateKey(
                          result.availabilityDate,
                        )}.`
                      : "Date de disponibilité non définie."
                }
                status={result.waitingReached ? "success" : "warning"}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ResultLine
                label="Date d’embauche"
                value={formatDateKey(result.hireDate)}
              />

              <ResultLine
                label="Date demandée"
                value={formatDateKey(result.requestedCalculationDate)}
              />

              <ResultLine
                label="Date de début d’acquisition"
                value={formatDateKey(
                  result.accrualStartDate,
                  "Acquisition non commencée",
                )}
              />

              <ResultLine
                label="Date de fin réellement utilisée"
                value={formatDateKey(result.calculationEndDate)}
              />

              <ResultLine
                label="Fin ou rupture du contrat"
                value={formatDateKey(
                  result.contractEndDate,
                  "Aucune fin renseignée",
                )}
              />

              <ResultLine
                label="Début de la période conservée"
                value={formatDateKey(
                  result.retainedPeriodStartDate,
                  "Aucune période conservée",
                )}
              />

              <ResultLine
                label="Droits avant plafond"
                value={formatDays(result.retainedEarnedDaysBeforeCap)}
              />

              <ResultLine
                label="Droits expirés"
                value={formatDays(result.expiredDays)}
              />

              <ResultLine
                label="Droits retirés par le plafond"
                value={formatDays(result.cappedDays)}
              />

              <ResultLine
                label="Date d’application de la politique"
                value={formatDateKey(result.policyEffectiveFrom)}
              />
            </div>

            <Alert variant="info" className="mt-5">
              {result.explanation}
            </Alert>

            <p className="mt-4 text-[11px] leading-5 text-slate-400">
              Ce résultat représente uniquement les droits théoriques acquis.
              Les congés consommés, les demandes réservées, les ajustements RH
              et les autres mouvements de solde ne sont pas encore déduits.
            </p>
          </SettingsSection>

          <SettingsSection
            title="Résumé de la politique"
            description="Règles utilisées pour effectuer le calcul."
            icon={<TimerReset className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ResultLine
                label="Taux mensuel"
                value={`${NUMBER_FORMATTER.format(
                  form.accrualRateDays,
                )} jour(s)`}
              />

              <ResultLine label="Base du calcul" value="Jours calendaires" />

              <ResultLine
                label="Mode de cumul"
                value={
                  form.accumulationMode === "CUMULATIVE"
                    ? "Cumulable"
                    : "Non cumulable"
                }
              />

              <ResultLine
                label="Début des droits"
                value={
                  form.accrualStartRule === "IMMEDIATE"
                    ? "Dès l’embauche"
                    : form.accrualStartRule === "AFTER_WAITING_PERIOD"
                      ? `Après ${form.waitingPeriodMonths} mois`
                      : `Acquis immédiatement, bloqués pendant ${form.waitingPeriodMonths} mois`
                }
              />

              <ResultLine
                label="Expiration"
                value={getExpirationLabel(
                  form.balanceExpirationRule,
                  form.balanceExpirationYears,
                )}
              />

              <ResultLine
                label="Période de congé"
                value={
                  form.leaveYearType === "CALENDAR_YEAR"
                    ? "Année civile"
                    : "Anniversaire d’embauche"
                }
              />

              <ResultLine
                label="Plafond"
                value={
                  form.maximumAccumulatedDaysEnabled
                    ? `${NUMBER_FORMATTER.format(
                        form.maximumAccumulatedDays ?? 0,
                      )} jours`
                    : "Aucun plafond"
                }
              />

              <ResultLine
                label="Solde négatif"
                value={
                  form.allowNegativeBalance
                    ? `Autorisé jusqu’à -${NUMBER_FORMATTER.format(
                        form.negativeBalanceLimitDays,
                      )} jours`
                    : "Non autorisé"
                }
              />

              <ResultLine
                label="État de la politique"
                value={form.active ? "Active" : "Désactivée"}
              />
            </div>
          </SettingsSection>
        </>
      )}

      {simulating && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calcul du prorata...
        </div>
      )}
    </div>
  );
}

/*
 * ============================================================
 * COMPOSANTS INTERNES
 * ============================================================
 */

function SimulationCard({
  icon,
  label,
  value,
  description,
  status,
}: {
  icon: ReactNode;

  label: string;

  value: string;

  description: string;

  status?: "success" | "warning";
}) {
  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-app-primary shadow-sm">
          {icon}
        </div>

        {status && <Badge variant={status}>{value}</Badge>}
      </div>

      <p className="mt-3 text-xs text-slate-500">{label}</p>

      {!status && (
        <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
      )}

      <p className="mt-2 text-[11px] leading-5 text-slate-400">{description}</p>
    </article>
  );
}

function ResultLine({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function getExpirationLabel(
  rule:
    | "END_OF_MONTH"
    | "END_OF_LEAVE_YEAR"
    | "AFTER_NUMBER_OF_YEARS"
    | "NEVER",
  years: number | null,
): string {
  switch (rule) {
    case "END_OF_MONTH":
      return "Fin de chaque mois";

    case "END_OF_LEAVE_YEAR":
      return "Fin de l’année de congé";

    case "AFTER_NUMBER_OF_YEARS":
      return `Après ${years ?? 1} année(s)`;

    case "NEVER":
    default:
      return "Sans expiration";
  }
}
