/**
 * Clean light "studio" placeholder shown until real vial photography is wired in.
 * (The handoff ships product photos as user-supplied drop-ins; we render a calm
 * silhouette on the light tile rather than the prototype's drop-zone component.)
 */
export function VialPlaceholder({ height }: { height: number }) {
  return (
    <div
      aria-hidden
      style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 48 48"
        fill="none"
        stroke="#c9c2ba"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6h12" />
        <path d="M20 6v9.5a8 8 0 0 1-1.2 4.2L15 26.5A9 9 0 0 0 13.6 31v7a4 4 0 0 0 4 4h12.8a4 4 0 0 0 4-4v-7a9 9 0 0 0-1.4-4.5l-3.8-6.8a8 8 0 0 1-1.2-4.2V6" />
        <path d="M14 30c4-2 8 2 12 0s8-2 8-2" stroke="#dcd6cf" />
      </svg>
    </div>
  );
}
