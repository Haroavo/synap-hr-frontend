"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

export type AppearanceTheme = {
  companyName: string;
  logoUrl: string | null;

  primaryColor: string;
  secondaryColor: string;
  sidebarColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
};

export const defaultTheme: AppearanceTheme = {
  companyName: "SynapRH",
  logoUrl: "/images/synaphr-logo.png",

  primaryColor: "#16775C",
  secondaryColor: "#53A786",
  sidebarColor: "#152B3B",
  backgroundColor: "#F4F7F6",
  surfaceColor: "#FFFFFF",
  textColor: "#152B3B",
  mutedTextColor: "#71838D",
  borderColor: "#E4EBE8",
};

type ThemeContextValue = {
  theme: AppearanceTheme;
  setTheme: (theme: AppearanceTheme) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  initialTheme?: AppearanceTheme;
};

export function ThemeProvider({
  children,
  initialTheme = defaultTheme,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<AppearanceTheme>(initialTheme);

  const cssVariables = useMemo(
    () =>
      ({
        "--color-primary": theme.primaryColor,

        "--color-secondary": theme.secondaryColor,

        "--color-sidebar": theme.sidebarColor,

        "--color-background": theme.backgroundColor,

        "--color-surface": theme.surfaceColor,

        "--color-text": theme.textColor,

        "--color-muted-text": theme.mutedTextColor,

        "--color-border": theme.borderColor,
      }) as CSSProperties,
    [theme],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resetTheme: () => setTheme(defaultTheme),
      }}
    >
      <div
        style={cssVariables}
        className="h-full min-h-dvh bg-[var(--color-background)] text-[var(--color-text)]"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme doit être utilisé dans ThemeProvider");
  }

  return context;
}
