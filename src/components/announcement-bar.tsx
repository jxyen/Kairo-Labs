export function AnnouncementBar() {
  return (
    <div
      style={{
        position: "relative", zIndex: 5,
        background: "var(--ink)", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
        padding: "9px 16px", textAlign: "center",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald-bright)", boxShadow: "0 0 8px var(--emerald-bright)", flex: "none" }} />
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.86)", letterSpacing: "0.01em" }}>
        Save 10% on your first order with code{" "}
        <span className="font-mono" style={{ color: "var(--emerald-bright)", fontWeight: 600 }}>RESEARCH10</span>{" "}
        — free same-day US shipping over $150
      </span>
    </div>
  );
}
