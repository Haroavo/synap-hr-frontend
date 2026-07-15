import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();

  return (
    <main className="min-h-screen bg-[#f5f8fc] p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <p className="text-sm font-medium text-[#218be4]">SynapRH</p>

          <h1 className="mt-2 text-3xl font-bold text-[#071b3d]">
            Tableau de bord
          </h1>

          <p className="mt-3 text-slate-500">Bienvenue, {user.username}.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-[#eaf7fd] px-3 py-1 text-sm font-medium text-[#218be4]"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
