"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import dagre from "@dagrejs/dagre";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";

import {
  Columns3,
  LocateFixed,
  Maximize2,
  Minimize2,
  Rows3,
  Search,
  X,
} from "lucide-react";

import {
  EMPLOYEE_NODE_HEIGHT,
  EMPLOYEE_NODE_WIDTH,
  EmployeeOrganizationNode,
  type EmployeeOrganizationNode as EmployeeNode,
  type OrganizationDirection,
} from "./employee-organization-node";

import { type OrganizationEmployee } from "@/types/organization-chart";

type OrganizationChartProps = {
  employees: OrganizationEmployee[];
};

const nodeTypes = {
  employee: EmployeeOrganizationNode,
} satisfies NodeTypes;

const defaultEdgeOptions = {
  type: "smoothstep",

  style: {
    stroke: "#94A3B8",
    strokeWidth: 1.5,
  },
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function employeeMatchesSearch(
  employee: OrganizationEmployee,
  query: string,
): boolean {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return false;
  }

  const content = normalizeText(
    [
      employee.fullName,
      employee.badgeNumber,
      employee.email ?? "",
      employee.phone ?? "",
      employee.department?.name ?? "",
      employee.department?.code ?? "",
      employee.position?.title ?? "",
      employee.position?.code ?? "",
    ].join(" "),
  );

  return content.includes(normalizedQuery);
}

function createLayout(
  employees: OrganizationEmployee[],
  direction: OrganizationDirection,
): {
  nodes: EmployeeNode[];
  edges: Edge[];
} {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: direction,

    /*
     * Espacement horizontal entre les collègues.
     */
    nodesep: direction === "TB" ? 34 : 52,

    /*
     * Espacement entre deux niveaux hiérarchiques.
     */
    ranksep: direction === "TB" ? 72 : 95,

    marginx: 40,
    marginy: 40,
  });

  const directReportCounts = new Map<string, number>();

  employees.forEach((employee) => {
    if (!employee.managerId) {
      return;
    }

    directReportCounts.set(
      employee.managerId,
      (directReportCounts.get(employee.managerId) ?? 0) + 1,
    );
  });

  const nodes: EmployeeNode[] = employees.map((employee) => {
    graph.setNode(employee.id, {
      width: EMPLOYEE_NODE_WIDTH,

      height: EMPLOYEE_NODE_HEIGHT,
    });

    return {
      id: employee.id,

      type: "employee",

      position: {
        x: 0,
        y: 0,
      },

      data: {
        ...employee,

        direction,

        highlighted: false,

        directReports: directReportCounts.get(employee.id) ?? 0,

        isRoot: employee.managerId === null,
      },
    };
  });

  const employeeIds = new Set(employees.map((employee) => employee.id));

  const edges: Edge[] = employees
    .filter(
      (employee) =>
        Boolean(employee.managerId) &&
        employeeIds.has(employee.managerId as string),
    )
    .map((employee) => {
      const managerId = employee.managerId as string;

      graph.setEdge(managerId, employee.id);

      return {
        id: `${managerId}-${employee.id}`,

        source: managerId,

        target: employee.id,

        type: "smoothstep",

        style: {
          stroke: "#94A3B8",

          strokeWidth: 1.5,
        },
      };
    });

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,

      position: {
        x: position.x - EMPLOYEE_NODE_WIDTH / 2,

        y: position.y - EMPLOYEE_NODE_HEIGHT / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,

    edges,
  };
}

