"use client";

import {
  createContext,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type ApiErrorResponse,
  createDefaultLeavePolicy,
  createLeavePolicyPayload,
  getApiErrorMessage,
  hasLeavePolicyErrors,
  type LeavePolicyForm,
  type LeavePolicyResponse,
  type LeavePolicyValidationErrors,
  normalizeApiPolicy,
  validateLeavePolicy,
} from "./leave-policy";
import { leavePoliciesApi } from "@/API";

type LeavePolicyContextValue = {
  form: LeavePolicyForm;

  version: number | null;

  loading: boolean;

  saving: boolean;

  error: string | null;

  success: string | null;

  validationErrors: LeavePolicyValidationErrors;

  hasChanges: boolean;

  updateField: <Key extends keyof LeavePolicyForm>(
    field: Key,
    value: LeavePolicyForm[Key],
  ) => void;

  updateForm: (updater: SetStateAction<LeavePolicyForm>) => void;

  savePolicy: () => Promise<void>;

  cancelChanges: () => void;

  restoreDefaults: () => void;

  reload: () => Promise<void>;

  dismissError: () => void;

  dismissSuccess: () => void;
};

const LeavePolicyContext = createContext<LeavePolicyContextValue | null>(null);

export function LeavePolicyProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<LeavePolicyForm>(createDefaultLeavePolicy);

  const [savedForm, setSavedForm] = useState<LeavePolicyForm | null>(null);

  const [version, setVersion] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] =
    useState<LeavePolicyValidationErrors>({});

  const loadPolicy = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setValidationErrors({});

      const response = await leavePoliciesApi.current();

      const data = (await response.json().catch(() => null)) as
        | LeavePolicyResponse
        | ApiErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data as ApiErrorResponse | null,
            "Impossible de récupérer la politique de congé.",
          ),
        );
      }

      if (!data || !("_id" in data)) {
        throw new Error("La réponse du serveur est invalide.");
      }

      const normalizedPolicy = normalizeApiPolicy(data);

      setForm(normalizedPolicy);

      setSavedForm({
        ...normalizedPolicy,
      });

      setVersion(data.version);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Une erreur est survenue pendant le chargement.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  const updateForm = useCallback(
    (updater: SetStateAction<LeavePolicyForm>): void => {
      setForm(updater);

      setValidationErrors({});

      setError(null);

      setSuccess(null);
    },
    [],
  );

  const updateField = useCallback(
    <Key extends keyof LeavePolicyForm>(
      field: Key,
      value: LeavePolicyForm[Key],
    ): void => {
      setForm((currentForm) => ({
        ...currentForm,
        [field]: value,
      }));

      setValidationErrors((currentErrors) => {
        if (!currentErrors[field]) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors[field];

        return nextErrors;
      });

      setError(null);

      setSuccess(null);
    },
    [],
  );

  const savePolicy = useCallback(async (): Promise<void> => {
    const errors = validateLeavePolicy(form);

    setValidationErrors(errors);

    if (hasLeavePolicyErrors(errors)) {
      setError(
        "Certains champs de la politique sont invalides. Vérifiez les champs indiqués.",
      );

      return;
    }

    const payload = createLeavePolicyPayload(form);

    try {
      setSaving(true);

      setError(null);

      setSuccess(null);

      const response = await leavePoliciesApi.updateCurrent(payload);

      const data = (await response.json().catch(() => null)) as
        | LeavePolicyResponse
        | ApiErrorResponse
        | null;

      if (!response.ok) {
        console.error("Erreur PUT /api/leave-policies/current", {
          status: response.status,
          response: data,
          payload,
        });

        throw new Error(
          getApiErrorMessage(
            data as ApiErrorResponse | null,
            "Impossible d’enregistrer la politique de congé.",
          ),
        );
      }

      if (!data || !("_id" in data)) {
        throw new Error(
          "La réponse du serveur après enregistrement est invalide.",
        );
      }

      const normalizedPolicy = normalizeApiPolicy(data);

      setForm(normalizedPolicy);

      setSavedForm({
        ...normalizedPolicy,
      });

      setVersion(data.version);

      setValidationErrors({});

      setSuccess("La politique de congé a été enregistrée.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Une erreur est survenue pendant l’enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  }, [form]);

  const cancelChanges = useCallback((): void => {
    if (!savedForm) {
      return;
    }

    setForm({
      ...savedForm,
    });

    setValidationErrors({});

    setError(null);

    setSuccess(null);
  }, [savedForm]);

  const restoreDefaults = useCallback((): void => {
    setForm(createDefaultLeavePolicy());

    setValidationErrors({});

    setError(null);

    setSuccess(null);
  }, []);

  const dismissError = useCallback((): void => {
    setError(null);
  }, []);

  const dismissSuccess = useCallback((): void => {
    setSuccess(null);
  }, []);

  const hasChanges = useMemo(() => {
    if (!savedForm) {
      return false;
    }

    return JSON.stringify(form) !== JSON.stringify(savedForm);
  }, [form, savedForm]);

  const value = useMemo<LeavePolicyContextValue>(
    () => ({
      form,

      version,

      loading,

      saving,

      error,

      success,

      validationErrors,

      hasChanges,

      updateField,

      updateForm,

      savePolicy,

      cancelChanges,

      restoreDefaults,

      reload: loadPolicy,

      dismissError,

      dismissSuccess,
    }),
    [
      form,
      version,
      loading,
      saving,
      error,
      success,
      validationErrors,
      hasChanges,
      updateField,
      updateForm,
      savePolicy,
      cancelChanges,
      restoreDefaults,
      loadPolicy,
      dismissError,
      dismissSuccess,
    ],
  );

  return (
    <LeavePolicyContext.Provider value={value}>
      {children}
    </LeavePolicyContext.Provider>
  );
}

export function useLeavePolicy(): LeavePolicyContextValue {
  const context = useContext(LeavePolicyContext);

  if (!context) {
    throw new Error(
      "useLeavePolicy doit être utilisé dans LeavePolicyProvider.",
    );
  }

  return context;
}
