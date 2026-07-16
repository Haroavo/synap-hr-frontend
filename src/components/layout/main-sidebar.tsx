"use client";

import type { SidebarMenu } from "@/config/sidebar-navigation";
import { LogoutButton } from "@/components/auth/logout-button";

type MainSidebarProps = {
  menus: SidebarMenu[];
  activeMenuId: string;
  onSelectMenu: (menuId: string) => void;
  userInitials: string;
};

export function MainSidebar({
  menus,
  activeMenuId,
  onSelectMenu,
  userInitials,
}: MainSidebarProps) {
  return (
    <aside
      className={[
        "relative z-40 flex h-dvh w-[72px] shrink-0 flex-col",
        "items-center border-r py-3",
      ].join(" ")}
      style={{
        background:
          "linear-gradient(180deg, var(--color-sidebar) 0%, color-mix(in srgb, var(--color-sidebar) 82%, black) 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Logo compact du produit SynapRH */}
      <div
        className={[
          "mb-5 flex h-11 w-11 items-center justify-center",
          "rounded-xl text-sm font-bold text-white shadow-sm",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(135deg, var(--color-secondary), var(--color-primary))",
        }}
      >
        SR
      </div>

      {/* Menu principal */}
      <nav
        aria-label="Menu principal"
        className="flex min-h-0 w-full flex-1 flex-col items-center gap-2"
      >
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = menu.id === activeMenuId;

          return (
            <div key={menu.id} className="group relative">
              <button
                type="button"
                aria-label={menu.label}
                aria-pressed={active}
                onClick={() => onSelectMenu(menu.id)}
                className={[
                  "relative flex h-11 w-11 items-center justify-center",
                  "rounded-xl transition duration-200",
                  active
                    ? "text-white shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white",
                ].join(" ")}
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg, var(--color-secondary), var(--color-primary))",
                      }
                    : undefined
                }
              >
                {/* Indicateur du menu actif */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-[14px] h-7 w-1 rounded-r-full"
                    style={{
                      backgroundColor: "var(--color-secondary)",
                    }}
                  />
                )}

                <Icon className="h-[21px] w-[21px]" strokeWidth={1.8} />
              </button>

              {/* Infobulle */}
              <SidebarTooltip label={menu.label} />
            </div>
          );
        })}
      </nav>

      {/* Profil et déconnexion */}
      <div className="mt-4 flex shrink-0 flex-col items-center gap-2">
        <div className="group/profile relative">
          <button
            type="button"
            aria-label="Mon profil"
            className={[
              "flex h-11 w-11 items-center justify-center rounded-full",
              "border text-xs font-bold text-white shadow-sm",
              "transition duration-200 hover:scale-105",
            ].join(" ")}
            style={{
              background:
                "linear-gradient(135deg, var(--color-secondary), var(--color-primary))",
              borderColor: "rgba(255, 255, 255, 0.25)",
            }}
          >
            {userInitials || "U"}
          </button>

          <SidebarTooltip label="Mon profil" hoverGroup="profile" />
        </div>

        <LogoutButton />
      </div>
    </aside>
  );
}

type SidebarTooltipProps = {
  label: string;
  hoverGroup?: "default" | "profile";
};

function SidebarTooltip({
  label,
  hoverGroup = "default",
}: SidebarTooltipProps) {
  const visibilityClass =
    hoverGroup === "profile"
      ? "group-hover/profile:visible group-hover/profile:opacity-100"
      : "group-hover:visible group-hover:opacity-100";

  return (
    <span
      role="tooltip"
      className={[
        "pointer-events-none invisible absolute left-[58px] top-1/2 z-[100]",
        "-translate-y-1/2 whitespace-nowrap rounded-lg border px-3 py-2",
        "text-xs font-medium text-white opacity-0 shadow-lg",
        "transition duration-150",
        visibilityClass,
      ].join(" ")}
      style={{
        backgroundColor: "var(--color-sidebar)",
        borderColor: "rgba(255, 255, 255, 0.12)",
      }}
    >
      {label}

      <span
        aria-hidden="true"
        className={[
          "absolute right-full top-1/2 -translate-y-1/2",
          "border-y-[5px] border-r-[6px] border-y-transparent",
        ].join(" ")}
        style={{
          borderRightColor: "var(--color-sidebar)",
        }}
      />
    </span>
  );
}
