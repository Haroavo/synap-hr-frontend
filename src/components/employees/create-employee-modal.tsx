"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, CircleAlert, FileText, UserRound } from "lucide-react";
import { CalendarClock, Printer } from "lucide-react";
import PhoneInput, { isPossiblePhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Button, FormField, Input, Modal, Select } from "@/components/ui";

type Options = {
  departments: Array<{ _id: string; code: string; name: string }>;
  positions: Array<{ _id: string; code: string; title: string; departmentId: string; level: number }>;
  contractTypes: Array<{ _id: string; code: string; label: string; requiresEndDate: boolean }>;
  managers: Array<{ _id: string; badgeNumber: string; firstName: string; lastName: string; departmentId: string; positionTitle: string; positionCode: string; positionLevel: number }>;
};

type FormValues = {
  firstName: string; lastName: string; email: string; phone: string; birthDate: string;
  street: string; city: string; postalCode: string; country: string;
  emergencyContactName: string; emergencyContactRelationship: string; emergencyContactPhone: string;
  departmentId: string; positionId: string; managerId: string; hireDate: string;
  contractTypeId: string; contractStartDate: string;
  contractEndDate: string; probationEndDate: string;
  weeklyHours: string; grossSalary: string; currency: string; remunerationFrequency: "MONTHLY" | "DAILY" | "HOURLY";
  professionalCategory: string; classificationIndex: string;
};

type CountrySelectProps = {
  value?: string;
  onChange: (country?: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  options: Array<{ value?: string; label: string }>;
  iconComponent: ComponentType<{ country?: string }>;
  disabled?: boolean;
  readOnly?: boolean;
};

function FlagOnlyCountrySelect({ value, onChange, onFocus, onBlur, options, iconComponent: CountryIcon, disabled, readOnly }: CountrySelectProps) {
  return (
    <span className="employee-phone-country" aria-hidden={false}>
      <CountryIcon country={value} />
      <span className="employee-phone-country-chevron" aria-hidden="true">⌄</span>
      <select
        className="employee-phone-country-select"
        aria-label="Pays du numéro de téléphone"
        value={value ?? ""}
        disabled={disabled || readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value || undefined)}
      >
        {options.map((option, index) => (
          <option key={`${option.value ?? "international"}-${index}`} value={option.value ?? ""}>
            {option.label}
          </option>
        ))}
      </select>
    </span>
  );
}

type ScheduleForm = Record<string, { active: boolean; startTime: string; breakStart: string; breakEnd: string; endTime: string }>;
type CreatedReferences = { badgeNumber: string; contractNumber: string };

const week = [
  ["MONDAY", "Lundi"], ["TUESDAY", "Mardi"], ["WEDNESDAY", "Mercredi"],
  ["THURSDAY", "Jeudi"], ["FRIDAY", "Vendredi"], ["SATURDAY", "Samedi"], ["SUNDAY", "Dimanche"],
] as const;

function createInitialValues(): FormValues {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
  firstName: "", lastName: "", email: "", phone: "", birthDate: "",
  street: "", city: "", postalCode: "", country: "Madagascar",
  emergencyContactName: "", emergencyContactRelationship: "", emergencyContactPhone: "", departmentId: "",
  positionId: "", managerId: "", hireDate: today,
  contractTypeId: "", contractStartDate: today,
  contractEndDate: "", probationEndDate: "",
  weeklyHours: "", grossSalary: "", currency: "MGA", remunerationFrequency: "MONTHLY",
  professionalCategory: "", classificationIndex: "",
  };
}

const steps = [
  { title: "Identité", hint: "Informations personnelles", icon: UserRound },
  { title: "Affectation", hint: "Département et poste", icon: BriefcaseBusiness },
  { title: "Planning", hint: "Jours et horaires", icon: CalendarClock },
  { title: "Contrat", hint: "Génération du projet PDF", icon: FileText },
];

