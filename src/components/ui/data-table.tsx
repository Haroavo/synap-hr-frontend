"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Printer,
  Trash2,
  X,
} from "lucide-react";

type ColumnAlignment = "left" | "center" | "right";

export type DataTableSortDirection = "asc" | "desc";

export type DataTableSort = {
  key: string;
  direction: DataTableSortDirection;
};

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  accessor?: keyof T;
  cell?: (row: T) => ReactNode;
  width?: string;
  align?: ColumnAlignment;
  headerClassName?: string;
  cellClassName?: string;

  /**
   * Active le tri sur cette colonne.
   */
  sortable?: boolean;

  /**
   * Nom réel du champ MongoDB utilisé pour le tri backend.
   */
  sortKey?: string;
};

export type DataTablePagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type DataTableProps<T> = {
  title?: ReactNode;

  showTitle?: boolean;

  compact?: boolean;

  data: T[];

  columns: DataTableColumn<T>[];

  getRowId: (row: T) => string;

  pagination: DataTablePagination;

  sort?: DataTableSort | null;

  loading?: boolean;

  tableHeight?: number;

  emptyMessage?: string;

  selectable?: boolean;

  selectedRowIds?: string[];

  pageSizeOptions?: number[];

  onSelectionChange?: (selectedIds: string[]) => void;

  onPageChange: (page: number) => void;

  onPageSizeChange: (pageSize: number) => void;

  onSortChange?: (sort: DataTableSort) => void;

  onRowClick?: (row: T) => void;

  showSelectionToolbar?: boolean;

  onDuplicateSelected?: (selectedIds: string[]) => void;

  onPrintSelected?: (selectedIds: string[]) => void;

  onDeleteSelected?: (selectedIds: string[]) => void;

  onClearSelection?: () => void;
};

function getAlignmentClass(align: ColumnAlignment = "left"): string {
  switch (align) {
    case "center":
      return "text-center";

    case "right":
      return "text-right";

    default:
      return "text-left";
  }
}

function getFlexAlignmentClass(align: ColumnAlignment = "left"): string {
  switch (align) {
    case "center":
      return "justify-center";

    case "right":
      return "justify-end";

    default:
      return "justify-start";
  }
}

function renderCellValue<T>(row: T, column: DataTableColumn<T>): ReactNode {
  if (column.cell) {
    return column.cell(row);
  }

  if (!column.accessor) {
    return "—";
  }

  const value = row[column.accessor];

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "Oui" : "Non";
  }

  return String(value);
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}

