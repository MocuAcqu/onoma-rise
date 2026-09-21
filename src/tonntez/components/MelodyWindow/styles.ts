import type { CSSProperties } from "react";
import { BRAND } from "../../config/theme";

export const styles = {
  melodyWindow: {
    background: "rgba(255,255,255,0.86)",
    border: `1px solid ${BRAND.cardBorder}`,
    borderRadius: 20,
    padding: "18px 20px",
    boxShadow: BRAND.cardShadow,
    boxSizing: "border-box",
    width: "100%",
  },
  melodyWindowLabel: { fontSize: 15, fontWeight: 800, color: BRAND.ink, marginBottom: 4 },
  melodyWindowStep: { fontSize: 12, color: BRAND.inkSoft, marginBottom: 14 },
  melodyCard: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14 },
  melodyNeighbor: { fontSize: 18, color: "#9ca3af", fontWeight: 700, minWidth: 30, textAlign: "center" },
  melodyCurrent: { fontSize: 34, fontWeight: 900, color: "#db2777", minWidth: 60, textAlign: "center" },
  divider: { width: 1, height: 28, background: "rgba(124,58,237,0.16)" },
  melodyInfoBox: { display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", marginTop: 18 },
  metaLabel: { fontSize: 11, color: BRAND.inkSoft, textTransform: "uppercase", letterSpacing: 1, alignSelf: "center", fontWeight: 800 },
  metaValue: { fontSize: 13, color: BRAND.ink, fontWeight: 700, textAlign: "right" },
  chordCard: { border: "1px solid", borderRadius: 14, padding: "14px 18px" },
  chordLabel: { fontSize: 10, letterSpacing: 2, color: BRAND.inkSoft, marginBottom: 4, fontWeight: 800 },
  chordName: { fontSize: 24, fontWeight: 900, color: "#db2777", marginBottom: 4 },
  chordNotes: { fontSize: 13, color: "#4b3f66" },
  emptyText: { fontSize: 13, color: BRAND.inkSoft, lineHeight: 1.7 },
} satisfies Record<string, CSSProperties>;
