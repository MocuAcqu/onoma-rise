import { useCallback, useSyncExternalStore } from 'react';

/**
 * 訂閱 CSS media query，讓使用 inline style 的元件也能依螢幕尺寸切換版面。
 * 例：const isPhone = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = () =>
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** 全站共用斷點：手機 < 768px，平板 768–1023px，筆電／桌機 ≥ 1024px */
export const PHONE_QUERY = '(max-width: 767px)';
export const TABLET_QUERY = '(min-width: 768px) and (max-width: 1023px)';
