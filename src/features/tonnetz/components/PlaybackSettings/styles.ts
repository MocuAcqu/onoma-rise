import type { CSSProperties } from "react";

export const styles = {
  controls: {
    display: "flex",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    background: "rgba(255,255,255,0.86)",
    borderRadius: 999,
    padding: "10px 20px",
    flexWrap: "wrap",
    boxShadow: "0 8px 20px rgba(124,58,237,0.08)",
  },
  label: { fontSize: 12, color: "#4b3f66", letterSpacing: 0.4, fontWeight: 700 },
  value: { fontSize: 14, fontWeight: 900, color: "#7c3aed", minWidth: 22, textAlign: "center" },
  octaveButton: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: "none",
    background: "rgba(124,58,237,0.10)",
    color: "#7c3aed",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
} satisfies Record<string, CSSProperties>;
