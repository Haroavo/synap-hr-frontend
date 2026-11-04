export type LeaveProrationBasis = "CALENDAR_DAYS";

export type LeaveAccrualStartRule =
  | "IMMEDIATE"
  | "AFTER_WAITING_PERIOD"
  | "IMMEDIATE_BUT_BLOCKED";

export type LeaveAccumulationMode = "CUMULATIVE" | "NON_CUMULATIVE";

export type BalanceExpirationRule =
  | "END_OF_MONTH"
  | "END_OF_LEAVE_YEAR"
  | "AFTER_NUMBER_OF_YEARS"
  | "NEVER";

export type LeaveYearType = "CALENDAR_YEAR" | "HIRE_DATE_ANNIVERSARY";

export type LeavePolicyForm = {
  name: string;

  accrualRateDays: number;

  prorationBasis: LeaveProrationBasis;

  accrualStartRule: LeaveAccrualStartRule;

  waitingPeriodMonths: number;

  accumulationMode: LeaveAccumulationMode;

  balanceExpirationRule: BalanceExpirationRule;

  balanceExpirationYears: number | null;

  maximumAccumulatedDaysEnabled: boolean;

  maximumAccumulatedDays: number | null;

  leaveYearType: LeaveYearType;

  allowNegativeBalance: boolean;

  negativeBalanceLimitDays: number;

  active: boolean;

  effectiveFrom: string;
};

/**
 * Certaines propriétés sont facultatives afin de supporter
 * les anciennes politiques déjà présentes dans MongoDB.
 */
export type LeavePolicyResponse = {
  _id: string;

  policyKey: string;

  leaveType: "ANNUAL";

  version: number;

  name?: string;

  accrualRateDays?: number;

  prorationBasis?: LeaveProrationBasis;

  accrualStartRule?: LeaveAccrualStartRule;

  waitingPeriodMonths?: number;

  accumulationMode?: LeaveAccumulationMode;

  balanceExpirationRule?: BalanceExpirationRule;

  balanceExpirationYears?: number | null;

  maximumAccumulatedDaysEnabled?: boolean;

  maximumAccumulatedDays?: number | null;

  leaveYearType?: LeaveYearType;

  allowNegativeBalance?: boolean;

  negativeBalanceLimitDays?: number;

  active?: boolean;

  effectiveFrom?: string;

  createdAt?: string;

  updatedAt?: string;
};

export type LeavePolicyPayload = {
  name: string;

  accrualRateDays: number;

  prorationBasis: LeaveProrationBasis;

  accrualStartRule: LeaveAccrualStartRule;

  waitingPeriodMonths: number;

  accumulationMode: LeaveAccumulationMode;

  balanceExpirationRule: BalanceExpirationRule;

  balanceExpirationYears: number | null;

  maximumAccumulatedDaysEnabled: boolean;

  maximumAccumulatedDays: number | null;

  leaveYearType: LeaveYearType;

  allowNegativeBalance: boolean;

  negativeBalanceLimitDays: number;

  active: boolean;

  effectiveFrom: string;
};

export type ApiErrorResponse = {
  message?: string | string[];

  error?: string;

  statusCode?: number;
};

export type LeavePolicySimulationResponse = {
  policyActive: boolean;

  hireDate: string;

  requestedCalculationDate: string;

  calculationEndDate: string;

  contractEndDate: string | null;

  policyEffectiveFrom: string;

  accrualStartDate: string | null;

  availabilityDate: string | null;

  retainedPeriodStartDate: string | null;

  waitingReached: boolean;

  grossEarnedDays: number;

  retainedEarnedDaysBeforeCap: number;

  retainedEarnedDays: number;

  availableEarnedDays: number;

  expiredDays: number;

  cappedDays: number;

  accumulationMode: LeaveAccumulationMode;

  expirationRule: BalanceExpirationRule;

  explanation: string;
};

export type LeavePolicyValidationErrors = Partial<
  Record<keyof LeavePolicyForm, string>
>;

