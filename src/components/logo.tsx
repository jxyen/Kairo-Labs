import Link from "next/link";

export function Logo({ size = 17 }: { size?: number }) {
  return (
    <Link
      href="/"
      style={{ display: "flex", alignItems: "center", gap: 10 }}
      aria-label="Covalent Labs home"
    >
      <span
        className="font-mono"
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: "var(--grad-logo)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: 14,
          color: "#06181b",
          flex: "none",
        }}
      >
        C
      </span>
      <span style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.01em" }}>
        Covalent
        <span style={{ color: "var(--text-faint)", fontWeight: 400 }}> Labs</span>
      </span>
    </Link>
  );
}
