"use client";

import {
  CalendarDays,
  InfinityIcon,
  Layers3,
  ShieldCheck,
  TimerReset,
} from "lucide-react";

import {
  Alert,
  ChoiceCard,
  FormField,
  Input,
  Select,
  SettingsSection,
  Switch,
} from "@/components/ui";

import type {
  BalanceExpirationRule,
  LeaveAccumulationMode,
} from "@/features/leave-settings/leave-policy";

import { useLeavePolicy } from "@/features/leave-settings/leave-policy-provider";

import { LeaveSettingsLoader } from "@/features/leave-settings/leave-settings-shell";

export default function LeaveAccumulationSettingsPage() {
  const { form, loading, updateField, updateForm } = useLeavePolicy();

  if (loading) {
    return <LeaveSettingsLoader />;
  }

  const nonCumulativeDisabled =
    form.accrualStartRule === "IMMEDIATE_BUT_BLOCKED";

  function changeAccumulationMode(mode: LeaveAccumulationMode): void {
    if (mode === "NON_CUMULATIVE" && nonCumulativeDisabled) {
      return;
    }

    updateForm((currentForm) => ({
      ...currentForm,

      accumulationMode: mode,

      balanceExpirationRule:
        mode === "NON_CUMULATIVE"
          ? "END_OF_MONTH"
          : currentForm.balanceExpirationRule === "END_OF_MONTH"
            ? "END_OF_LEAVE_YEAR"
            : currentForm.balanceExpirationRule,

      balanceExpirationYears:
        mode === "NON_CUMULATIVE" ? null : currentForm.balanceExpirationYears,
    }));
  }

  function changeExpirationRule(rule: BalanceExpirationRule): void {
    updateForm((currentForm) => ({
      ...currentForm,

      balanceExpirationRule: rule,

      balanceExpirationYears:
        rule === "AFTER_NUMBER_OF_YEARS"
          ? (currentForm.balanceExpirationYears ?? 1)
          : null,
    }));
  }

  return (
    <div className="grid gap-5">
      {nonCumulativeDisabled && (
        <Alert variant="info" title="Cumul obligatoire">
          Une politique qui acquiert les droits dès l’embauche mais les bloque
          temporairement doit conserver ces droits jusqu’à leur disponibilité.
        </Alert>
      )}

      <SettingsSection
        title="Cumul du solde"
        description="Déterminez si les jours inutilisés restent disponibles."
        icon={<Layers3 className="h-5 w-5" />}
      >
        <div
          role="radiogroup"
          aria-label="Mode de cumul"
          className="grid gap-3 md:grid-cols-2"
        >
          <ChoiceCard
            selected={form.accumulationMode === "CUMULATIVE"}
            icon={<Layers3 className="h-4 w-4" />}
            title="Congés cumulables"
            description="Les droits valides s’ajoutent au solde déjà disponible."
            onClick={() => changeAccumulationMode("CUMULATIVE")}
          />

          <ChoiceCard
            selected={form.accumulationMode === "NON_CUMULATIVE"}
            disabled={nonCumulativeDisabled}
            icon={<TimerReset className="h-4 w-4" />}
            title="Congés non cumulables"
            description="Seul le prorata du mois actuel reste disponible."
            onClick={() => changeAccumulationMode("NON_CUMULATIVE")}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Expiration du solde"
        description="Configurez la durée de conservation des droits acquis."
        icon={<TimerReset className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Règle d’expiration"
            htmlFor="expiration-rule"
            required
            hint={
              form.accumulationMode === "NON_CUMULATIVE"
                ? "Le reliquat expire obligatoirement à la fin du mois."
                : undefined
            }
          >
            <Select
              id="expiration-rule"
              value={form.balanceExpirationRule}
              disabled={form.accumulationMode === "NON_CUMULATIVE"}
              onChange={(event) =>
                changeExpirationRule(
                  event.target.value as BalanceExpirationRule,
                )
              }
            >
              <option
                value="END_OF_MONTH"
                disabled={form.accumulationMode === "CUMULATIVE"}
              >
                Fin de chaque mois
              </option>

              <option value="END_OF_LEAVE_YEAR">Fin de l’année de congé</option>

              <option value="AFTER_NUMBER_OF_YEARS">
                Après une durée définie
              </option>

              <option value="NEVER">Sans expiration</option>
            </Select>
          </FormField>

          {form.balanceExpirationRule === "AFTER_NUMBER_OF_YEARS" && (
            <FormField
              label="Durée de conservation"
              htmlFor="expiration-years"
              required
            >
              <Input
                id="expiration-years"
                type="number"
                min={1}
                max={20}
                value={form.balanceExpirationYears ?? ""}
                className="pr-24"
                endIcon={
                  <span className="whitespace-nowrap text-xs">année(s)</span>
                }
                onChange={(event) =>
                  updateField(
                    "balanceExpirationYears",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              />
            </FormField>
          )}
        </div>

        <div className="mt-5 border-t border-slate-100 pt-5">
          <Switch
            checked={form.maximumAccumulatedDaysEnabled}
            onCheckedChange={(checked) =>
              updateForm((currentForm) => ({
                ...currentForm,

                maximumAccumulatedDaysEnabled: checked,

                maximumAccumulatedDays: checked
                  ? (currentForm.maximumAccumulatedDays ?? 30)
                  : null,
              }))
            }
            label="Limiter le solde maximal"
            description="Empêche un employé de cumuler plus de jours que le plafond autorisé."
          />

          {form.maximumAccumulatedDaysEnabled && (
            <div className="mt-4 max-w-sm">
              <FormField
                label="Solde maximal autorisé"
                htmlFor="maximum-days"
                required
              >
                <Input
                  id="maximum-days"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.maximumAccumulatedDays ?? ""}
                  className="pr-16"
                  endIcon={<span className="text-xs">jours</span>}
                  onChange={(event) =>
                    updateField(
                      "maximumAccumulatedDays",
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                />
              </FormField>
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Période de congé"
        description="Définissez la période utilisée pour l’expiration annuelle."
        icon={<CalendarDays className="h-5 w-5" />}
      >
        <div
          role="radiogroup"
          aria-label="Période de congé"
          className="grid gap-3 md:grid-cols-2"
        >
          <ChoiceCard
            selected={form.leaveYearType === "CALENDAR_YEAR"}
            icon={<CalendarDays className="h-4 w-4" />}
            title="Année civile"
            description="La période va du 1er janvier au 31 décembre."
            onClick={() => updateField("leaveYearType", "CALENDAR_YEAR")}
          />

          <ChoiceCard
            selected={form.leaveYearType === "HIRE_DATE_ANNIVERSARY"}
            icon={<InfinityIcon className="h-4 w-4" />}
            title="Anniversaire d’embauche"
            description="La période recommence à la date anniversaire de chaque employé."
            onClick={() =>
              updateField("leaveYearType", "HIRE_DATE_ANNIVERSARY")
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Dépassement du solde"
        description="Déterminez si une demande peut dépasser le solde disponible."
        icon={<ShieldCheck className="h-5 w-5" />}
      >
        <Switch
          checked={form.allowNegativeBalance}
          onCheckedChange={(checked) =>
            updateForm((currentForm) => ({
              ...currentForm,

              allowNegativeBalance: checked,

              negativeBalanceLimitDays: checked
                ? Math.max(1, currentForm.negativeBalanceLimitDays)
                : 0,
            }))
          }
          label="Autoriser un solde négatif"
          description="L’employé pourra demander plus de jours que son solde disponible."
        />

        {form.allowNegativeBalance && (
          <div className="mt-4 max-w-sm">
            <FormField
              label="Dépassement maximal"
              htmlFor="negative-balance-limit"
              required
            >
              <Input
                id="negative-balance-limit"
                type="number"
                min={0.01}
                max={365}
                step={0.01}
                value={form.negativeBalanceLimitDays}
                className="pr-16"
                endIcon={<span className="text-xs">jours</span>}
                onChange={(event) =>
                  updateField(
                    "negativeBalanceLimitDays",
                    Number(event.target.value),
                  )
                }
              />
            </FormField>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
