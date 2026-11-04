import { HrAnalyticsPage } from "@/components/dashboard/hr-analytics-page";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardAnalyticsRoute() {
  await requireAuthenticatedUser();
  return <HrAnalyticsPage />;
}