function createDefaultSchedule(): ScheduleForm {
  return Object.fromEntries(week.map(([day]) => [day, {
    active: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].includes(day),
    startTime: "08:00", breakStart: "12:00", breakEnd: "13:00", endTime: "17:00",
  }]));
}

function messageFrom(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(" · ");
    if (typeof message === "string") return message;
  }
  return fallback;
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function formatDate(value: string) {
  if (!value) return "À compléter";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00.000Z`));
}

function isInternshipPosition(position?: { code: string; title: string }) {
  if (!position) return false;
  const normalized = `${position.code} ${position.title}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return /stagiaire|\bintern(?:ship)?\b|\bstage\b/.test(normalized);
}

export function CreateEmployeeModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [values, setValues] = useState<FormValues>(createInitialValues);
  const [schedule, setSchedule] = useState<ScheduleForm>(createDefaultSchedule);
  const [options, setOptions] = useState<Options | null>(null);
  const [step, setStep] = useState(0);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdReferences, setCreatedReferences] = useState<CreatedReferences | null>(null);

  const close = useCallback(() => {
    if (submitting) return;
    onClose();
  }, [onClose, submitting]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setValues(createInitialValues());
    setSchedule(createDefaultSchedule());
    setStep(0);
    setCreatedReferences(null);
    setLoadingOptions(true);
    setError("");
    fetch("/api/employees/creation-options", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(messageFrom(data, "Impossible de charger les listes."));
        setOptions(data as Options);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoadingOptions(false); });
    return () => controller.abort();
  }, [open]);

  const filteredPositions = useMemo(
    () => options?.positions.filter((position) => position.departmentId === values.departmentId) ?? [],
    [options, values.departmentId],
  );
  const filteredManagers = useMemo(
    () => {
      const selectedPosition = options?.positions.find((position) => position._id === values.positionId);
      if (!selectedPosition) return [];
      return options?.managers.filter((manager) =>
        manager.departmentId === values.departmentId && manager.positionLevel <= selectedPosition.level &&
        !(isInternshipPosition({ code: manager.positionCode, title: manager.positionTitle }) &&
          isInternshipPosition(selectedPosition)),
      ) ?? [];
    },
    [options, values.departmentId, values.positionId],
  );
  const selectedContractType = options?.contractTypes.find((type) => type._id === values.contractTypeId);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!values.firstName.trim() || !values.lastName.trim() || !values.email.trim() || !values.hireDate) {
        setError("Complétez les champs obligatoires pour continuer."); return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(values.email)) { setError("Saisissez une adresse e-mail valide."); return false; }
      if (values.phone && !isPossiblePhoneNumber(values.phone)) { setError("Saisissez un numéro de téléphone valide."); return false; }
    }
    if (step === 1 && (!values.departmentId || !values.positionId)) {
      setError("Choisissez un département et un poste."); return false;
    }
    if (step === 2) {
      const hasInvalidSchedule = week.some(([day]) => {
        const entry = schedule[day];
        if (!entry.active) return false;
        if (!entry.startTime || !entry.endTime || entry.startTime >= entry.endTime) return true;
        if (Boolean(entry.breakStart) !== Boolean(entry.breakEnd)) return true;
        if (entry.breakStart && entry.breakEnd) {
          if (entry.breakStart >= entry.breakEnd) return true;

          const breakIsOutsideWork =
            entry.breakEnd <= entry.startTime || entry.breakStart >= entry.endTime;
          if (!breakIsOutsideWork &&
            (entry.breakStart < entry.startTime || entry.breakEnd > entry.endTime)) return true;
        }
        return false;
      });
      if (hasInvalidSchedule) {
        setError("Vérifiez les horaires et les pauses du planning."); return false;
      }
    }
    if (step === 3) {
      if (!values.contractTypeId || !values.contractStartDate) {
        setError("Complétez les informations obligatoires du contrat."); return false;
      }
      if (selectedContractType?.requiresEndDate && !values.contractEndDate) {
        setError("Ce type de contrat exige une date de fin."); return false;
      }
      if (values.contractEndDate && values.contractEndDate < values.contractStartDate) {
        setError("La date de fin doit être postérieure au début du contrat."); return false;
      }
    }
    setError(""); return true;
  }

  function nextStep() {
    if (validateCurrentStep()) setStep((current) => Math.min(3, current + 1));
  }

  function updateSchedule(day: string, patch: Partial<ScheduleForm[string]>) {
    setSchedule((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
    setError("");
  }

  function scheduleDays() {
    return week.map(([day]) => {
      const entry = schedule[day];
      if (!entry.active) return { day, timeSlots: [{ startTime: "00:00", endTime: "23:59", work: false }] };
      const hasBreakWithinWork = entry.breakStart && entry.breakEnd &&
        entry.breakStart >= entry.startTime && entry.breakEnd <= entry.endTime &&
        entry.breakStart < entry.breakEnd;
      const slots: Array<{ startTime: string; endTime: string; work: boolean }> = [];
      if (hasBreakWithinWork) {
        if (entry.startTime < entry.breakStart) {
          slots.push({ startTime: entry.startTime, endTime: entry.breakStart, work: true });
        }
        slots.push({ startTime: entry.breakStart, endTime: entry.breakEnd, work: false });
        if (entry.breakEnd < entry.endTime) {
          slots.push({ startTime: entry.breakEnd, endTime: entry.endTime, work: true });
        }
      } else {
        slots.push({ startTime: entry.startTime, endTime: entry.endTime, work: true });
      }
      return { day, timeSlots: slots.sort((left, right) => left.startTime.localeCompare(right.startTime)) };
    });
  }

  function generateContractPdf(references?: CreatedReferences) {
    if (!references && !validateCurrentStep()) return;
    const popup = window.open("", "_blank");
    if (!popup) { setError("Autorisez les fenêtres contextuelles pour générer le document."); return; }
    const employeeName = `${values.firstName} ${values.lastName}`.trim();
    const department = options?.departments.find((item) => item._id === values.departmentId)?.name ?? "—";
    const position = filteredPositions.find((item) => item._id === values.positionId)?.title ?? "—";
    const contractType = selectedContractType?.label ?? "—";
    const rows = week.map(([day, label]) => {
      const item = schedule[day];
      const hasPause = item.active && item.breakStart && item.breakEnd &&
        item.breakStart >= item.startTime && item.breakEnd <= item.endTime && item.breakStart < item.breakEnd;
      return `<tr><td>${label}</td><td>${item.active ? `${escapeHtml(item.startTime)} – ${escapeHtml(item.endTime)}` : "Repos"}</td><td>${hasPause ? `${escapeHtml(item.breakStart)} – ${escapeHtml(item.breakEnd)}` : "—"}</td></tr>`;
    }).join("");
    popup.document.open();
    const contractReference = references?.contractNumber ?? "À attribuer à la création";
    const badgeReference = references?.badgeNumber ?? "À attribuer à la création";
    popup.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Projet de contrat ${escapeHtml(contractReference)}</title><style>
      @page{size:A4;margin:17mm 18mm 20mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:11px;line-height:1.55;margin:0}.topline{height:5px;background:#1e3a4b;margin:-17mm -18mm 16mm}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #d7dee2;padding-bottom:14px;margin-bottom:20px}.brand{font-size:17px;font-weight:800;letter-spacing:.14em;color:#1e3a4b}.brand-sub{margin-top:3px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#718096}.tag{border:1px solid #b8c4ca;padding:5px 9px;border-radius:3px;color:#52636c;font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.eyebrow{color:#64748b;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}h1{font-family:Georgia,serif;font-size:27px;font-weight:500;letter-spacing:-.02em;color:#1e3a4b;margin:6px 0 2px}.reference{font-size:10px;color:#64748b}.summary{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #dce3e7;margin:18px 0}.summary div{padding:9px 11px;border-right:1px solid #dce3e7}.summary div:last-child{border:0}.summary label{display:block;color:#718096;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.summary strong{display:block;margin-top:3px;color:#243b49;font-size:10px}h2{color:#1e3a4b;font-size:10px;text-transform:uppercase;letter-spacing:.09em;margin:17px 0 6px;border-bottom:1px solid #cad5db;padding-bottom:5px}p{margin:5px 0 9px}.data{width:100%;border-collapse:collapse}.data td,.schedule td,.schedule th{padding:6px 8px;border-bottom:1px solid #e4e9ec;text-align:left;vertical-align:top}.data td:first-child{width:31%;color:#718096;font-size:9px}.data td:last-child{font-weight:600}.schedule{width:100%;border-collapse:collapse}.schedule th{background:#f2f5f6;color:#657780;font-size:8px;text-transform:uppercase;letter-spacing:.06em}.schedule td{font-size:9px}.notice{margin-top:14px;padding:10px 12px;background:#f4f6f6;border-left:3px solid #526d7a;color:#485963;font-size:9px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:34px;break-inside:avoid}.signature{min-height:54px;border-top:1px solid #8797a0;padding-top:7px;color:#52636c;font-size:9px}.footer{position:fixed;bottom:-12mm;left:0;right:0;border-top:1px solid #dce3e7;padding-top:6px;color:#718096;font-size:8px;display:flex;justify-content:space-between}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
      <div class="topline"></div><header class="header"><div><div class="brand">SYNAPRH</div><div class="brand-sub">Ressources humaines</div></div><span class="tag">Projet à compléter</span></header>
      <div class="eyebrow">Document contractuel · préparé le ${formatDate(new Date().toISOString().slice(0, 10))}</div>
      <h1>Contrat de travail</h1><div class="reference">Référence ${escapeHtml(contractReference)}</div>
      <div class="summary"><div><label>Type de contrat</label><strong>${escapeHtml(contractType)}</strong></div><div><label>Début</label><strong>${formatDate(values.contractStartDate)}</strong></div><div><label>Fin prévue</label><strong>${formatDate(values.contractEndDate)}</strong></div></div>
      <h2>Parties et affectation</h2><table class="data"><tr><td>Employeur</td><td><strong>À compléter · raison sociale et adresse légale</strong></td></tr><tr><td>Employé</td><td><strong>${escapeHtml(employeeName)}</strong></td></tr><tr><td>Matricule NFC</td><td>${escapeHtml(badgeReference)}</td></tr><tr><td>Adresse e-mail</td><td>${escapeHtml(values.email)}</td></tr><tr><td>Département / poste</td><td>${escapeHtml(department)} · ${escapeHtml(position)}</td></tr><tr><td>Type de contrat</td><td>${escapeHtml(contractType)}</td></tr></table>
      <h2>Dates</h2><table class="data"><tr><td>Prise de fonction</td><td>${formatDate(values.hireDate)}</td></tr><tr><td>Début du contrat</td><td>${formatDate(values.contractStartDate)}</td></tr><tr><td>Fin du contrat</td><td>${formatDate(values.contractEndDate)}</td></tr><tr><td>Fin de période d’essai</td><td>${formatDate(values.probationEndDate)}</td></tr></table>
      <h2>Article 1 · Emploi et classification</h2><p>Le salarié est engagé en qualité de <strong>${escapeHtml(position)}</strong>, au sein du département <strong>${escapeHtml(department)}</strong>. Les missions détaillées et le lieu de travail sont à préciser par l’employeur avant signature.</p>
      <h2>Article 2 · Durée et période d’essai</h2><p>Le contrat est conclu sous la forme « ${escapeHtml(contractType)} », à compter du ${formatDate(values.contractStartDate)}${values.contractEndDate ? ` et jusqu’au ${formatDate(values.contractEndDate)}` : ""}.${values.probationEndDate ? ` La période d’essai prend fin le ${formatDate(values.probationEndDate)}.` : ""}</p>
      <h2>Article 3 · Organisation du temps de travail</h2><p>Durée hebdomadaire contractuelle : <strong>${values.weeklyHours ? `${escapeHtml(values.weeklyHours)} heures` : "à renseigner"}</strong>.</p><table class="schedule"><thead><tr><th>Jour</th><th>Horaires de travail</th><th>Pause</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Article 4 · Classification, rémunération et conditions</h2><p>Catégorie professionnelle : <strong>${escapeHtml(values.professionalCategory || "à renseigner")}</strong> · Indice minimum de classification : <strong>${escapeHtml(values.classificationIndex || "à renseigner")}</strong> · Rémunération de référence : <strong>${values.grossSalary ? `${escapeHtml(values.grossSalary)} ${escapeHtml(values.currency)} / ${values.remunerationFrequency === "MONTHLY" ? "mois" : values.remunerationFrequency === "DAILY" ? "jour" : "heure"}` : "à renseigner"}</strong>. Lieu de travail et conditions particulières à préciser par l’employeur.</p>
      <div class="notice"><strong>Projet à compléter avant signature.</strong> L’article 18 du Code du travail malgache demande notamment la fonction, la catégorie professionnelle, l’indice minimum de classification, le salaire et la date d’effet. Vérifiez ces champs, les coordonnées légales de l’employeur, le lieu de travail et le modèle ministériel correspondant au type de contrat avant signature.</div>
      <div class="signatures"><div class="signature">Pour l’employeur · Fait à / date / signature</div><div class="signature">Le salarié · Fait à / date / signature</div></div><div class="footer">SYNAPRH · Document préparatoire · ${escapeHtml(contractReference)}</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
    popup.document.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateCurrentStep()) return;
    setSubmitting(true); setError("");
    try {
      const response = await fetch("/api/employees", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          days: scheduleDays(),
          phone: values.phone || undefined,
        birthDate: values.birthDate || undefined,
        street: values.street || undefined,
        city: values.city || undefined,
        postalCode: values.postalCode || undefined,
        country: values.country || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactRelationship: values.emergencyContactRelationship || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
        weeklyHours: values.weeklyHours ? Number(values.weeklyHours) : undefined,
        grossSalary: values.grossSalary ? Number(values.grossSalary) : undefined,
        currency: values.currency,
        remunerationFrequency: values.remunerationFrequency,
        professionalCategory: values.professionalCategory || undefined,
        classificationIndex: values.classificationIndex || undefined,
          managerId: values.managerId || undefined,
          contractEndDate: values.contractEndDate || undefined,
          probationEndDate: values.probationEndDate || undefined,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFrom(data, "La création de l’employé a échoué."));
      if (!data?.badgeNumber || !data?.contractNumber) throw new Error("L’employé a été créé, mais les références générées n’ont pas été reçues.");
      setCreatedReferences({ badgeNumber: data.badgeNumber, contractNumber: data.contractNumber });
      onCreated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue.");
    } finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={close} title="Ajouter un employé" description="Créez un dossier complet en quelques étapes." size="xl">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-50/80 px-5 py-6 lg:block">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Nouveau dossier</p>
          <ol className="space-y-2" aria-label="Etapes de creation">
            {steps.map((item, index) => {
              const Icon = item.icon; const active = index === step && !createdReferences; const complete = index < step || Boolean(createdReferences);
              return <li key={item.title}>
                <button type="button" disabled={!complete} onClick={() => setStep(index)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : complete ? "text-emerald-800 hover:bg-white" : "text-slate-400"}`}>
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-slate-900 text-white" : complete ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-400"}`}>{complete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span>
                  <span><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-[11px] text-slate-500">{item.hint}</span></span>
                </button>
              </li>;
            })}
          </ol>
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-5 text-slate-500">Les informations seront enregistrees a la derniere etape. Vous pourrez ajuster le planning depuis le dossier employe.</div>
        </aside>
        <div className="flex min-h-0 flex-col">
          {!createdReferences && <div className="border-b border-slate-100 px-5 py-3 lg:hidden">
            <div className="flex items-center justify-between text-xs"><span className="font-medium text-slate-500">Etape {step + 1} sur {steps.length}</span><span className="font-semibold text-slate-800">{steps[step].title}</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          </div>}
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-[280px] flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {createdReferences ? <div className="mx-auto flex min-h-[360px] max-w-lg flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Check className="h-7 w-7" /></span>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">Dossier employé créé</h2>
            <p className="mt-2 text-sm text-slate-500">Le matricule NFC et la référence du contrat ont été générés automatiquement.</p>
            <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-slate-200 p-4"><span className="text-xs text-slate-500">Matricule hexadécimal</span><p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">{createdReferences.badgeNumber}</p></div>
              <div className="rounded-xl border border-slate-200 p-4"><span className="text-xs text-slate-500">Numéro de contrat</span><p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">{createdReferences.contractNumber}</p></div>
            </div>
            <Button className="mt-6" onClick={() => generateContractPdf(createdReferences)} leftIcon={<Printer className="h-4 w-4" />}>Générer le PDF du contrat</Button>
            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">Le PDF reprend les données du dossier et reste un projet à compléter pour les mentions employeur, le lieu de travail et la rémunération.</p>
          </div> : loadingOptions ? <div className="flex h-52 items-center justify-center text-sm text-slate-500">Chargement des listes…</div> : !options ? <div className="flex min-h-52 items-center justify-center text-sm text-slate-500">Les options ne sont pas disponibles.</div> : <>
            {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Prénom" required><Input autoFocus autoComplete="given-name" value={values.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Ex. Amina" /></FormField>
              <FormField label="Nom" required><Input autoComplete="family-name" value={values.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Ex. Kamau" /></FormField>
              <FormField label="Adresse e-mail" required><Input type="email" autoComplete="email" value={values.email} onChange={(e) => update("email", e.target.value)} placeholder="prenom.nom@entreprise.com" /></FormField>
              <FormField label="Téléphone" htmlFor="employee-phone">
                <PhoneInput
                  className="employee-phone-input"
                  id="employee-phone"
                  defaultCountry="MG"
                  flags={flags}
                  countrySelectComponent={FlagOnlyCountrySelect}
                  international
                  value={values.phone || undefined}
                  onChange={(value) => update("phone", value ?? "")}
                  placeholder="34 12 345 67"
                />
              </FormField>
              <FormField label="Date d’embauche" required><Input type="date" value={values.hireDate} onChange={(e) => update("hireDate", e.target.value)} /></FormField>
              <FormField label="Date de naissance"><Input type="date" value={values.birthDate} onChange={(e) => update("birthDate", e.target.value)} /></FormField>
              <FormField label="Adresse"><Input autoComplete="street-address" value={values.street} onChange={(e) => update("street", e.target.value)} placeholder="Rue, quartier" /></FormField>
              <FormField label="Ville"><Input autoComplete="address-level2" value={values.city} onChange={(e) => update("city", e.target.value)} /></FormField>
              <FormField label="Code postal"><Input autoComplete="postal-code" value={values.postalCode} onChange={(e) => update("postalCode", e.target.value)} /></FormField>
              <FormField label="Pays"><Input autoComplete="country-name" value={values.country} onChange={(e) => update("country", e.target.value)} /></FormField>
              <div className="border-t border-slate-100 pt-3 sm:col-span-2"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact d’urgence</h3></div>
              <FormField label="Nom"><Input value={values.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} /></FormField>
              <FormField label="Lien avec l’employé"><Input value={values.emergencyContactRelationship} onChange={(e) => update("emergencyContactRelationship", e.target.value)} placeholder="Ex. conjoint, parent" /></FormField>
              <FormField label="Téléphone du contact"><Input type="tel" value={values.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} /></FormField>
            </div>}

            {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Département" required><Select value={values.departmentId} onChange={(e) => { update("departmentId", e.target.value); update("positionId", ""); update("managerId", ""); }}><option value="">Choisir un département</option>{options.departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select></FormField>
              <FormField label="Poste" required><Select value={values.positionId} onChange={(e) => { update("positionId", e.target.value); update("managerId", ""); }} disabled={!values.departmentId}><option value="">Choisir un poste</option>{filteredPositions.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</Select></FormField>
              <FormField label="Responsable hiérarchique" className="sm:col-span-2"><Select value={values.managerId} onChange={(e) => update("managerId", e.target.value)} disabled={!values.positionId}><option value="">Aucun responsable renseigné</option>{filteredManagers.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName} · {item.positionTitle}</option>)}</Select><span className="mt-1 block text-xs text-slate-500">Même département et niveau hiérarchique égal ou supérieur au poste sélectionné.</span></FormField>

            </div>}

            {step === 2 && <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="text-sm font-semibold text-slate-900">Horaires de la semaine</h3><p className="mt-1 text-xs text-slate-500">Activez les jours travaillés et ajustez les horaires et les pauses.</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Fuseau horaire : Antananarivo</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="hidden grid-cols-[145px_1fr_1fr] gap-3 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:grid"><span>Jour</span><span>Travail</span><span>Pause · facultative</span></div>
                <div className="divide-y divide-slate-100">
                  {week.map(([day, label]) => {
                    const item = schedule[day];
                    return <div key={day} className="grid gap-2 px-4 py-3 sm:grid-cols-[145px_1fr_1fr] sm:items-center">
                      <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700"><input type="checkbox" checked={item.active} onChange={(event) => updateSchedule(day, { active: event.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-slate-900" />{label}</label>
                      {item.active ? <>
                        <div className="flex items-center gap-2"><Input aria-label={`${label}, début du travail`} type="time" value={item.startTime} onChange={(event) => updateSchedule(day, { startTime: event.target.value })} className="px-2" /><span className="text-slate-400">?</span><Input aria-label={`${label}, fin du travail`} type="time" value={item.endTime} onChange={(event) => updateSchedule(day, { endTime: event.target.value })} className="px-2" /></div>
                        <div className="flex items-center gap-2"><Input aria-label={`${label}, début de pause`} type="time" value={item.breakStart} onChange={(event) => updateSchedule(day, { breakStart: event.target.value })} className="px-2" /><span className="text-slate-400">?</span><Input aria-label={`${label}, fin de pause`} type="time" value={item.breakEnd} onChange={(event) => updateSchedule(day, { breakEnd: event.target.value })} className="px-2" /></div>
                      </> : <span className="text-xs text-slate-400 sm:col-span-2">Jour de repos</span>}
                    </div>;
                  })}
                </div>
              </div>
              <p className="text-xs text-slate-500">La pause est facultative : laissez ses deux champs vides si la journée est continue. Le planning peut être modifié plus tard depuis la fiche employé.</p>
            </div>}

            {step === 3 && <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Type de contrat" required><Select value={values.contractTypeId} onChange={(e) => update("contractTypeId", e.target.value)}><option value="">Choisir un type</option>{options.contractTypes.map((item) => <option key={item._id} value={item._id}>{item.label}</option>)}</Select></FormField>
                <FormField label="Date de début" required><Input type="date" value={values.contractStartDate} onChange={(e) => update("contractStartDate", e.target.value)} /></FormField>
                <FormField label="Date de fin" required={Boolean(selectedContractType?.requiresEndDate)}><Input type="date" value={values.contractEndDate} onChange={(e) => update("contractEndDate", e.target.value)} /></FormField>
                <FormField label="Fin de période d’essai"><Input type="date" value={values.probationEndDate} onChange={(e) => update("probationEndDate", e.target.value)} /></FormField>
                <FormField label="Durée hebdomadaire contractuelle (heures)"><Input type="number" min="0" max="168" step="0.25" value={values.weeklyHours} onChange={(e) => update("weeklyHours", e.target.value)} placeholder="Ex. 40" /></FormField>
                <FormField label="Rémunération de référence"><Input type="number" min="0" step="0.01" value={values.grossSalary} onChange={(e) => update("grossSalary", e.target.value)} placeholder="Montant à renseigner" /></FormField>
                <FormField label="Devise"><Select value={values.currency} onChange={(e) => update("currency", e.target.value)}><option value="MGA">MGA · Ariary</option><option value="EUR">EUR · Euro</option><option value="USD">USD · Dollar US</option></Select></FormField>
                <FormField label="Périodicité"><Select value={values.remunerationFrequency} onChange={(e) => update("remunerationFrequency", e.target.value as FormValues["remunerationFrequency"])}><option value="MONTHLY">Mensuelle</option><option value="DAILY">Journalière</option><option value="HOURLY">Horaire</option></Select></FormField>
                <FormField label="Catégorie professionnelle"><Input maxLength={120} value={values.professionalCategory} onChange={(e) => update("professionalCategory", e.target.value)} placeholder="À renseigner selon la classification applicable" /></FormField>
                <FormField label="Indice minimum de classification"><Input maxLength={80} value={values.classificationIndex} onChange={(e) => update("classificationIndex", e.target.value)} placeholder="Indice prévu par la classification" /></FormField>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-800">Aperçu du contrat</p><p className="mt-1 text-xs text-slate-500">Consultez le PDF avant l’ajout. La référence du contrat et le matricule seront attribués à l’enregistrement.</p></div><Button variant="outline" size="sm" onClick={() => generateContractPdf()} leftIcon={<Printer className="h-4 w-4" />}>Voir le PDF</Button></div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-200 pt-3 text-sm"><dt className="text-slate-500">Employé</dt><dd className="text-right font-medium text-slate-800">{values.firstName} {values.lastName}</dd><dt className="text-slate-500">Poste</dt><dd className="text-right font-medium text-slate-800">{filteredPositions.find((x) => x._id === values.positionId)?.title ?? "—"}</dd><dt className="text-slate-500">Département</dt><dd className="text-right font-medium text-slate-800">{options.departments.find((x) => x._id === values.departmentId)?.name ?? "—"}</dd><dt className="text-slate-500">Contrat</dt><dd className="text-right font-medium text-slate-800">{selectedContractType?.label ?? "—"} · Généré à la création</dd></dl>
              </div>
            </div>}
          </>}
          {error && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-100 px-5 py-4 sm:px-7">
          {createdReferences ? <><span className="text-xs text-slate-500">Références enregistrées dans le dossier</span><Button variant="outline" onClick={close}>Terminer</Button></> : <>
            <Button variant="ghost" onClick={() => step === 0 ? close() : setStep((current) => current - 1)} disabled={submitting} leftIcon={step > 0 ? <ArrowLeft className="h-4 w-4" /> : undefined}>{step === 0 ? "Annuler" : "Retour"}</Button>
            <div className="flex items-center gap-2"><span className="mr-1 text-xs text-slate-400">{step + 1} / 4</span>{step < 3 ? <Button onClick={nextStep} disabled={loadingOptions || !options} rightIcon={<ArrowRight className="h-4 w-4" />}>Continuer</Button> : <Button type="submit" loading={submitting} disabled={!options} leftIcon={<Check className="h-4 w-4" />}>Créer l’employé</Button>}</div>
          </>}
        </footer>
      </form>
        </div>
      </div>
    </Modal>
  );
}
