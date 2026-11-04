import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();
  return <DashboardOverview username={user.username} />;
}
