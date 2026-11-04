import { CalendarRange } from "lucide-react";
import { EmployeeScheduleFinder } from "@/components/employees/employee-schedule-finder";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function EmployeeSchedulesPage() {
  await requireAuthenticatedUser();

  return (
    <main className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto bg-[#f5f8fc] p-5 lg:p-7">
      <header className="shrink-0">
        <p className="text-xs font-medium text-slate-500">Temps et absences <span className="mx-2">›</span> Planning des employés</p>
        <div className="mt-2 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CalendarRange className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Planning des employés</h1>
            <p className="mt-1 text-sm text-slate-500">Recherchez une personne pour consulter ses horaires et son historique de présence.</p>
          </div>
        </div>
      </header>

      <EmployeeScheduleFinder />
    </main>
  );
}
