import Link from "next/link";
import { KairoMark } from "@/components/kairo-mark";

/** Kairo Labs lockup — the K mark + wordmark. */
export function Logo({ size = 18 }: { size?: number }) {
  return (
    <Link
      href="/"
      style={{ display: "flex", alignItems: "center", gap: 11 }}
      aria-label="Kairo Labs home"
    >
      <KairoMark size={26} style={{ color: "var(--accent)", flex: "none" }} />
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        Kairo
        <span style={{ color: "var(--text-faint)", fontWeight: 500 }}> Labs</span>
      </span>
    </Link>
  );
}
