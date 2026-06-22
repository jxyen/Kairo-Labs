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
          background: "var(--coral)",
          boxShadow: "0 0 8px var(--coral)",
          flex: "none",
        }}
      />
      <span style={{ fontSize: 12.5, color: "#b9c0c6", letterSpacing: "0.01em" }}>
        Free same-day US shipping on orders over $150 — tracked &amp; discreet
      </span>
    </div>
  );
}
