export type ContractType = "CDI" | "CDD" | "STAGE" | "ALTERNANCE";

type ContractTypeBadgeProps = {
  type: ContractType;
};

const contractStyles: Record<ContractType, string> = {
  CDI: ["bg-green-100", "text-green-700"].join(" "),

  CDD: ["bg-amber-100", "text-amber-700"].join(" "),

  STAGE: ["bg-blue-100", "text-blue-700"].join(" "),

  ALTERNANCE: ["bg-purple-100", "text-purple-700"].join(" "),
};

export function ContractTypeBadge({ type }: ContractTypeBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center",
        "rounded-full px-3 py-1",
        "text-xs font-semibold",
        contractStyles[type],
      ].join(" ")}
    >
      {type}
    </span>
  );
}
