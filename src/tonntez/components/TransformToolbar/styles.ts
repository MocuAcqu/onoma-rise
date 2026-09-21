import type { CSSProperties } from "react";
import { GRADIENTS } from "../../config/theme";

export const styles = {
  toolbar: { display: "flex", alignItems: "center", gap: 6 },
  label: { display: "none" },
  group: { display: "flex", alignItems: "center", gap: 14 },
  button: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  activeButton: {
    background: GRADIENTS.primary,
    color: "#ffffff",
    boxShadow: "0 8px 18px rgba(124,58,237,0.24)",
  },
} satisfies Record<string, CSSProperties>;
