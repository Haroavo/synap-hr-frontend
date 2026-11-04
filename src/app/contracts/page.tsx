import { ContractsPage } from "@/components/contracts/contracts-page";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ContractsRoute() {
  await requireAuthenticatedUser();
  return <ContractsPage />;
}