export function getTodayDateKey(): string {
  const now = new Date();

  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createDefaultLeavePolicy(): LeavePolicyForm {
  return {
    name: "Politique de congé annuel",

    accrualRateDays: 2.5,

    prorationBasis: "CALENDAR_DAYS",

    accrualStartRule: "IMMEDIATE",

    waitingPeriodMonths: 0,

    accumulationMode: "CUMULATIVE",

    balanceExpirationRule: "END_OF_LEAVE_YEAR",

    balanceExpirationYears: null,

    maximumAccumulatedDaysEnabled: false,

    maximumAccumulatedDays: null,

    leaveYearType: "CALENDAR_YEAR",

    allowNegativeBalance: false,

    negativeBalanceLimitDays: 0,

    active: true,

    effectiveFrom: getTodayDateKey(),
  };
}

export function getApiErrorMessage(
  data: ApiErrorResponse | null,
  defaultMessage: string,
): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return defaultMessage;
}

export function normalizeApiPolicy(
  policy: LeavePolicyResponse,
): LeavePolicyForm {
  const defaults = createDefaultLeavePolicy();

  return {
    name: policy.name ?? defaults.name,

    accrualRateDays:
      typeof policy.accrualRateDays === "number"
        ? policy.accrualRateDays
        : defaults.accrualRateDays,

    prorationBasis:
      policy.prorationBasis === "CALENDAR_DAYS"
        ? policy.prorationBasis
        : defaults.prorationBasis,

    accrualStartRule: policy.accrualStartRule ?? defaults.accrualStartRule,

    waitingPeriodMonths:
      typeof policy.waitingPeriodMonths === "number"
        ? policy.waitingPeriodMonths
        : defaults.waitingPeriodMonths,

    accumulationMode: policy.accumulationMode ?? defaults.accumulationMode,

    balanceExpirationRule:
      policy.balanceExpirationRule ?? defaults.balanceExpirationRule,

    balanceExpirationYears: policy.balanceExpirationYears ?? null,

    maximumAccumulatedDaysEnabled:
      policy.maximumAccumulatedDaysEnabled ?? false,

    maximumAccumulatedDays: policy.maximumAccumulatedDays ?? null,

    leaveYearType: policy.leaveYearType ?? defaults.leaveYearType,

    allowNegativeBalance: policy.allowNegativeBalance ?? false,

    negativeBalanceLimitDays:
      typeof policy.negativeBalanceLimitDays === "number"
        ? policy.negativeBalanceLimitDays
        : 0,

    active: policy.active ?? true,

    effectiveFrom: policy.effectiveFrom
      ? policy.effectiveFrom.slice(0, 10)
      : defaults.effectiveFrom,
  };
}

function isValidDateKey(value: string): boolean {
  if (!value) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);

  return !Number.isNaN(date.getTime());
}

