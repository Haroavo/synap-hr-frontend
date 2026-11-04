"use client";

import { LoaderCircle, LogOut } from "lucide-react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/API";

export function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authApi.logout();

      if (!response.ok) {
        throw new Error("La déconnexion a échoué.");
      }

      router.replace("/authentication");

      router.refresh();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Une erreur est survenue.",
      );

      setLoading(false);
    }
  }

  return (
    <div className="group/logout relative">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="Se déconnecter"
        title="Se déconnecter"
        className={[
          "flex h-11 w-11 items-center justify-center rounded-xl",
          "text-blue-100/60 transition duration-200",
          "hover:bg-red-500/15 hover:text-red-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        {loading ? (
          <LoaderCircle
            className="h-[21px] w-[21px] animate-spin"
            strokeWidth={1.8}
          />
        ) : (
          <LogOut className="h-[21px] w-[21px]" strokeWidth={1.8} />
        )}
      </button>

      <span className="pointer-events-none absolute bottom-1/2 left-[58px] z-50 translate-y-1/2 whitespace-nowrap rounded-lg bg-[#152B3B] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover/logout:opacity-100">
        {loading ? "Déconnexion..." : "Se déconnecter"}

        <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent border-r-[#152B3B]" />
      </span>

      {error && (
        <span
          role="alert"
          className="absolute bottom-0 left-[58px] z-50 w-56 translate-y-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg"
        >
          {error}
        </span>
      )}
    </div>
  );
}
