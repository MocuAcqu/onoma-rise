import type { CSSProperties } from "react";
import { GRADIENTS } from "../../config/theme";

export const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", alignItems: "center", gap: 12 },
  time: { fontSize: 12, color: "#6b7280", fontWeight: 700, minWidth: 40 },
  track: {
    position: "relative",
    flex: 1,
    height: 6,
    borderRadius: 999,
    background: "rgba(124,58,237,0.14)",
    cursor: "pointer",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    borderRadius: 999,
    background: GRADIENTS.primary,
    pointerEvents: "none",
  },
  empty: {
    fontSize: 12,
    color: "#6b7280",
    padding: "10px 0",
    textAlign: "center",
    border: "1px dashed rgba(124,58,237,0.28)",
    borderRadius: 12,
  },
} satisfies Record<string, CSSProperties>;
