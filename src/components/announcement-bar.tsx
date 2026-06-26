export function AnnouncementBar() {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 5,
        background: "var(--bg-band)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        padding: "9px 16px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 8px var(--accent)",
          flex: "none",
        }}
      />
      <span style={{ fontSize: 12.5, color: "#b9c0c6", letterSpacing: "0.01em" }}>
        Save 10% on your first order with code{" "}
        <span className="font-mono" style={{ color: "var(--accent-light)", fontWeight: 600 }}>
          RESEARCH10
        </span>{" "}
        — free same-day US shipping over $150
      </span>
    </div>
  );
}
