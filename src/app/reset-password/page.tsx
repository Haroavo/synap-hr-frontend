"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
} from "lucide-react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { authApi } from "@/API";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("Le lien de réinitialisation est invalide.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({ token, newPassword });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.message ?? "Impossible de modifier le mot de passe.",
        );
      }

      setSuccess(true);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f4f8fd] px-5">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8">
        {success ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#152B3B]">
              Mot de passe modifié
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>

            <Link
              href="/authentication"
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#16775C] text-sm font-semibold text-white"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7fd]">
              <KeyRound className="h-7 w-7 text-[#16775C]" />
            </div>

            <h1 className="mt-5 text-2xl font-bold text-[#152B3B]">
              Nouveau mot de passe
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Saisissez et confirmez votre nouveau mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-semibold text-[#152B3B]"
                >
                  Nouveau mot de passe
                </label>

                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 text-sm outline-none focus:border-[#16775C] focus:ring-4 focus:ring-[#16775C]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmation"
                  className="mb-2 block text-sm font-semibold text-[#152B3B]"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirmation"
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#16775C] focus:ring-4 focus:ring-[#16775C]/10"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#16775C] text-sm font-semibold text-white transition hover:bg-[#12664E] disabled:opacity-60"
              >
                {loading && <LoaderCircle className="h-5 w-5 animate-spin" />}

                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-[#f4f8fd]">
          <LoaderCircle className="h-8 w-8 animate-spin text-[#16775C]" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
