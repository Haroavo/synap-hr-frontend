"use client";

import type { CompanyBrand, SidebarMenu } from "@/config/sidebar-navigation";

import { synapTheme } from "@/config/theme";

import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type SubSidebarProps = {
  menu: SidebarMenu;
  company: CompanyBrand;
  collapsed: boolean;

  onToggle: () => void;
};

function pathIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function SubSidebar({
  menu,
  company,
  collapsed,
  onToggle,
}: SubSidebarProps) {
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [company.logoUrl]);

  return (
    <aside
      className={[
        "relative z-30 flex h-dvh shrink-0 flex-col border-r bg-white",
        "transition-[width] duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[280px]",
      ].join(" ")}
      style={{
        borderColor: synapTheme.border,
      }}
    >
      {/* Logo de l’entreprise */}
      <div
        className={[
          "flex h-[88px] shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "px-4",
        ].join(" ")}
        style={{
          borderColor: synapTheme.border,
        }}
      >
        <div className="group/company relative">
          <div
            className={[
              "flex items-center rounded-2xl border",
              collapsed
                ? "h-11 w-11 justify-center"
                : "min-h-16 w-[246px] gap-3 px-3 py-2",
            ].join(" ")}
            style={{
              backgroundColor: synapTheme.background,
              borderColor: synapTheme.border,
            }}
          >
            {company.logoUrl && !logoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logoUrl}
                alt={`Logo ${company.name}`}
                onError={() => setLogoError(true)}
                className={[
                  "shrink-0 rounded-xl bg-white object-contain",
                  collapsed ? "h-9 w-9 p-1" : "h-11 w-11 p-1.5",
                ].join(" ")}
              />
            ) : (
              <div
                className={[
                  "flex shrink-0 items-center justify-center rounded-xl font-bold text-white",
                  collapsed ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-xs",
                ].join(" ")}
                style={{
                  background: `linear-gradient(
                    135deg,
                    ${synapTheme.cyan},
                    ${synapTheme.blue}
                  )`,
                }}
              >
                {getCompanyInitials(company.name)}
              </div>
            )}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-bold"
                  style={{
                    color: synapTheme.text,
                  }}
                >
                  {company.name}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  Administration du personnel
                </p>
              </div>
            )}
          </div>

          {/* Infobulle du logo lorsque le sous-menu est replié */}
          {collapsed && <Tooltip label={company.name} />}
        </div>
      </div>

      {/* En-tête du sous-menu */}
      <div
        className={[
          "flex h-14 shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "justify-between px-5",
        ].join(" ")}
        style={{
          borderColor: synapTheme.border,
        }}
      >
        {!collapsed && (
          <h2
            className="truncate text-sm font-bold"
            style={{
              color: synapTheme.text,
            }}
          >
            {menu.label}
          </h2>
        )}

        <div className="group/toggle relative">
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed ? "Déplier le sous-menu" : "Replier le sous-menu"
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#EAF6FF] hover:text-[#218BE4]"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[19px] w-[19px]" strokeWidth={1.8} />
            ) : (
              <PanelLeftClose className="h-[19px] w-[19px]" strokeWidth={1.8} />
            )}
          </button>

          {collapsed && <Tooltip label="Déplier le sous-menu" />}
        </div>
      </div>

      {/* Liens du sous-menu */}
      <nav
        aria-label={`Sous-menu ${menu.label}`}
        className={[
          "min-h-0 flex-1 py-4",
          collapsed ? "px-2" : "overflow-y-auto px-3",
        ].join(" ")}
      >
        {menu.sections.map((section) => (
          <div
            key={section.title}
            className={["last:mb-0", collapsed ? "mb-3" : "mb-6"].join(" ")}
          >
            {!collapsed && (
              <p
                className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: synapTheme.blue,
                }}
              >
                {section.title}
              </p>
            )}

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const ItemIcon = item.icon;

                const active = pathIsActive(pathname, item.href);

                return (
                  <div key={item.href} className="group/item relative">
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      className={[
                        "relative flex min-h-11 items-center rounded-xl transition duration-200",
                        collapsed ? "justify-center px-0" : "gap-3 px-3 py-2",
                        active
                          ? "font-semibold"
                          : "font-medium text-slate-500 hover:bg-[#F0F8FF] hover:text-[#071B3D]",
                      ].join(" ")}
                      style={{
                        color: active ? synapTheme.blue : undefined,

                        backgroundColor: active
                          ? synapTheme.activeBackground
                          : undefined,
                      }}
                    >
                      {/* Indicateur actif */}
                      {active && (
                        <span
                          className={[
                            "absolute rounded-r-full",
                            collapsed
                              ? "-left-2 h-6 w-1"
                              : "bottom-2 left-0 top-2 w-1",
                          ].join(" ")}
                          style={{
                            background: `linear-gradient(
                              ${synapTheme.cyan},
                              ${synapTheme.blue}
                            )`,
                          }}
                        />
                      )}

                      <ItemIcon
                        className={[
                          "shrink-0",
                          collapsed ? "h-5 w-5" : "h-[17px] w-[17px]",
                        ].join(" ")}
                        strokeWidth={1.8}
                      />

                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>

                          {active && (
                            <ChevronRight
                              className="h-4 w-4 shrink-0"
                              strokeWidth={1.8}
                            />
                          )}
                        </>
                      )}
                    </Link>

                    {/* Nom au survol */}
                    {collapsed && <Tooltip label={item.label} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pied du sous-menu */}
      <div
        className={[
          "flex h-14 shrink-0 items-center border-t",
          collapsed ? "justify-center px-2" : "px-5",
        ].join(" ")}
        style={{
          borderColor: synapTheme.border,
          backgroundColor: synapTheme.background,
        }}
      >
        {collapsed ? (
          <div className=""></div>
        ) : (
          <p className="text-[11px] text-slate-400">
            Propulsé par{" "}
            <span
              className="font-bold"
              style={{
                color: synapTheme.text,
              }}
            >
              Synap
            </span>
            <span
              className="font-bold"
              style={{
                color: synapTheme.cyan,
              }}
            >
              RH
            </span>
          </p>
        )}
      </div>
    </aside>
  );
}

type TooltipProps = {
  label: string;
};

function Tooltip({ label }: TooltipProps) {
  return (
    <span
      className={[
        "pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[100]",
        "-translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-2",
        "text-xs font-medium text-white opacity-0",
        "shadow-lg transition duration-150",
        "group-hover/item:opacity-100",
        "group-hover/company:opacity-100",
        "group-hover/toggle:opacity-100",
        "group-hover/product:opacity-100",
      ].join(" ")}
      style={{
        backgroundColor: synapTheme.navy,
      }}
    >
      {label}

      <span
        className="absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-r-[6px] border-y-transparent"
        style={{
          borderRightColor: synapTheme.navy,
        }}
      />
    </span>
  );
}
