import type { CSSProperties } from "react";

export const styles = {
  container: {
    display: "flex",
    gap: 4,
    background: "rgba(124,58,237,0.08)",
    borderRadius: 999,
    padding: "4px 4px",
  },
  button: {
    padding: "6px 16px",
    borderRadius: 999,
    border: "none",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 150ms ease",
    background: "transparent",
    color: "#6b7280",
  },
  activeButton: {
    background: "#ffffff",
    color: "#4b3f66",
    boxShadow: "0 4px 12px rgba(124,58,237,0.14)",
  },
} satisfies Record<string, CSSProperties>;
