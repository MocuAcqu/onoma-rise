import type { CSSProperties } from "react";
import { GRADIENTS } from "../../config/theme";

const button: CSSProperties = {
  flex: 1,
  padding: "14px 18px",
  borderRadius: 999,
  border: "none",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  textAlign: "center",
};

export const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", alignItems: "center", gap: 12 },
  primaryButton: {
    ...button,
    background: GRADIENTS.primary,
    color: "#ffffff",
    boxShadow: "0 10px 24px rgba(124,58,237,0.28)",
  },
  pauseButton: {
    background: "#f5f3ff",
    color: "#7c3aed",
  },
  stopButton: {
    ...button,
    flex: 1,
    background: "#f3f0ff",
    color: "#4b3f66",
    boxShadow: "none",
  },
  sequence: {
    fontSize: 13,
    color: "#6b7280",
    letterSpacing: 0.6,
    lineHeight: 1.6,
  },
  sequenceCurrent: {
    color: "#7c3aed",
    fontWeight: 800,
  },
} satisfies Record<string, CSSProperties>;
