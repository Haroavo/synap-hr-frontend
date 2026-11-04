"use client";

import {
  Calculator,
  CalendarClock,
  Clock3,
  FileCog,
  Power,
} from "lucide-react";

import {
  Alert,
  ChoiceCard,
  FormField,
  Input,
  SettingsSection,
  Switch,
} from "@/components/ui";

import type { LeaveAccrualStartRule } from "@/features/leave-settings/leave-policy";

import { useLeavePolicy } from "@/features/leave-settings/leave-policy-provider";

import { LeaveSettingsLoader } from "@/features/leave-settings/leave-settings-shell";

export default function GeneralLeaveSettingsPage() {
  const { form, loading, validationErrors, updateField, updateForm } =
    useLeavePolicy();

  if (loading) {
    return <LeaveSettingsLoader />;
  }

  function changeAccrualStartRule(rule: LeaveAccrualStartRule): void {
    updateForm((currentForm) => {
      const requiresWaitingPeriod = rule !== "IMMEDIATE";

      const isBlockedAccrual = rule === "IMMEDIATE_BUT_BLOCKED";

      return {
        ...currentForm,

        accrualStartRule: rule,

        waitingPeriodMonths: requiresWaitingPeriod
          ? Math.max(
              1,
              Number.isFinite(currentForm.waitingPeriodMonths)
                ? currentForm.waitingPeriodMonths
                : 12,
            )
          : 0,

        /*
         * Les droits acquis mais bloqués doivent
         * rester cumulables jusqu’à leur disponibilité.
         */
        accumulationMode: isBlockedAccrual
          ? "CUMULATIVE"
          : currentForm.accumulationMode,

        balanceExpirationRule:
          isBlockedAccrual &&
          currentForm.balanceExpirationRule === "END_OF_MONTH"
            ? "END_OF_LEAVE_YEAR"
            : currentForm.balanceExpirationRule,
      };
    });
  }

  return (
    <div className="grid gap-5">
      <Alert variant="info" title="Acquisition dynamique au prorata">
        Aucun quota complet de 2,5 jours n’est ajouté automatiquement au début
        du mois. Les droits sont calculés selon les jours calendaires réellement
        écoulés.
      </Alert>

      <SettingsSection
        title="Informations générales"
        description="Définissez le nom, l’état et la date d’application de la politique."
        icon={<FileCog className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Nom de la politique"
            htmlFor="leave-policy-name"
            required
            error={validationErrors.name}
          >
            <Input
              id="leave-policy-name"
              type="text"
              value={form.name}
              invalid={Boolean(validationErrors.name)}
              placeholder="Politique de congé annuel"
              maxLength={100}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </FormField>

          <FormField
            label="Date d’entrée en vigueur"
            htmlFor="effective-from"
            required
            hint="Les droits antérieurs à cette date ne seront pas calculés avec cette politique."
            error={validationErrors.effectiveFrom}
          >
            <Input
              id="effective-from"
              type="date"
              value={form.effectiveFrom}
              invalid={Boolean(validationErrors.effectiveFrom)}
              onChange={(event) =>
                updateField("effectiveFrom", event.target.value)
              }
            />
          </FormField>
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
          <Switch
            checked={form.active}
            onCheckedChange={(checked) => updateField("active", checked)}
            label="Politique active"
            description="Les calculs de congé utiliseront cette politique."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Calcul de l’acquisition"
        description="Définissez le taux mensuel servant de référence au calcul au prorata."
        icon={<Calculator className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Taux mensuel de référence"
            htmlFor="accrual-rate"
            required
            hint="Exemple : 2,5 jours pour un mois complet."
            error={validationErrors.accrualRateDays}
          >
            <Input
              id="accrual-rate"
              type="number"
              min={0.01}
              max={31}
              step={0.01}
              value={
                Number.isFinite(form.accrualRateDays)
                  ? form.accrualRateDays
                  : ""
              }
              invalid={Boolean(validationErrors.accrualRateDays)}
              className="pr-28"
              endIcon={
                <span className="whitespace-nowrap text-xs">jours/mois</span>
              }
              onChange={(event) => {
                const value = event.target.value;

                updateField(
                  "accrualRateDays",
                  value === "" ? Number.NaN : Number(value),
                );
              }}
            />
          </FormField>

          <FormField
            label="Base du calcul au prorata"
            htmlFor="proration-basis"
            hint="Tous les jours du mois sont pris en compte."
            error={validationErrors.prorationBasis}
          >
            <Input
              id="proration-basis"
              type="text"
              value="Jours calendaires"
              disabled
              invalid={Boolean(validationErrors.prorationBasis)}
            />
          </FormField>
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-800">
            Exemple de rupture le 2 juillet
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Pour un taux de 2,5 jours par mois : 2,5 × 2 ÷ 31 = 0,16 jour acquis
            pour juillet.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Condition d’ancienneté"
        description="Définissez quand les droits commencent à être acquis et utilisables."
        icon={<Clock3 className="h-5 w-5" />}
      >
        <div
          role="radiogroup"
          aria-label="Condition d’ancienneté"
          className="grid gap-3 lg:grid-cols-3"
        >
          <ChoiceCard
            selected={form.accrualStartRule === "IMMEDIATE"}
            icon={<Power className="h-4 w-4" />}
            title="Dès l’embauche"
            description="Le prorata commence à la date d’embauche et les droits sont immédiatement disponibles."
            onClick={() => changeAccrualStartRule("IMMEDIATE")}
          />

          <ChoiceCard
            selected={form.accrualStartRule === "AFTER_WAITING_PERIOD"}
            icon={<Clock3 className="h-4 w-4" />}
            title="Après une ancienneté minimale"
            description="Aucun droit n’est acquis avant la fin de la durée définie."
            onClick={() => changeAccrualStartRule("AFTER_WAITING_PERIOD")}
          />

          <ChoiceCard
            selected={form.accrualStartRule === "IMMEDIATE_BUT_BLOCKED"}
            icon={<CalendarClock className="h-4 w-4" />}
            title="Acquis mais temporairement bloqués"
            description="Les droits sont calculés dès l’embauche, mais restent indisponibles jusqu’à la fin du délai."
            onClick={() => changeAccrualStartRule("IMMEDIATE_BUT_BLOCKED")}
          />
        </div>

        {form.accrualStartRule !== "IMMEDIATE" && (
          <div className="mt-5 max-w-sm">
            <FormField
              label="Ancienneté minimale"
              htmlFor="waiting-period"
              required
              hint="12 mois correspondent à une année."
              error={validationErrors.waitingPeriodMonths}
            >
              <Input
                id="waiting-period"
                type="number"
                min={1}
                max={600}
                step={1}
                value={
                  Number.isFinite(form.waitingPeriodMonths)
                    ? form.waitingPeriodMonths
                    : ""
                }
                invalid={Boolean(validationErrors.waitingPeriodMonths)}
                className="pr-16"
                endIcon={<span className="text-xs">mois</span>}
                onChange={(event) => {
                  const value = event.target.value;

                  updateField(
                    "waitingPeriodMonths",
                    value === "" ? Number.NaN : Number(value),
                  );
                }}
              />
            </FormField>
          </div>
        )}
      </SettingsSection>
    </div>
  );
}
