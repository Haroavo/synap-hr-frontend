"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, FilePlus2 } from "lucide-react";

import { contractsApi } from "@/API/contracts.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type ContractOption = {
  _id: string;
  code: string;
  label: string;
  requiresEndDate: boolean;
};

type EmployeeOption = {
  _id: string;
  badgeNumber: string;
  firstName: string;
  lastName: string;
};

type OptionsResponse = {
  employees: EmployeeOption[];
  contractTypes: ContractOption[];
  message?: string | string[];
};

const EMPTY_FORM = {
  employeeId: "",
  contractTypeId: "",
  startDate: "",
  endDate: "",
  probationEndDate: "",
  weeklyHours: "",
  grossSalary: "",
  currency: "MGA",
  remunerationFrequency: "MONTHLY" as "MONTHLY" | "DAILY" | "HOURLY",
  professionalCategory: "",
  classificationIndex: "",
};

export function CreateContractModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractOption[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoadingOptions(true);
    setError("");

    void contractsApi.options(controller.signal)
      .then(async (response) => {
        const result = await response.json().catch(() => null) as OptionsResponse | null;
        if (!response.ok || !result || !Array.isArray(result.employees) || !Array.isArray(result.contractTypes)) {
          const message = Array.isArray(result?.message) ? result.message.join(", ") : result?.message;
          throw new Error(message ?? "Impossible de charger les options du contrat.");
        }
        setEmployees(result.employees);
        setContractTypes(result.contractTypes);
        setForm((current) => ({
          ...current,
          employeeId: current.employeeId || result.employees[0]?._id || "",
          contractTypeId: current.contractTypeId || result.contractTypes[0]?._id || "",
        }));
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Impossible de charger les options du contrat.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });

    return () => controller.abort();
  }, [open]);

  const selectedType = contractTypes.find((item) => item._id === form.contractTypeId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await contractsApi.create({
        employeeId: form.employeeId,
        contractTypeId: form.contractTypeId,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        probationEndDate: form.probationEndDate || undefined,
        weeklyHours: form.weeklyHours ? Number(form.weeklyHours) : undefined,
        grossSalary: form.grossSalary ? Number(form.grossSalary) : undefined,
        currency: form.currency,
        remunerationFrequency: form.remunerationFrequency,
        professionalCategory: form.professionalCategory || undefined,
        classificationIndex: form.classificationIndex || undefined,
        status: "DRAFT",
      });
      const result = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        throw new Error(Array.isArray(result?.message) ? result.message.join(", ") : result?.message ?? "La création du contrat a échoué.");
      }
      setForm(EMPTY_FORM);
      onCreated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La création du contrat a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Ajouter un contrat"
      description="Le numéro sera généré automatiquement. Le contrat sera créé en brouillon."
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="grid gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-7">
          <Field label="Employé">
            <Select
              required
              value={form.employeeId}
              disabled={loadingOptions || saving || employees.length === 0}
              onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.badgeNumber} · {employee.firstName} {employee.lastName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Type de contrat">
            <Select
              required
              value={form.contractTypeId}
              disabled={loadingOptions || saving || contractTypes.length === 0}
              onChange={(event) => setForm((current) => ({ ...current, contractTypeId: event.target.value }))}
            >
              <option value="">Sélectionner un type</option>
              {contractTypes.map((type) => (
                <option key={type._id} value={type._id}>{type.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Date de début">
            <Input
              type="date"
              required
              value={form.startDate}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
            />
          </Field>

          <Field label={selectedType?.requiresEndDate ? "Date de fin obligatoire" : "Date de fin prévue"}>
            <Input
              type="date"
              required={Boolean(selectedType?.requiresEndDate)}
              value={form.endDate}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
            />
          </Field>

          <Field label="Fin de période d’essai">
            <Input
              type="date"
              value={form.probationEndDate}
              disabled={saving}
              onChange={(event) => setForm((current) => ({ ...current, probationEndDate: event.target.value }))}
            />
          </Field>

          <Field label="Durée hebdomadaire (heures)">
            <Input type="number" min="0" max="168" step="0.25" placeholder="À renseigner" value={form.weeklyHours} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, weeklyHours: event.target.value }))} />
          </Field>

          <Field label="Rémunération de référence">
            <Input type="number" min="0" step="0.01" placeholder="À renseigner" value={form.grossSalary} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, grossSalary: event.target.value }))} />
          </Field>

          <Field label="Devise">
            <Select value={form.currency} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}>
              <option value="MGA">MGA · Ariary</option><option value="EUR">EUR · Euro</option><option value="USD">USD · Dollar US</option>
            </Select>
          </Field>

          <Field label="Périodicité de rémunération">
            <Select value={form.remunerationFrequency} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, remunerationFrequency: event.target.value as typeof current.remunerationFrequency }))}>
              <option value="MONTHLY">Mensuelle</option><option value="DAILY">Journalière</option><option value="HOURLY">Horaire</option>
            </Select>
          </Field>

          <Field label="Catégorie professionnelle">
            <Input maxLength={120} placeholder="À renseigner" value={form.professionalCategory} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, professionalCategory: event.target.value }))} />
          </Field>

          <Field label="Indice minimum de classification">
            <Input maxLength={80} placeholder="À renseigner" value={form.classificationIndex} disabled={saving} onChange={(event) => setForm((current) => ({ ...current, classificationIndex: event.target.value }))} />
          </Field>

          <div className="flex items-end gap-2 rounded-xl border border-[#E4EBE8] bg-[#F7FAF9] px-3 py-2.5 text-xs leading-5 text-[#71838D] sm:col-span-2">
            <FilePlus2 className="h-4 w-4 shrink-0 text-[#16775C]" />
            Un brouillon pourra être activé après vérification et signature.
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#E4EBE8] bg-[#F7FAF9] px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={saving} disabled={loadingOptions || !form.employeeId || !form.contractTypeId}>
            Créer le brouillon
          </Button>
        </footer>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-[#536A76]">{label}</span>
      {children}
    </label>
  );
}
