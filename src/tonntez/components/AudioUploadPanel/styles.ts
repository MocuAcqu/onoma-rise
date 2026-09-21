import type { CSSProperties } from "react";
import { GRADIENTS } from "../../config/theme";

export const styles = {
  uploadWrap: { marginBottom: 0, display: "flex", alignItems: "center", gap: 12 },
  uploadLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 6px 6px 18px",
    borderRadius: 999,
    border: "1px solid rgba(124,58,237,0.24)",
    background: "#ffffff",
    cursor: "pointer",
    transition: "box-shadow 160ms ease",
  },
  uploadLabelDisabled: { cursor: "not-allowed", opacity: 0.58 },
  uploadPrompt: { fontSize: 13, fontWeight: 700, color: "#6b7280" },
  uploadButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 20px",
    borderRadius: 999,
    background: GRADIENTS.primary,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  uploadInputHidden: { display: "none" },
} satisfies Record<string, CSSProperties>;
