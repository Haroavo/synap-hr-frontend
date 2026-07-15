"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function AuthenticationPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: identifier,
          password,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        user?: {
          username: string;
          roles: string[];
        };
      } | null;

      if (!response.ok) {
        throw new Error(
          data?.message ?? "Identifiant ou mot de passe incorrect",
        );
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-white">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[36%_64%]">
        <section className="relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-white px-7 py-5 lg:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(76,184,233,0.18) 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative z-10 w-full max-w-[380px]">
            <div className="mb-4 flex justify-center">
              <div className="flex items-center justify-center bg-white px-3 py-2">
                <Image
                  src="/images/synaphr-logo.png"
                  alt="Logo SynapRH"
                  width={260}
                  height={90}
                  priority
                  className="h-auto w-[190px] object-contain xl:w-[300px]"
                />
              </div>
            </div>

            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#4cb8e9]/30 bg-[#edf8fe] px-4 py-2 text-xs font-medium text-[#218be4]">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                <span>Espace administrateur</span>
              </div>
            </div>

            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-[#071b3d]">
                Connexion
              </h1>

              <p className="mx-auto mt-2 max-w-[320px] text-sm leading-6 text-slate-500">
                Accédez à votre espace de gestion des ressources humaines.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-semibold text-[#071b3d]"
                >
                  Identifiant
                </label>

                <div className="group relative">
                  <UserRound
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#218be4]"
                    strokeWidth={1.8}
                  />

                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Entrez votre identifiant"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfdff] pl-12 pr-4 text-sm text-[#071b3d] outline-none transition placeholder:text-slate-400 hover:border-[#4cb8e9]/70 focus:border-[#218be4] focus:bg-white focus:ring-4 focus:ring-[#218be4]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#071b3d]"
                >
                  Mot de passe
                </label>

                <div className="group relative">
                  <LockKeyhole
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-[#218be4]"
                    strokeWidth={1.8}
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                    className="h-12 w-full rounded-xl border border-slate-200 bg-[#fbfdff] pl-12 pr-12 text-sm text-[#071b3d] outline-none transition placeholder:text-slate-400 hover:border-[#4cb8e9]/70 focus:border-[#218be4] focus:bg-white focus:ring-4 focus:ring-[#218be4]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-[#eef6ff] hover:text-[#218be4]"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" strokeWidth={1.8} />
                    ) : (
                      <Eye className="h-5 w-5" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-[#218be4] transition hover:text-[#071b3d] hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#4cb8e9] to-[#218be4] px-5 text-sm font-semibold text-white transition duration-300 hover:from-[#38abe2] hover:to-[#167bd3] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:from-[#4cb8e9] disabled:hover:to-[#218be4]"
              >
                <span>{loading ? "Connexion..." : "Se connecter"}</span>

                {!loading && (
                  <ArrowRight
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                )}
              </button>
            </form>
          </div>
        </section>

        <section className="relative hidden h-full min-h-0 w-full overflow-hidden bg-[#eaf3ff] lg:block">
          <Image
            src="/images/auth.png"
            alt="Présentation de l’application SynapRH"
            fill
            priority
            sizes="64vw"
            className="object-cover object-center"
          />
        </section>
      </div>
    </main>
  );
}
