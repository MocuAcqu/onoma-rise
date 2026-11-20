import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './FitToWidth.css';

type FitToWidthProps = {
  children: ReactNode;
  /** 最小縮放比例，避免元件在極窄螢幕上縮到無法操作 */
  minScale?: number;
  className?: string;
};

/**
 * 讓固定寬度的互動元件（五線譜、鍵盤、畫布等）在窄螢幕上等比例縮小。
 * 寬度足夠時維持原尺寸；不足時以 transform 縮放，並同步修正佔用高度，
 * 讓下方版面不會出現空白或重疊。
 */
const FitToWidth = ({ children, minScale = 0.35, className }: FitToWidthProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const available = outer.clientWidth;
      // offsetWidth / offsetHeight 不受 transform 影響，量到的是原始尺寸
      const naturalWidth = inner.offsetWidth;
      const naturalHeight = inner.offsetHeight;
      if (!available || !naturalWidth) return;

      const next = naturalWidth > available
        ? Math.max(minScale, available / naturalWidth)
        : 1;
      setScale(next);
      setHeight(next < 1 ? naturalHeight * next : undefined);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [minScale]);

  return (
    <div
      ref={outerRef}
      className={`fit-to-width${className ? ` ${className}` : ''}`}
      style={{ height }}
    >
      <div
        ref={innerRef}
        className="fit-to-width__inner"
        style={scale < 1 ? { transform: `scale(${scale})` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};

export default FitToWidth;
