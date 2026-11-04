import { CalendarPage } from "@/components/dashboard/calendar-page";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardCalendarRoute() {
  await requireAuthenticatedUser();
  return <CalendarPage />;
}