export function OrganizationChart({ employees }: OrganizationChartProps) {
  const containerRef = useRef<HTMLElement | null>(null);

  const [direction, setDirection] = useState<OrganizationDirection>("TB");

  const [search, setSearch] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    EmployeeNode,
    Edge
  > | null>(null);

  /*
   * La disposition dépend uniquement des employés
   * et de l'orientation.
   *
   * Une saisie dans la recherche ne recalcule donc
   * pas entièrement la position des cartes.
   */

  const layout = useMemo(
    () => createLayout(employees, direction),
    [employees, direction],
  );

  const nodes = useMemo(
    () =>
      layout.nodes.map((node) => ({
        ...node,

        data: {
          ...node.data,

          highlighted: employeeMatchesSearch(node.data, search),
        },
      })),
    [layout.nodes, search],
  );

  const edges = layout.edges;

  const matchingNodes = useMemo(
    () => (search.trim() ? nodes.filter((node) => node.data.highlighted) : []),
    [nodes, search],
  );

  const fitAll = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    reactFlowInstance.fitView({
      nodes: layout.nodes,

      padding: 0.12,

      duration: 450,

      minZoom: 0.12,

      maxZoom: 0.9,
    });
  }, [layout.nodes, reactFlowInstance]);

  const focusSearch = useCallback(() => {
    if (!reactFlowInstance) {
      return;
    }

    if (matchingNodes.length === 0) {
      fitAll();

      return;
    }

    reactFlowInstance.fitView({
      nodes: matchingNodes,

      padding: 0.7,

      duration: 450,

      minZoom: 0.35,

      maxZoom: 1.15,
    });
  }, [fitAll, matchingNodes, reactFlowInstance]);

  const clearSearch = useCallback(() => {
    setSearch("");

    window.setTimeout(() => {
      fitAll();
    }, 30);
  }, [fitAll]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();

        return;
      }

      await containerRef.current?.requestFullscreen();
    } catch {
      /*
       * Certains navigateurs ou contextes intégrés
       * peuvent bloquer le plein écran.
       */
    }
  }, []);

  /*
   * Mise à jour de l'état du plein écran.
   */

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  /*
   * Recentrage après :
   *
   * - changement d'orientation ;
   * - changement des employés ;
   * - passage en plein écran.
   */

  useEffect(() => {
    if (!reactFlowInstance) {
      return;
    }

    const timeout = window.setTimeout(() => {
      reactFlowInstance.fitView({
        nodes: layout.nodes,

        padding: 0.12,

        duration: 450,

        minZoom: 0.12,

        maxZoom: 0.9,
      });
    }, 100);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [direction, isFullscreen, layout.nodes, reactFlowInstance]);

  return (
    <section
      ref={containerRef}
      className={[
        "flex h-full min-h-0",
        "flex-col",
        "overflow-hidden",
        "bg-white",
        "shadow-[0_8px_30px_rgba(15,23,42,0.05)]",

        isFullscreen
          ? "rounded-none border-0"
          : "rounded-[24px] border border-slate-200",
      ].join(" ")}
    >
      {/* Barre supérieure */}

      <div
        className={[
          "flex shrink-0",
          "flex-col",
          "gap-3",
          "border-b",
          "border-slate-100",
          "px-4 py-3",
          "sm:px-5 sm:py-4",
          "xl:flex-row",
          "xl:items-center",
          "xl:justify-between",
        ].join(" ")}
      >
        <div className="shrink-0">
          <h2 className="text-base font-semibold text-slate-900">
            Structure hiérarchique
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Déplacez le diagramme ou cliquez sur une personne.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* Recherche */}

          <div
            className={[
              "flex h-10",
              "min-w-0",
              "flex-1",
              "items-center gap-2",
              "rounded-xl",
              "bg-slate-50",
              "px-3",
              "sm:min-w-[260px]",
              "xl:flex-none",
              "xl:w-[280px]",
            ].join(" ")}
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  focusSearch();
                }

                if (event.key === "Escape") {
                  clearSearch();
                }
              }}
              placeholder="Nom, matricule, poste..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {search && (
              <>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
                  {matchingNodes.length}
                </span>

                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  title="Effacer la recherche"
                  onClick={clearSearch}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={focusSearch}
            className={[
              "flex h-10",
              "items-center gap-2",
              "rounded-xl",
              "bg-blue-50",
              "px-3",
              "text-sm font-medium",
              "text-app-primary",
              "transition",
              "hover:bg-blue-100",
            ].join(" ")}
          >
            <Search className="h-4 w-4" />

            <span className="hidden sm:inline">Rechercher</span>
          </button>

          {/* Orientation */}

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              title="Affichage vertical"
              aria-label="Affichage vertical"
              onClick={() => setDirection("TB")}
              className={[
                "flex h-8 w-9",
                "items-center",
                "justify-center",
                "rounded-lg",
                "transition",

                direction === "TB"
                  ? "bg-white text-app-primary shadow-sm"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              <Rows3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Affichage horizontal"
              aria-label="Affichage horizontal"
              onClick={() => setDirection("LR")}
              className={[
                "flex h-8 w-9",
                "items-center",
                "justify-center",
                "rounded-lg",
                "transition",

                direction === "LR"
                  ? "bg-white text-app-primary shadow-sm"
                  : "text-slate-400 hover:text-slate-700",
              ].join(" ")}
            >
              <Columns3 className="h-4 w-4" />
            </button>
          </div>

          {/* Recentrer */}

          <button
            type="button"
            title="Afficher tout l'organigramme"
            aria-label="Afficher tout l'organigramme"
            onClick={fitAll}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            <LocateFixed className="h-4 w-4" />
          </button>

          {/* Plein écran */}

          <button
            type="button"
            title={
              isFullscreen
                ? "Quitter le plein écran"
                : "Afficher en plein écran"
            }
            aria-label={
              isFullscreen
                ? "Quitter le plein écran"
                : "Afficher en plein écran"
            }
            onClick={() => void toggleFullscreen()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Zone interactive */}

      <div
        className={["relative", "min-h-[390px]", "flex-1", "bg-[#F8FAFC]"].join(
          " ",
        )}
      >
        <ReactFlow<EmployeeNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            setReactFlowInstance(instance);

            window.setTimeout(() => {
              instance.fitView({
                nodes: layout.nodes,

                padding: 0.12,

                minZoom: 0.12,

                maxZoom: 0.9,
              });
            }, 50);
          }}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{
            padding: 0.12,
            minZoom: 0.12,
            maxZoom: 0.9,
          }}
          minZoom={0.1}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          zoomOnDoubleClick={false}
          zoomOnScroll={true}
          preventScrolling={true}
          panOnDrag
          zoomOnPinch
          onlyRenderVisibleElements
          colorMode="light"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#CBD5E1"
          />

          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            className="hidden sm:block"
            maskColor="rgba(241,245,249,0.72)"
            nodeColor={(node) => {
              switch (node.data.status) {
                case "ACTIVE":
                  return "#10B981";

                case "SUSPENDED":
                  return "#F59E0B";

                case "DEPARTED":
                  return "#EF4444";

                default:
                  return "#94A3B8";
              }
            }}
          />

          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}
