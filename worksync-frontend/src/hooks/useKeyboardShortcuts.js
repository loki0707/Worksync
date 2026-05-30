import { useEffect } from 'react';

/**
 * Register global keyboard shortcuts.
 * shortcuts: array of { key, meta?, ctrl?, shift?, handler }
 */
export default function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      // Skip when typing in input/textarea
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      for (const s of shortcuts) {
        const metaOk  = s.meta  ? (e.metaKey  || e.ctrlKey) : true;
        const ctrlOk  = s.ctrl  ? e.ctrlKey  : true;
        const shiftOk = s.shift ? e.shiftKey : !e.shiftKey;
        if (e.key === s.key && metaOk && ctrlOk && shiftOk) {
          e.preventDefault();
          s.handler();
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
