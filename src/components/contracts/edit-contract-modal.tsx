"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Save } from "lucide-react";
import { contractsApi } from "@/API/contracts.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type ContractToEdit = {
  _id: string; contractTypeId: string; startDate: string; endDate?: string | null;
  probationEndDate?: string | null; weeklyHours?: number | null; grossSalary?: number | null;
  currency?: string; remunerationFrequency?: "MONTHLY" | "DAILY" | "HOURLY";
  professionalCategory?: string | null; classificationIndex?: string | null;
  contractType: { _id?: string; code: string; label: string } | null;
};

type ContractOption = { _id: string; code: string; label: string; requiresEndDate: boolean };
type Form = {
  contractTypeId: string; startDate: string; endDate: string; probationEndDate: string;
  weeklyHours: string; grossSalary: string; currency: string;
  remunerationFrequency: "MONTHLY" | "DAILY" | "HOURLY";
  professionalCategory: string; classificationIndex: string; reason: string;
};

function inputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function initialForm(contract: ContractToEdit): Form {
  return {
    contractTypeId: contract.contractTypeId || contract.contractType?._id || "",
    startDate: inputDate(contract.startDate), endDate: inputDate(contract.endDate),
    probationEndDate: inputDate(contract.probationEndDate), weeklyHours: contract.weeklyHours == null ? "" : String(contract.weeklyHours),
    grossSalary: contract.grossSalary == null ? "" : String(contract.grossSalary), currency: contract.currency ?? "MGA",
    remunerationFrequency: contract.remunerationFrequency ?? "MONTHLY", professionalCategory: contract.professionalCategory ?? "",
    classificationIndex: contract.classificationIndex ?? "", reason: "",
  };
}

function messageFrom(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" · ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function EditContractModal({ contract, open, onClose, onUpdated }: {
  contract: ContractToEdit | null; open: boolean; onClose: () => void; onUpdated: () => void;
}) {
  const [form, setForm] = useState<Form | null>(contract ? initialForm(contract) : null);
  const [types, setTypes] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (contract) setForm(initialForm(contract)); }, [contract]);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    void contractsApi.options(controller.signal).then(async (response) => {
      const result = await response.json().catch(() => null) as { contractTypes?: ContractOption[]; message?: string | string[] } | null;
      if (!response.ok || !result || !Array.isArray(result.contractTypes)) throw new Error(messageFrom(result, "Impossible de charger les types de contrat."));
      setTypes(result.contractTypes);
    }).catch((cause) => {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "Impossible de charger les types de contrat.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contract || !form) return;
    if (form.reason.trim().length < 3) { setError("Un motif d’au moins 3 caractères est obligatoire pour l’historique."); return; }
    setSaving(true); setError("");
    try {
      const response = await contractsApi.update(contract._id, {
        contractTypeId: form.contractTypeId, startDate: form.startDate,
        endDate: form.endDate || null, probationEndDate: form.probationEndDate || null,
        weeklyHours: form.weeklyHours === "" ? null : Number(form.weeklyHours),
        grossSalary: form.grossSalary === "" ? null : Number(form.grossSalary), currency: form.currency,
        remunerationFrequency: form.remunerationFrequency,
        professionalCategory: form.professionalCategory || null,
        classificationIndex: form.classificationIndex || null, reason: form.reason.trim(),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFrom(result, "La modification du contrat a échoué."));
      onUpdated(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "La modification du contrat a échoué."); }
    finally { setSaving(false); }
  }

  if (!form) return null;
  const currentType = contract?.contractType;
  return <Modal open={open} title="Modifier le contrat" description={`${contract?.contractNumber ?? ""} · Un motif sera ajouté à l’historique.`} onClose={onClose} size="lg">
    <form onSubmit={submit} className="flex min-h-0 flex-col">
      <div className="grid gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-7">
        <Field label="Type de contrat"><Select required value={form.contractTypeId} disabled={loading || saving} onChange={(event) => setForm((old) => old && ({ ...old, contractTypeId: event.target.value }))}>
          {currentType && !types.some((type) => type._id === form.contractTypeId) && <option value={form.contractTypeId}>{currentType.label} · inactif</option>}
          {types.map((type) => <option key={type._id} value={type._id}>{type.label}</option>)}
        </Select></Field>
        <Field label="Date de début"><Input type="date" required value={form.startDate} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, startDate: event.target.value }))} /></Field>
        <Field label="Date de fin"><Input type="date" value={form.endDate} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, endDate: event.target.value }))} /></Field>
        <Field label="Fin de période d’essai"><Input type="date" value={form.probationEndDate} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, probationEndDate: event.target.value }))} /></Field>
        <Field label="Temps hebdomadaire (heures)"><Input type="number" min="0" max="168" step="0.25" value={form.weeklyHours} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, weeklyHours: event.target.value }))} /></Field>
        <Field label="Rémunération de référence"><Input type="number" min="0" step="0.01" value={form.grossSalary} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, grossSalary: event.target.value }))} /></Field>
        <Field label="Devise"><Select value={form.currency} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, currency: event.target.value }))}><option value="MGA">MGA · Ariary</option><option value="EUR">EUR · Euro</option><option value="USD">USD · Dollar US</option></Select></Field>
        <Field label="Périodicité"><Select value={form.remunerationFrequency} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, remunerationFrequency: event.target.value as Form["remunerationFrequency"] }))}><option value="MONTHLY">Mensuelle</option><option value="DAILY">Journalière</option><option value="HOURLY">Horaire</option></Select></Field>
        <Field label="Catégorie professionnelle"><Input maxLength={120} value={form.professionalCategory} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, professionalCategory: event.target.value }))} /></Field>
        <Field label="Indice de classification"><Input maxLength={80} value={form.classificationIndex} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, classificationIndex: event.target.value }))} /></Field>
        <label className="grid gap-1.5 sm:col-span-2"><span className="text-xs font-semibold text-[#536A76]">Motif de modification</span><textarea required minLength={3} maxLength={1000} rows={3} value={form.reason} disabled={saving} onChange={(event) => setForm((old) => old && ({ ...old, reason: event.target.value }))} className="rounded-xl border border-[#D9E4DF] px-3 py-2.5 text-sm outline-none focus:border-[#16775C] focus:ring-2 focus:ring-[#16775C]/10" /></label>
        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-[#E4EBE8] bg-[#F7FAF9] px-5 py-4 sm:px-7"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Annuler</Button><Button type="submit" loading={saving} disabled={loading || !form.contractTypeId} leftIcon={<Save className="h-4 w-4" />}>Enregistrer les modifications</Button></footer>
    </form>
  </Modal>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-semibold text-[#536A76]">{label}</span>{children}</label>;
}
