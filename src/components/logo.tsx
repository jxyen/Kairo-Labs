import Link from "next/link";

/** Kairo Labs lockup — the new molecule + K mark alongside the wordmark. */
export function Logo({ size = 18 }: { size?: number }) {
  return (
    <Link
      href="/"
      style={{ display: "flex", alignItems: "center", gap: 11 }}
      aria-label="Kairo Labs home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/kairo-mark-new.png"
        alt=""
        aria-hidden="true"
        style={{ height: 30, width: "auto", flex: "none", display: "block" }}
      />
      <span
        style={{
          fontSize: size,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
        }}
      >
        Kairo
        <span style={{ color: "var(--ink-faint)", fontWeight: 500 }}> Labs</span>
      </span>
    </Link>
  );
}
