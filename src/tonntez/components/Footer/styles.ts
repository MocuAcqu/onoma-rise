import type { CSSProperties } from "react";

export const styles = {
  bar: {
    width: "100%",
    padding: "16px",
    background: "transparent",
    boxSizing: "border-box",
  },
  content: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  center: {
    display: "flex",
    alignItems: "center",
    gap: 32,
  },
  logoImg: { width: 60, opacity: 0.5 },
  text: {
    fontSize: 14,
    color: "#a0a0b8",
    fontWeight: 600,
  },
  link: {
    fontSize: 14,
    color: "#a0a0b8",
    fontWeight: 600,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
    textDecoration: "none",
    transition: "color 0.3s",
  },
} satisfies Record<string, CSSProperties>;
