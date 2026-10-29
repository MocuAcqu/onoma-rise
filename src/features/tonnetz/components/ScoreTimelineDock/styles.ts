import type { CSSProperties } from "react";

import { BRAND, GRADIENTS } from "../../config/theme";

export const styles = {
  dock: {
    position: "absolute",
    left: 18,
    bottom: 18,
    zIndex: 4,
    width: "min(330px, calc(100% - 36px))",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
  },
  toggle: {
    minHeight: 38,
    padding: "0 15px",
    borderRadius: 999,
    border: `1px solid ${BRAND.cardBorder}`,
    background: "rgba(255,255,255,0.94)",
    color: BRAND.ink,
    boxShadow: "0 8px 20px rgba(124,58,237,0.12)",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },
  body: {
    width: "100%",
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    padding: 4,
    marginBottom: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.94)",
    border: `1px solid ${BRAND.cardBorder}`,
    boxShadow: "0 6px 16px rgba(124,58,237,0.1)",
  },
  tab: {
    minHeight: 34,
    padding: "0 10px",
    border: "none",
    borderRadius: 999,
    color: BRAND.inkSoft,
    background: "transparent",
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
  },
  activeTab: {
    color: "#ffffff",
    background: GRADIENTS.primary,
    boxShadow: "0 5px 12px rgba(124,58,237,0.18)",
  },
} satisfies Record<string, CSSProperties>;
