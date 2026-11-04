"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  Building2,
  CheckCircle2,
  ImageIcon,
  LoaderCircle,
  Palette,
  RotateCcw,
  Save,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  type AppearanceTheme,
  defaultTheme,
  useTheme,
} from "@/components/theme/theme-provider";

type ColorKey =
  | "primaryColor"
  | "secondaryColor"
  | "sidebarColor"
  | "backgroundColor"
  | "surfaceColor"
  | "textColor"
  | "mutedTextColor"
  | "borderColor";

type ColorField = {
  key: ColorKey;
  label: string;
  description: string;
};

type AppearanceApiResponse = Partial<AppearanceTheme> & {
  message?: string | string[];
};

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/i;

const colorFields: ColorField[] = [
  {
    key: "primaryColor",
    label: "Couleur principale",
    description: "Boutons, liens, états actifs et éléments importants.",
  },
  {
    key: "secondaryColor",
    label: "Couleur secondaire",
    description: "Dégradés, accents et éléments complémentaires.",
  },
  {
    key: "sidebarColor",
    label: "Couleur du menu",
    description: "Arrière-plan de la barre principale de navigation.",
  },
  {
    key: "backgroundColor",
    label: "Arrière-plan",
    description: "Couleur générale du fond de l’application.",
  },
  {
    key: "surfaceColor",
    label: "Cartes et surfaces",
    description: "Couleur des cartes, formulaires et panneaux.",
  },
  {
    key: "textColor",
    label: "Texte principal",
    description: "Titres et textes importants de l’interface.",
  },
  {
    key: "mutedTextColor",
    label: "Texte secondaire",
    description: "Descriptions et informations secondaires.",
  },
  {
    key: "borderColor",
    label: "Bordures",
    description:
      "Couleur utilisée pour les séparateurs et bordures ailleurs dans l’application.",
  },
];

function getApiMessage(
  data: AppearanceApiResponse | null,
  fallback: string,
): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  return data?.message ?? fallback;
}

function normalizeTheme(
  data: AppearanceApiResponse,
  fallback: AppearanceTheme,
): AppearanceTheme {
  return {
    companyName:
      typeof data.companyName === "string"
        ? data.companyName
        : fallback.companyName,

    logoUrl:
      typeof data.logoUrl === "string" || data.logoUrl === null
        ? data.logoUrl
        : fallback.logoUrl,

    primaryColor:
      typeof data.primaryColor === "string"
        ? data.primaryColor
        : fallback.primaryColor,

    secondaryColor:
      typeof data.secondaryColor === "string"
        ? data.secondaryColor
        : fallback.secondaryColor,

    sidebarColor:
      typeof data.sidebarColor === "string"
        ? data.sidebarColor
        : fallback.sidebarColor,

    backgroundColor:
      typeof data.backgroundColor === "string"
        ? data.backgroundColor
        : fallback.backgroundColor,

    surfaceColor:
      typeof data.surfaceColor === "string"
        ? data.surfaceColor
        : fallback.surfaceColor,

    textColor:
      typeof data.textColor === "string" ? data.textColor : fallback.textColor,

    mutedTextColor:
      typeof data.mutedTextColor === "string"
        ? data.mutedTextColor
        : fallback.mutedTextColor,

    borderColor:
      typeof data.borderColor === "string"
        ? data.borderColor
        : fallback.borderColor,
  };
}