export function validateLeavePolicy(
  form: LeavePolicyForm,
): LeavePolicyValidationErrors {
  const errors: LeavePolicyValidationErrors = {};

  const normalizedName = form.name.trim();

  if (normalizedName.length < 3) {
    errors.name = "Le nom doit contenir au moins 3 caractères.";
  }

  if (normalizedName.length > 100) {
    errors.name = "Le nom ne peut pas dépasser 100 caractères.";
  }

  if (!Number.isFinite(form.accrualRateDays) || form.accrualRateDays < 0.01) {
    errors.accrualRateDays = "Le taux mensuel doit être supérieur à zéro.";
  } else if (form.accrualRateDays > 31) {
    errors.accrualRateDays = "Le taux mensuel ne peut pas dépasser 31 jours.";
  }

  if (form.prorationBasis !== "CALENDAR_DAYS") {
    errors.prorationBasis = "La base du calcul au prorata est invalide.";
  }

  if (!isValidDateKey(form.effectiveFrom)) {
    errors.effectiveFrom = "La date d’entrée en vigueur est obligatoire.";
  }

  if (form.accrualStartRule !== "IMMEDIATE") {
    if (
      !Number.isFinite(form.waitingPeriodMonths) ||
      !Number.isInteger(form.waitingPeriodMonths) ||
      form.waitingPeriodMonths < 1
    ) {
      errors.waitingPeriodMonths =
        "L’ancienneté minimale doit être un nombre entier supérieur à zéro.";
    } else if (form.waitingPeriodMonths > 600) {
      errors.waitingPeriodMonths =
        "L’ancienneté minimale ne peut pas dépasser 600 mois.";
    }
  }

  if (
    form.accumulationMode === "NON_CUMULATIVE" &&
    form.balanceExpirationRule !== "END_OF_MONTH"
  ) {
    errors.balanceExpirationRule =
      "Une politique non cumulable doit expirer à la fin du mois.";
  }

  if (
    form.accumulationMode === "CUMULATIVE" &&
    form.balanceExpirationRule === "END_OF_MONTH"
  ) {
    errors.balanceExpirationRule =
      "Une politique cumulable ne peut pas expirer à la fin de chaque mois.";
  }

  if (
    form.accrualStartRule === "IMMEDIATE_BUT_BLOCKED" &&
    form.accumulationMode === "NON_CUMULATIVE"
  ) {
    errors.accumulationMode =
      "Les droits acquis mais bloqués doivent être cumulables.";
  }

  if (form.balanceExpirationRule === "AFTER_NUMBER_OF_YEARS") {
    if (
      form.balanceExpirationYears === null ||
      !Number.isInteger(form.balanceExpirationYears) ||
      form.balanceExpirationYears < 1
    ) {
      errors.balanceExpirationYears =
        "La durée de conservation doit être au minimum d’un an.";
    } else if (form.balanceExpirationYears > 20) {
      errors.balanceExpirationYears =
        "La durée de conservation ne peut pas dépasser 20 ans.";
    }
  }

  if (form.maximumAccumulatedDaysEnabled) {
    if (
      form.maximumAccumulatedDays === null ||
      !Number.isFinite(form.maximumAccumulatedDays) ||
      form.maximumAccumulatedDays <= 0
    ) {
      errors.maximumAccumulatedDays =
        "Le plafond du solde doit être supérieur à zéro.";
    }
  }

  if (form.allowNegativeBalance) {
    if (
      !Number.isFinite(form.negativeBalanceLimitDays) ||
      form.negativeBalanceLimitDays <= 0
    ) {
      errors.negativeBalanceLimitDays =
        "La limite du solde négatif doit être supérieure à zéro.";
    }
  }

  return errors;
}

export function hasLeavePolicyErrors(
  errors: LeavePolicyValidationErrors,
): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Cette fonction garantit que le frontend n’envoie
 * que les propriétés autorisées par UpsertLeavePolicyDto.
 */
export function createLeavePolicyPayload(
  form: LeavePolicyForm,
): LeavePolicyPayload {
  return {
    name: form.name.trim(),

    accrualRateDays: Number(form.accrualRateDays),

    prorationBasis: "CALENDAR_DAYS",

    accrualStartRule: form.accrualStartRule,

    waitingPeriodMonths:
      form.accrualStartRule === "IMMEDIATE"
        ? 0
        : Number(form.waitingPeriodMonths),

    accumulationMode: form.accumulationMode,

    balanceExpirationRule:
      form.accumulationMode === "NON_CUMULATIVE"
        ? "END_OF_MONTH"
        : form.balanceExpirationRule,

    balanceExpirationYears:
      form.balanceExpirationRule === "AFTER_NUMBER_OF_YEARS"
        ? form.balanceExpirationYears
        : null,

    maximumAccumulatedDaysEnabled: Boolean(form.maximumAccumulatedDaysEnabled),

    maximumAccumulatedDays: form.maximumAccumulatedDaysEnabled
      ? form.maximumAccumulatedDays
      : null,

    leaveYearType: form.leaveYearType,

    allowNegativeBalance: Boolean(form.allowNegativeBalance),

    negativeBalanceLimitDays: form.allowNegativeBalance
      ? Number(form.negativeBalanceLimitDays)
      : 0,

    active: Boolean(form.active),

    effectiveFrom: form.effectiveFrom,
  };
}
