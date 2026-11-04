"use client";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Send,
} from "lucide-react";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authApi } from "@/API";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.forgotPassword({ email });

      const data = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Impossible d'effectuer la demande.");
      }

      setMessage(data.message ?? "Consultez votre boîte de réception.");
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
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7fd]">
          <Mail className="h-7 w-7 text-[#16775C]" />
        </div>

        <h1 className="text-2xl font-bold text-[#152B3B]">
          Mot de passe oublié
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Entrez l’adresse e-mail associée à votre compte SynapRH.
        </p>

        {message ? (
          <div className="mt-7">
            <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{message}</p>
            </div>

            <Link
              href="/authentication"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#16775C]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-[#152B3B]"
              >
                Adresse e-mail
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nom@entreprise.com"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm outline-none focus:border-[#16775C] focus:ring-4 focus:ring-[#16775C]/10"
                />
              </div>
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
              {loading ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Envoyer le lien
                </>
              )}
            </button>

            <Link
              href="/authentication"
              className="flex items-center justify-center gap-2 text-sm font-medium text-[#16775C]"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