function normalizeThemeForComparison(
  appearance: AppearanceTheme,
): AppearanceTheme {
  return {
    companyName: appearance.companyName.trim(),
    logoUrl: appearance.logoUrl?.trim() || null,

    primaryColor: appearance.primaryColor.toUpperCase(),

    secondaryColor: appearance.secondaryColor.toUpperCase(),

    sidebarColor: appearance.sidebarColor.toUpperCase(),

    backgroundColor: appearance.backgroundColor.toUpperCase(),

    surfaceColor: appearance.surfaceColor.toUpperCase(),

    textColor: appearance.textColor.toUpperCase(),

    mutedTextColor: appearance.mutedTextColor.toUpperCase(),

    borderColor: appearance.borderColor.toUpperCase(),
  };
}

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  const [draft, setDraft] = useState<AppearanceTheme>(theme);

  const [savedTheme, setSavedTheme] = useState<AppearanceTheme>(theme);

  const [loadingSettings, setLoadingSettings] = useState(true);

  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const hasChanges = useMemo(() => {
    const normalizedDraft = normalizeThemeForComparison(draft);

    const normalizedSavedTheme = normalizeThemeForComparison(savedTheme);

    return (
      JSON.stringify(normalizedDraft) !== JSON.stringify(normalizedSavedTheme)
    );
  }, [draft, savedTheme]);

  useEffect(() => {
    let mounted = true;

    async function loadAppearanceSettings() {
      setLoadingSettings(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/settings/appearance", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response
          .json()
          .catch(() => null)) as AppearanceApiResponse | null;

        if (!response.ok) {
          throw new Error(
            getApiMessage(
              data,
              "Impossible de charger les paramètres d’apparence.",
            ),
          );
        }

        if (!mounted || !data) {
          return;
        }

        const loadedTheme = normalizeTheme(data, defaultTheme);

        setDraft(loadedTheme);
        setSavedTheme(loadedTheme);
        setTheme(loadedTheme);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant le chargement.",
        );
      } finally {
        if (mounted) {
          setLoadingSettings(false);
        }
      }
    }

    void loadAppearanceSettings();

    return () => {
      mounted = false;
    };
  }, [setTheme]);

  useEffect(() => {
    setLogoPreviewError(false);
  }, [draft.logoUrl]);

  function updateThemeField<K extends keyof AppearanceTheme>(
    key: K,
    value: AppearanceTheme[K],
  ) {
    setSuccessMessage("");
    setErrorMessage("");

    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function updateColor(key: ColorKey, value: string) {
    updateThemeField(key, value.toUpperCase());
  }

  function validateDraft(): string | null {
    const companyName = draft.companyName.trim();

    if (!companyName) {
      return "Le nom de l’entreprise est obligatoire.";
    }

    if (companyName.length > 100) {
      return "Le nom de l’entreprise ne doit pas dépasser 100 caractères.";
    }

    for (const field of colorFields) {
      if (!HEX_COLOR_PATTERN.test(draft[field.key])) {
        return `${field.label} doit respecter le format #RRGGBB.`;
      }
    }

    const logoUrl = draft.logoUrl?.trim();

    if (
      logoUrl &&
      !logoUrl.startsWith("/") &&
      !logoUrl.startsWith("http://") &&
      !logoUrl.startsWith("https://")
    ) {
      return "Le logo doit être un chemin local commençant par / ou une URL HTTP/HTTPS.";
    }

    return null;
  }

  async function handleSave() {
    if (saving || !hasChanges) {
      return;
    }

    setSuccessMessage("");
    setErrorMessage("");

    const validationError = validateDraft();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    const payload = normalizeThemeForComparison(draft);

    try {
      const response = await fetch("/api/settings/appearance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response
        .json()
        .catch(() => null)) as AppearanceApiResponse | null;

      if (!response.ok) {
        throw new Error(
          getApiMessage(
            data,
            "Impossible d’enregistrer les paramètres d’apparence.",
          ),
        );
      }

      const updatedTheme = normalizeTheme(data ?? payload, payload);

      setDraft(updatedTheme);
      setSavedTheme(updatedTheme);
      setTheme(updatedTheme);

      setSuccessMessage(
        "Les paramètres d’apparence ont été enregistrés avec succès.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue pendant l’enregistrement.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancelChanges() {
    setDraft(savedTheme);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function handleResetToDefault() {
    setDraft(defaultTheme);
    setSuccessMessage("");
    setErrorMessage("");
  }

  if (loadingSettings) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-app-muted">
          <LoaderCircle className="h-7 w-7 animate-spin text-app-primary" />

          <p className="text-sm">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-5 lg:p-7">
      <header className="shrink-0">
        <div className="flex items-start gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0",
              "items-center justify-center",
              "rounded-2xl text-app-primary",
              "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)]",
            ].join(" ")}
          >
            <Palette className="h-6 w-6" strokeWidth={1.8} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-app-text">Apparence</h1>

            <p className="mt-1 text-sm leading-6 text-app-muted">
              Personnalisez l’identité visuelle de votre entreprise et les
              couleurs de l’application.
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6 pb-2">
          <SettingsSection
            icon={<Building2 className="h-5 w-5" strokeWidth={1.8} />}
            title="Identité de l’entreprise"
            description="Définissez le nom et le logo affichés dans le sous-menu."
          >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_220px]">
              {/* Nom de l’entreprise */}
              <label className="block">
                <span className="text-sm font-semibold text-app-text">
                  Nom de l’entreprise
                </span>

                <input
                  type="text"
                  value={draft.companyName}
                  onChange={(event) =>
                    updateThemeField("companyName", event.target.value)
                  }
                  placeholder="Nom de l’entreprise"
                  maxLength={100}
                  disabled={saving}
                  className={[
                    "mt-3 h-11 w-full rounded-xl",
                    "bg-app-background px-4",
                    "text-sm text-app-text outline-none",
                    "transition placeholder:text-slate-400",
                    "focus:bg-app-surface",
                    "focus:ring-4",
                    "focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]",
                    "disabled:cursor-not-allowed",
                    "disabled:opacity-60",
                  ].join(" ")}
                />

                <p className="mt-2 text-xs text-app-muted">
                  Ce nom sera affiché à côté du logo.
                </p>
              </label>

              {/* URL du logo */}
              <label className="block">
                <span className="text-sm font-semibold text-app-text">
                  Logo de l’entreprise
                </span>

                <div className="relative mt-3">
                  <ImageIcon
                    className={[
                      "pointer-events-none absolute",
                      "left-4 top-1/2 h-5 w-5",
                      "-translate-y-1/2 text-app-muted",
                    ].join(" ")}
                    strokeWidth={1.8}
                  />

                  <input
                    type="text"
                    value={draft.logoUrl ?? ""}
                    onChange={(event) =>
                      updateThemeField("logoUrl", event.target.value)
                    }
                    placeholder="/images/logo_aelovis.png"
                    disabled={saving}
                    className={[
                      "h-11 w-full rounded-xl",
                      "bg-app-background pl-12 pr-4",
                      "text-sm text-app-text outline-none",
                      "transition placeholder:text-slate-400",
                      "focus:bg-app-surface",
                      "focus:ring-4",
                      "focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]",
                      "disabled:cursor-not-allowed",
                      "disabled:opacity-60",
                    ].join(" ")}
                  />
                </div>

                <p className="mt-2 text-xs text-app-muted">
                  Exemple :{" "}
                  <code className="font-mono text-app-primary">
                    /images/logo_aelovis.png
                  </code>
                </p>
              </label>

              {/* Aperçu du logo */}
              <div>
                <p className="text-sm font-semibold text-app-text">
                  Aperçu du logo
                </p>

                <div
                  className={[
                    "mt-3 flex h-[110px]",
                    "items-center justify-center",
                    "rounded-2xl",
                    "bg-app-background p-4",
                  ].join(" ")}
                >
                  {draft.logoUrl && !logoPreviewError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.logoUrl}
                      alt={`Logo ${draft.companyName}`}
                      onError={() => setLogoPreviewError(true)}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <ImageIcon
                        className="mx-auto h-7 w-7 text-app-muted"
                        strokeWidth={1.6}
                      />

                      <p className="mt-2 text-xs text-app-muted">
                        {logoPreviewError ? "Logo introuvable" : "Aucun logo"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information */}
            <div className="mt-5 rounded-xl bg-app-background px-4 py-3 text-xs leading-5 text-app-muted">
              Pour un fichier local, placez l’image dans{" "}
              <code className="font-mono font-semibold text-app-text">
                public/images
              </code>{" "}
              puis utilisez le chemin{" "}
              <code className="font-mono font-semibold text-app-primary">
                /images/nom-du-logo.png
              </code>
              .
            </div>
          </SettingsSection>

          {/* Couleurs */}
          <SettingsSection
            icon={<Palette className="h-5 w-5" strokeWidth={1.8} />}
            title="Couleurs de l’interface"
            description="Les valeurs seront appliquées seulement après l’enregistrement."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {colorFields.map((field) => (
                <ColorSettingCard
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  disabled={saving}
                  onChange={(value) => updateColor(field.key, value)}
                />
              ))}
            </div>
          </SettingsSection>

          {/* Succès */}
          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

              <p>{successMessage}</p>
            </div>
          )}

          {/* Erreur */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />

              <p>{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          {hasChanges && (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={saving}
                className={[
                  "flex h-11 items-center gap-2",
                  "rounded-xl bg-app-background px-4",
                  "text-sm font-semibold text-app-text",
                  "transition hover:brightness-95",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                <RotateCcw className="h-4 w-4" />
                Valeurs par défaut
              </button>

              <button
                type="button"
                onClick={handleCancelChanges}
                disabled={saving}
                className={[
                  "flex h-11 items-center gap-2",
                  "rounded-xl bg-slate-100 px-5",
                  "text-sm font-semibold text-app-text",
                  "transition hover:bg-slate-200",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                <X className="h-4 w-4" />
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className={[
                  "flex h-11 items-center gap-2",
                  "rounded-xl bg-app-primary px-5",
                  "text-sm font-semibold text-white",
                  "shadow-sm transition hover:opacity-90",
                  "disabled:cursor-not-allowed",
                  "disabled:opacity-60",
                ].join(" ")}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SettingsSectionProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

function SettingsSection({
  icon,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="rounded-2xl bg-app-surface p-5 shadow-sm lg:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-app-primary">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-bold text-app-text">{title}</h2>

          <p className="mt-1 text-sm leading-5 text-app-muted">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

type ColorSettingCardProps = {
  field: ColorField;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function ColorSettingCard({
  field,
  value,
  disabled,
  onChange,
}: ColorSettingCardProps) {
  const validColor = HEX_COLOR_PATTERN.test(value);

  return (
    <div
      className={[
        "rounded-2xl bg-app-background p-4",
        "transition",
        !validColor ? "bg-red-50" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Aperçu de la couleur */}
        <div
          className="h-10 w-10 shrink-0 rounded-xl shadow-sm"
          style={{
            backgroundColor: validColor ? value : "transparent",
          }}
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-app-text">{field.label}</p>

          <p className="mt-1 text-xs leading-5 text-app-muted">
            {field.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          type="color"
          aria-label={`Sélectionner ${field.label.toLowerCase()}`}
          value={validColor ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={[
            "h-11 w-14 shrink-0 cursor-pointer",
            "overflow-hidden rounded-xl",
            "bg-app-surface p-1 shadow-sm",
            "disabled:cursor-not-allowed",
            "disabled:opacity-60",
          ].join(" ")}
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#16775C"
          maxLength={7}
          disabled={disabled}
          className={[
            "h-11 min-w-0 flex-1 rounded-xl",
            "bg-app-surface px-3",
            "font-mono text-sm uppercase",
            "text-app-text outline-none",
            "transition",
            "focus:ring-4",
            validColor
              ? "focus:ring-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
              : "bg-red-100 focus:ring-red-200",
            "disabled:cursor-not-allowed",
            "disabled:opacity-60",
          ].join(" ")}
        />
      </div>

      {!validColor && (
        <p className="mt-2 text-xs text-red-600">Utilisez le format #RRGGBB.</p>
      )}
    </div>
  );
}
