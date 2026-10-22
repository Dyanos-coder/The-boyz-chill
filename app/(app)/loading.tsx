export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Chargement" style={{ display: "grid", gap: 16 }}>
      <div style={{ height: 34, width: "55%", borderRadius: 10, background: "var(--bz-surface-2)" }} />
      <div style={{ height: 210, borderRadius: 22, background: "var(--bz-surface-2)" }} />
      <div style={{ height: 150, borderRadius: 22, background: "var(--bz-surface-2)" }} />
    </div>
  );
}