export function DataTable<T>({
  title = "Tous les éléments",

  showTitle = true,

  compact = false,

  data,

  columns,

  getRowId,

  pagination,

  sort = null,

  loading = false,

  tableHeight = 520,

  emptyMessage = "Aucune donnée disponible.",

  selectable = true,

  selectedRowIds = [],

  pageSizeOptions = [10, 15, 20, 50],

  onSelectionChange,

  onPageChange,

  onPageSizeChange,

  onSortChange,

  onRowClick,

  showSelectionToolbar = true,

  onDuplicateSelected,

  onPrintSelected,

  onDeleteSelected,

  onClearSelection,
}: DataTableProps<T>) {
  const { page, limit, totalItems, totalPages } = pagination;

  const safeTotalPages = Math.max(totalPages, 1);

  const visiblePages = useMemo(
    () => getVisiblePages(page, safeTotalPages),
    [page, safeTotalPages],
  );

  const currentPageRowIds = useMemo(
    () => data.map((row) => getRowId(row)),
    [data, getRowId],
  );

  const allCurrentRowsSelected =
    currentPageRowIds.length > 0 &&
    currentPageRowIds.every((id) => selectedRowIds.includes(id));

  const someCurrentRowsSelected =
    currentPageRowIds.some((id) => selectedRowIds.includes(id)) &&
    !allCurrentRowsSelected;

  const firstItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;

  const lastItem = Math.min(page * limit, totalItems);

  const hasSelection = selectedRowIds.length > 0;

  function handleToggleAllRows() {
    if (!onSelectionChange) {
      return;
    }

    if (allCurrentRowsSelected) {
      onSelectionChange(
        selectedRowIds.filter((id) => !currentPageRowIds.includes(id)),
      );

      return;
    }

    onSelectionChange(
      Array.from(new Set([...selectedRowIds, ...currentPageRowIds])),
    );
  }

  function handleToggleRow(rowId: string) {
    if (!onSelectionChange) {
      return;
    }

    if (selectedRowIds.includes(rowId)) {
      onSelectionChange(selectedRowIds.filter((id) => id !== rowId));

      return;
    }

    onSelectionChange([...selectedRowIds, rowId]);
  }

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || !column.sortKey || !onSortChange) {
      return;
    }

    const isCurrentSort = sort?.key === column.sortKey;

    const nextDirection: DataTableSortDirection =
      isCurrentSort && sort?.direction === "asc" ? "desc" : "asc";

    onSortChange({
      key: column.sortKey,
      direction: nextDirection,
    });
  }

  function getSortIcon(column: DataTableColumn<T>) {
    if (!column.sortable || !column.sortKey) {
      return null;
    }

    if (sort?.key !== column.sortKey) {
      return (
        <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" strokeWidth={1.7} />
      );
    }

    if (sort.direction === "asc") {
      return (
        <ArrowUp className="h-3.5 w-3.5 text-app-primary" strokeWidth={2} />
      );
    }

    return (
      <ArrowDown className="h-3.5 w-3.5 text-app-primary" strokeWidth={2} />
    );
  }

  return (
    <section
      className={[
        "relative flex h-full min-h-0 flex-col",
        compact ? "overflow-hidden rounded-xl" : "overflow-hidden rounded-[24px]",
        compact ? "border border-slate-100" : "border border-slate-200/80",
        "bg-white",
        compact ? "shadow-sm" : "shadow-[0_10px_30px_rgba(15,23,42,0.05)]",
      ].join(" ")}
    >
      {showTitle && <div className="flex min-h-[70px] shrink-0 items-center px-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>}

      {/* Tableau */}
      <div
        className="relative min-h-0 overflow-auto px-4"
        style={
          {
            height: tableHeight,
          } as CSSProperties
        }
      >
        <table className="w-full min-w-max border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-white">
            <tr className={compact ? "h-[42px] bg-slate-50" : "h-[52px] bg-slate-50/70"}>
              {selectable && (
                <th className="w-[56px] border-b border-slate-100 px-4">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allCurrentRowsSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = someCurrentRowsSelected;
                        }
                      }}
                      onChange={handleToggleAllRows}
                      className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                    />
                  </div>
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    width: column.width,
                  }}
                  className={[
                    "border-b border-slate-100",
                    compact ? "px-3 py-2" : "px-4 py-3",
                    compact ? "text-[10px] font-semibold uppercase tracking-wide" : "text-[12px] font-medium",
                    "text-slate-500",
                    getAlignmentClass(column.align),
                    column.headerClassName ?? "",
                  ].join(" ")}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className={[
                        "flex w-full items-center gap-1.5",
                        "transition",
                        "hover:text-slate-900",
                        getFlexAlignmentClass(column.align),
                      ].join(" ")}
                    >
                      <span>{column.header}</span>

                      {getSortIcon(column)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!loading &&
              data.map((row) => {
                const rowId = getRowId(row);

                const isSelected = selectedRowIds.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={[
                      compact ? "group h-[52px]" : "group h-[62px]",
                      "transition-colors",
                      "border-b border-slate-100",
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--color-primary)_5%,white)]"
                        : "bg-white hover:bg-slate-50/70",
                      onRowClick ? "cursor-pointer" : "",
                    ].join(" ")}
                  >
                    {selectable && (
                      <td
                        className="border-b border-slate-100 px-4"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(rowId)}
                            className="h-4 w-4 cursor-pointer accent-[var(--color-primary)]"
                          />
                        </div>
                      </td>
                    )}

                    {columns.map((column) => (
                      <td
                        key={`${rowId}-${column.id}`}
                        className={[
                          "border-b border-slate-100",
                          compact ? "px-3 py-2" : "px-4 py-3",
                          compact ? "text-xs" : "text-[13px]",
                          "text-slate-800",
                          getAlignmentClass(column.align),
                          column.cellClassName ?? "",
                        ].join(" ")}
                      >
                        {renderCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && data.length === 0 && (
          <div className="absolute inset-x-0 top-[80px] flex items-center justify-center py-20">
            <p className="text-sm text-slate-500">{emptyMessage}</p>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-primary)]" />
              Chargement...
            </div>
          </div>
        )}
      </div>

      {/* PAGINATION REDESIGNÉE */}
      <footer
        className={[
          "flex min-h-[86px]",
          "shrink-0 flex-wrap",
          "items-center justify-between",
          "gap-5",
          "border-t border-slate-100",
          "bg-white",
          "px-6 py-4",
        ].join(" ")}
      >
        {/* Informations */}
        <div className="flex flex-wrap items-center gap-5">
          <p className="text-sm text-slate-500">
            Affichage de{" "}
            <span className="font-semibold text-slate-900">{firstItem}</span> à{" "}
            <span className="font-semibold text-slate-900">{lastItem}</span> sur{" "}
            <span className="font-semibold text-slate-900">{totalItems}</span>{" "}
            résultats
          </p>

          <label className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Afficher</span>

            <select
              value={limit}
              disabled={Boolean(loading)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className={[
                "h-10 min-w-[72px]",
                "rounded-xl",
                "border border-slate-200",
                "bg-slate-50",
                "px-3",
                "text-sm font-semibold",
                "text-slate-700",
                "outline-none",
                "transition",
                "hover:border-slate-300",
                "focus:border-app-primary",
                "focus:bg-white",
                "focus:ring-4",
                "focus:ring-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]",
              ].join(" ")}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <span className="text-sm text-slate-500">par page</span>
          </label>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Pagination"
          className={[
            "flex items-center gap-1.5",
            "rounded-2xl",
            "bg-slate-50",
            "p-1.5",
          ].join(" ")}
        >
          <button
            type="button"
            disabled={Boolean(page <= 1 || loading)}
            onClick={() => onPageChange(page - 1)}
            className={[
              "flex h-10 items-center gap-1",
              "rounded-xl px-3",
              "text-sm font-medium",
              "text-slate-600",
              "transition",
              "hover:bg-white",
              "hover:text-slate-900",
              "hover:shadow-sm",
              "disabled:cursor-not-allowed",
              "disabled:opacity-30",
            ].join(" ")}
          >
            <ChevronLeft className="h-4 w-4" />

            <span className="hidden lg:inline">Précédent</span>
          </button>

          {visiblePages.map((visiblePage, index) => {
            if (visiblePage === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-10 min-w-8 items-center justify-center text-sm text-slate-400"
                >
                  ...
                </span>
              );
            }

            const active = visiblePage === page;

            return (
              <button
                key={visiblePage}
                type="button"
                disabled={Boolean(loading)}
                onClick={() => onPageChange(visiblePage)}
                className={[
                  "flex h-10 min-w-10",
                  "items-center justify-center",
                  "rounded-xl px-3",
                  "text-sm font-semibold",
                  "transition-all",
                  active
                    ? [
                        "bg-app-primary",
                        "text-white",
                        "shadow-md",
                        "shadow-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]",
                      ].join(" ")
                    : [
                        "text-slate-600",
                        "hover:bg-white",
                        "hover:text-slate-900",
                        "hover:shadow-sm",
                      ].join(" "),
                ].join(" ")}
              >
                {visiblePage}
              </button>
            );
          })}

          <button
            type="button"
            disabled={Boolean(page >= safeTotalPages || loading)}
            onClick={() => onPageChange(page + 1)}
            className={[
              "flex h-10 items-center gap-1",
              "rounded-xl px-3",
              "text-sm font-medium",
              "text-slate-600",
              "transition",
              "hover:bg-white",
              "hover:text-slate-900",
              "hover:shadow-sm",
              "disabled:cursor-not-allowed",
              "disabled:opacity-30",
            ].join(" ")}
          >
            <span className="hidden lg:inline">Suivant</span>

            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </footer>

      {/* Barre d'actions */}
      {showSelectionToolbar && hasSelection && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
            <span className="mr-1 text-sm font-medium text-slate-800">
              {selectedRowIds.length} sélectionné
              {selectedRowIds.length > 1 ? "s" : ""}
            </span>

            <ToolbarActionButton
              label="Dupliquer"
              icon={<Copy className="h-4 w-4" />}
              onClick={() => onDuplicateSelected?.(selectedRowIds)}
            />

            <ToolbarActionButton
              label="Imprimer"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => onPrintSelected?.(selectedRowIds)}
            />

            <ToolbarActionButton
              label="Supprimer"
              icon={<Trash2 className="h-4 w-4" />}
              destructive
              onClick={() => onDeleteSelected?.(selectedRowIds)}
            />

            <button
              type="button"
              onClick={() => {
                if (onClearSelection) {
                  onClearSelection();
                } else {
                  onSelectionChange?.([]);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

type ToolbarActionButtonProps = {
  label: string;
  icon: ReactNode;
  destructive?: boolean;
  onClick?: () => void;
};

function ToolbarActionButton({
  label,
  icon,
  destructive = false,
  onClick,
}: ToolbarActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-9 items-center gap-2",
        "rounded-xl border px-3",
        "text-sm font-medium",
        destructive
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-slate-200 bg-white text-slate-700",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}
