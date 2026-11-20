import type { CSSProperties } from "react";
import { BRAND, GRADIENTS } from "../config/theme";

export type MobilePanel = "tonnetz" | "melody" | "timeline";

const TABS: { id: MobilePanel; label: string }[] = [
  { id: "tonnetz", label: "Tonnetz" },
  { id: "melody", label: "旋律資訊" },
  { id: "timeline", label: "時間軸" },
];

type MobilePanelTabsProps = {
  active: MobilePanel;
  onChange: (panel: MobilePanel) => void;
};

/** 手機版：在播放區塊下方切換 Tonnetz／旋律資訊／時間軸 */
export function MobilePanelTabs({ active, onChange }: MobilePanelTabsProps) {
  return (
    <div style={styles.bar} role="tablist" aria-label="顯示內容">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tonnetz-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="tonnetz-mobile-panel"
            style={{ ...styles.tab, ...(isActive ? styles.tabActive : {}) }}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  bar: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 4,
    padding: 4,
    borderRadius: 999,
    background: "rgba(255,255,255,0.86)",
    border: `1px solid ${BRAND.cardBorder}`,
    boxShadow: "0 8px 20px rgba(124,58,237,0.08)",
  },
  tab: {
    minHeight: 40,
    padding: "0 8px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: BRAND.inkSoft,
    fontSize: 14,
    fontWeight: 800,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  tabActive: {
    color: "#ffffff",
    background: GRADIENTS.primary,
    boxShadow: "0 8px 18px rgba(124,58,237,0.18)",
  },
} satisfies Record<string, CSSProperties>;
