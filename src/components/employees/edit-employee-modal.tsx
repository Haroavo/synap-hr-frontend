"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Save } from "lucide-react";
import { employeesApi } from "@/API/employees.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type EmployeeData = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DEPARTED";
  department?: { _id: string } | null;
  position?: { _id: string } | null;
  manager?: { _id: string } | null;
  address?: { street?: string; city?: string; postalCode?: string; country?: string } | null;
  emergencyContact?: { name?: string; relationship?: string; phone?: string } | null;
};

type Options = {
  departments: Array<{ _id: string; name: string }>;
  positions: Array<{ _id: string; title: string; departmentId: string }>;
  managers: Array<{ _id: string; firstName: string; lastName: string; departmentId: string; positionTitle: string; positionCode: string; positionLevel: number }>;
};

type Form = {
  firstName: string; lastName: string; email: string; phone: string; birthDate: string;
  street: string; city: string; postalCode: string; country: string;
  emergencyName: string; emergencyRelationship: string; emergencyPhone: string;
  departmentId: string; positionId: string; managerId: string; status: EmployeeData["status"];
  effectiveDate: string; reason: string;
};

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function messageFrom(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" · ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

function initialForm(employee: EmployeeData): Form {
  const birth = employee.birthDate ? new Date(employee.birthDate) : null;
  return {
    firstName: employee.firstName ?? "", lastName: employee.lastName ?? "", email: employee.email ?? "",
    phone: employee.phone ?? "", birthDate: birth && !Number.isNaN(birth.getTime()) ? birth.toISOString().slice(0, 10) : "",
    street: employee.address?.street ?? "", city: employee.address?.city ?? "",
    postalCode: employee.address?.postalCode ?? "", country: employee.address?.country ?? "Madagascar",
    emergencyName: employee.emergencyContact?.name ?? "", emergencyRelationship: employee.emergencyContact?.relationship ?? "",
    emergencyPhone: employee.emergencyContact?.phone ?? "", departmentId: employee.department?._id ?? "",
    positionId: employee.position?._id ?? "", managerId: employee.manager?._id ?? "", status: employee.status,
    effectiveDate: localToday(), reason: "",
  };
}

function isInternshipPosition(value: { positionCode?: string; positionTitle?: string }) {
  const normalized = `${value.positionCode ?? ""} ${value.positionTitle ?? ""}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /stagiaire|\bintern(?:ship)?\b|\bstage\b/.test(normalized);
}

export function EditEmployeeModal({ open, employee, onClose, onUpdated }: {
  open: boolean; employee: EmployeeData; onClose: () => void; onUpdated: () => void;
}) {
  const [form, setForm] = useState(() => initialForm(employee));
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setForm(initialForm(employee)), [employee]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    void employeesApi.creationOptions(controller.signal)
      .then(async (response) => {
        const result = await response.json().catch(() => null) as (Options & { message?: string | string[] }) | null;
        if (!response.ok || !result) throw new Error(messageFrom(result, "Impossible de charger les choix d’affectation."));
        setOptions(result);
      })
      .catch((cause) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Impossible de charger les choix d’affectation.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);

  const positions = useMemo(() => options?.positions.filter((item) => item.departmentId === form.departmentId) ?? [], [form.departmentId, options]);
  const selectedPosition = positions.find((item) => item._id === form.positionId);
  const managers = useMemo(() => options?.managers.filter((item) =>
    item.departmentId === form.departmentId && item._id !== employee._id &&
    (!selectedPosition || item.positionLevel <= selectedPosition.level) &&
    !(selectedPosition && isInternshipPosition({ positionCode: item.positionCode, positionTitle: item.positionTitle }) && isInternshipPosition({ positionCode: selectedPosition.code, positionTitle: selectedPosition.title }))
  ) ?? [], [employee._id, form.departmentId, options, selectedPosition]);
  const assignmentChanged = form.departmentId !== (employee.department?._id ?? "") || form.positionId !== (employee.position?._id ?? "") || form.managerId !== (employee.manager?._id ?? "");
  const statusChanged = form.status !== employee.status;

  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if ((assignmentChanged || statusChanged) && form.reason.trim().length < 3) {
      setError("Ajoutez un motif d’au moins 3 caractères pour tracer cette modification.");
      return;
    }
    setSaving(true);
    try {
      const response = await employeesApi.update(employee._id, {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(),
        phone: form.phone.trim() || null, birthDate: form.birthDate || null,
        address: { street: form.street.trim(), city: form.city.trim(), postalCode: form.postalCode.trim(), country: form.country.trim() },
        emergencyContact: { name: form.emergencyName.trim(), relationship: form.emergencyRelationship.trim(), phone: form.emergencyPhone.trim() },
        ...(assignmentChanged ? { departmentId: form.departmentId, positionId: form.positionId, managerId: form.managerId || null } : {}),
        ...(statusChanged ? { status: form.status } : {}),
        ...(assignmentChanged || statusChanged ? { effectiveDate: form.effectiveDate, reason: form.reason.trim() } : {}),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFrom(result, "La mise à jour du dossier a échoué."));
      onUpdated();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La mise à jour du dossier a échoué.");
    } finally { setSaving(false); }
  }

  return (
    <Modal open={open} title="Modifier le dossier employé" description="Les changements d’affectation et de statut sont historisés avec leur motif." onClose={onClose} size="xl">
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="grid gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-7">
          <Group title="Identité et coordonnées">
            <Field label="Prénom"><Input required minLength={2} maxLength={80} value={form.firstName} onChange={(e) => change("firstName", e.target.value)} /></Field>
            <Field label="Nom"><Input required minLength={2} maxLength={80} value={form.lastName} onChange={(e) => change("lastName", e.target.value)} /></Field>
            <Field label="E-mail"><Input type="email" required value={form.email} onChange={(e) => change("email", e.target.value)} /></Field>
            <Field label="Téléphone"><Input type="tel" value={form.phone} onChange={(e) => change("phone", e.target.value)} /></Field>
            <Field label="Date de naissance"><Input type="date" value={form.birthDate} onChange={(e) => change("birthDate", e.target.value)} /></Field>
            <Field label="Adresse"><Input value={form.street} onChange={(e) => change("street", e.target.value)} /></Field>
            <Field label="Ville"><Input value={form.city} onChange={(e) => change("city", e.target.value)} /></Field>
            <Field label="Code postal"><Input value={form.postalCode} onChange={(e) => change("postalCode", e.target.value)} /></Field>
            <Field label="Pays"><Input value={form.country} onChange={(e) => change("country", e.target.value)} /></Field>
            <Field label="Contact d’urgence"><Input value={form.emergencyName} onChange={(e) => change("emergencyName", e.target.value)} /></Field>
            <Field label="Lien avec l’employé"><Input value={form.emergencyRelationship} onChange={(e) => change("emergencyRelationship", e.target.value)} /></Field>
            <Field label="Téléphone du contact"><Input type="tel" value={form.emergencyPhone} onChange={(e) => change("emergencyPhone", e.target.value)} /></Field>
          </Group>

          <Group title="Affectation et statut">
            <Field label="Département"><Select required disabled={loading || !options} value={form.departmentId} onChange={(e) => { change("departmentId", e.target.value); change("positionId", ""); change("managerId", ""); }}><option value="">Sélectionner</option>{options?.departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select></Field>
            <Field label="Poste"><Select required disabled={loading || !form.departmentId} value={form.positionId} onChange={(e) => { change("positionId", e.target.value); change("managerId", ""); }}><option value="">Sélectionner</option>{positions.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</Select></Field>
            <Field label="Responsable hiérarchique"><Select disabled={loading || !form.departmentId} value={form.managerId} onChange={(e) => change("managerId", e.target.value)}><option value="">Aucun responsable</option>{managers.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName} · {item.positionTitle}</option>)}</Select><span className="text-[11px] text-[#71838D]">Département commun et niveau hiérarchique compatible.</span></Field>
            <Field label="Statut"><Select value={form.status} onChange={(e) => change("status", e.target.value as Form["status"])}><option value="ACTIVE">Actif</option><option value="INACTIVE">Inactif</option><option value="SUSPENDED">Suspendu</option><option value="DEPARTED">Parti</option></Select></Field>
            {(assignmentChanged || statusChanged) && <>
              <Field label="Date d’effet"><Input type="date" required value={form.effectiveDate} onChange={(e) => change("effectiveDate", e.target.value)} /></Field>
              <Field label="Motif obligatoire"><textarea required minLength={3} maxLength={1000} value={form.reason} onChange={(e) => change("reason", e.target.value)} rows={3} className="rounded-xl border border-[#D9E4DF] bg-white px-3 py-2.5 text-sm text-[#152B3B] outline-none focus:border-[#16775C] focus:ring-2 focus:ring-[#16775C]/10" /></Field>
            </>}
            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:col-span-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          </Group>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#E4EBE8] bg-[#F7FAF9] px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={saving} disabled={loading} leftIcon={<Save className="h-4 w-4" />}>Enregistrer les modifications</Button>
        </footer>
      </form>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className="content-start rounded-xl border border-[#E4EBE8] p-4 sm:col-span-1"><h3 className="mb-4 text-sm font-bold text-[#152B3B]">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid content-start gap-1.5"><span className="text-xs font-semibold text-[#536A76]">{label}</span>{children}</label>;
}
