import type { AccessoryIcon } from "@/lib/products";

/** Line-art icon for an accessory/consumable, shared by the PDP and cart drawer. */
export function AccIcon({ kind, size = 20 }: { kind: AccessoryIcon; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "water") return <svg {...common}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></svg>;
  if (kind === "syringe") return <svg {...common}><path d="M4 20l3-3" /><path d="M14 4l6 6" /><path d="M17 7l-9 9-3 .5.5-3 9-9 2.5 2.5z" /></svg>;
  if (kind === "swab") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 12h6" /></svg>;
  return <svg {...common}><path d="M9 3h6" /><path d="M10 3v5l-2.2 8.5A2 2 0 0 0 9.7 19h4.6a2 2 0 0 0 1.9-2.5L14 8V3" /><path d="M8.3 12h7.4" /></svg>;
}
