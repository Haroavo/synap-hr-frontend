"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { employeeSchedulesApi } from "@/API/employee-schedules.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

type DayKey = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
type TimeSlot = { startTime: string; endTime: string; work: boolean };
type ScheduleDay = { day: DayKey; timeSlots: TimeSlot[] };

const dayLabels: Record<DayKey, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

type EditEmployeeScheduleModalProps = {
  open: boolean;
  employeeId: string;
  initialDays: ScheduleDay[];
  onClose: () => void;
  onSaved: () => void;
};

export function EditEmployeeScheduleModal({
  open,
  employeeId,
  initialDays,
  onClose,
  onSaved,
}: EditEmployeeScheduleModalProps) {
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDays(normalizeDays(initialDays));
    setEffectiveDate(todayInAntananarivo());
    setReason("");
    setError("");
  }, [open, initialDays]);

  function updateDay(day: DayKey, timeSlots: TimeSlot[]) {
    setDays((current) => current.map((entry) => entry.day === day ? { ...entry, timeSlots } : entry));
    setError("");
  }

  function updateSlot(day: DayKey, index: number, patch: Partial<TimeSlot>) {
    const entry = days.find((item) => item.day === day);
    if (!entry) return;
    updateDay(day, entry.timeSlots.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot));
  }

  function addSlot(day: DayKey) {
    const entry = days.find((item) => item.day === day);
    if (!entry) return;
    const sortedSlots = [...entry.timeSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let startMinutes = 8 * 60;
    for (const slot of sortedSlots) {
      const [slotStartHour, slotStartMinute] = slot.startTime.split(":").map(Number);
      const [slotEndHour, slotEndMinute] = slot.endTime.split(":").map(Number);
      const slotStart = slotStartHour * 60 + slotStartMinute;
      const slotEnd = slotEndHour * 60 + slotEndMinute;
      if (startMinutes + 60 <= slotStart) break;
      startMinutes = Math.max(startMinutes, slotEnd);
    }
    if (startMinutes + 60 > 23 * 60 + 59) {
      setError(`Aucun créneau libre d’une heure n’a été trouvé le ${dayLabels[day].toLowerCase()}.`);
      return;
    }
    const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
    const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59);
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
    updateDay(day, [...entry.timeSlots, { startTime, endTime, work: true }].sort((a, b) => a.startTime.localeCompare(b.startTime)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveDate || reason.trim().length < 3) {
      setError("Indiquez une date d’effet et un motif d’au moins trois caractères.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await employeeSchedulesApi.update(employeeId, {
        days,
        effectiveDate,
        reason: reason.trim(),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(" ") : data?.message;
        throw new Error(message ?? "La mise à jour du planning a échoué.");
      }
      onClose();
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La mise à jour du planning a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Modifier le planning"
      description="Les changements sont historisés et appliqués à partir de la date choisie."
    >
      <form onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Date d’effet
              <Input type="date" required value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Motif de la modification
              <Input required minLength={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. Nouveaux horaires convenus" />
            </label>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {days.map((entry) => (
              <section key={entry.day} className="rounded-2xl border border-slate-200 bg-white p-4">
                <header className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{dayLabels[entry.day]}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{entry.timeSlots.length ? `${entry.timeSlots.length} créneau(x)` : "Jour de repos"}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => addSlot(entry.day)}>
                    Ajouter
                  </Button>
                </header>

                <div className="space-y-2">
                  {entry.timeSlots.map((slot, index) => (
                    <div key={`${entry.day}-${index}`} className="grid grid-cols-[1fr_1fr_112px_36px] items-center gap-2">
                      <Input aria-label={`${dayLabels[entry.day]} début du créneau ${index + 1}`} type="time" value={slot.startTime} onChange={(event) => updateSlot(entry.day, index, { startTime: event.target.value })} />
                      <Input aria-label={`${dayLabels[entry.day]} fin du créneau ${index + 1}`} type="time" value={slot.endTime} onChange={(event) => updateSlot(entry.day, index, { endTime: event.target.value })} />
                      <Select aria-label={`${dayLabels[entry.day]} type du créneau ${index + 1}`} value={slot.work ? "work" : "break"} onChange={(event) => updateSlot(entry.day, index, { work: event.target.value === "work" })}>
                        <option value="work">Travail</option>
                        <option value="break">Pause</option>
                      </Select>
                      <button type="button" aria-label={`Supprimer le créneau ${index + 1} du ${dayLabels[entry.day]}`} onClick={() => updateDay(entry.day, entry.timeSlots.filter((_, slotIndex) => slotIndex !== index))} className="flex h-10 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {!entry.timeSlots.length && <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">Aucun horaire enregistré pour ce jour.</p>}
                </div>
              </section>
            ))}
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-7">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button type="submit" loading={saving} disabled={!effectiveDate || reason.trim().length < 3}>Enregistrer le planning</Button>
        </footer>
      </form>
    </Modal>
  );
}

function normalizeDays(days: ScheduleDay[]): ScheduleDay[] {
  return days.map((entry) => ({
    day: entry.day,
    timeSlots: entry.timeSlots?.length === 1 && !entry.timeSlots[0].work &&
      entry.timeSlots[0].startTime === "00:00" && entry.timeSlots[0].endTime === "23:59"
      ? []
      : (entry.timeSlots ?? []).map((slot) => ({ ...slot })),
  }));
}

function todayInAntananarivo(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Antananarivo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
