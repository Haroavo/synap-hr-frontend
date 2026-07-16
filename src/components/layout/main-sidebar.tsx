"use client";

import type { SidebarMenu } from "@/config/sidebar-navigation";
import { synapTheme } from "@/config/theme";
import { LogoutButton } from "../auth/logout-button";

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
      className="relative z-40 flex h-dvh w-[72px] shrink-0 flex-col items-center border-r py-3"
      style={{
        background: `linear-gradient(180deg, ${synapTheme.navy} 0%, ${synapTheme.darkBlue} 100%)`,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo compact SynapRH */}
      <div
        className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${synapTheme.cyan}, ${synapTheme.blue})`,
        }}
      >
        SR
      </div>

      {/* Menu principal */}
      <nav
        aria-label="Menu principal"
        className="flex w-full flex-1 flex-col items-center gap-2"
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
                  "relative flex h-11 w-11 items-center justify-center rounded-xl transition duration-200",
                  active
                    ? "text-white"
                    : "text-blue-100/60 hover:bg-white/10 hover:text-white",
                ].join(" ")}
                style={
                  active
                    ? {
                        background: `linear-gradient(135deg, ${synapTheme.cyan}, ${synapTheme.blue})`,
                      }
                    : undefined
                }
              >
                {active && (
                  <span
                    className="absolute -left-[14px] h-7 w-1 rounded-r-full"
                    style={{
                      backgroundColor: synapTheme.cyan,
                    }}
                  />
                )}

                <Icon className="h-[21px] w-[21px]" strokeWidth={1.8} />
              </button>

              {/* Infobulle */}
              <span
                className="pointer-events-none absolute left-[58px] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100"
                style={{
                  backgroundColor: synapTheme.navy,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                {menu.label}

                <span
                  className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent"
                  style={{
                    borderRightColor: synapTheme.navy,
                  }}
                />
              </span>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 flex flex-col items-center gap-2">
        {/* Profil utilisateur */}
        <div className="group/profile relative">
          <button
            type="button"
            aria-label="Mon profil"
            className="flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold text-white transition hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #4CB8E9, #218BE4)",
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            {userInitials}
          </button>

          <span className="pointer-events-none absolute bottom-1/2 left-[58px] z-50 translate-y-1/2 whitespace-nowrap rounded-lg bg-[#071B3D] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover/profile:opacity-100">
            Mon profil
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent border-r-[#071B3D]" />
          </span>
        </div>

        <LogoutButton />
      </div>
    </aside>
  );
}
