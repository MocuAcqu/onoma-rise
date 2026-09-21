import type { CSSProperties } from "react";
import { BRAND } from "../../config/theme";

export const styles = {
  panel: {
    background: "rgba(255,255,255,0.86)",
    border: `1px solid ${BRAND.cardBorder}`,
    borderRadius: 20,
    padding: "22px 24px",
    boxShadow: BRAND.cardShadow,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: BRAND.ink,
  },
  audioSection: { marginBottom: 12 },
  modeDescription: { marginTop: 12, display: "flex", gap: 8, alignItems: "center" },
  modeLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    background: "rgba(124,58,237,0.10)",
    color: "#7c3aed",
    borderRadius: 999,
    padding: "3px 10px",
    fontWeight: 800,
  },
  modeText: { fontSize: 12, color: BRAND.inkSoft },
  pausedMessage: {
    marginTop: 10,
    fontSize: 12,
    color: "#7c3aed",
    textAlign: "center",
    letterSpacing: "0.04em",
  },
} satisfies Record<string, CSSProperties>;
