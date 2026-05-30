import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('ws_dark');
      if (stored !== null) return stored === 'true';
    } catch {}
    return true; // default to dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.removeAttribute('data-theme');   // dark = default :root vars
    } else {
      root.setAttribute('data-theme', 'light'); // light = override
    }
    try { localStorage.setItem('ws_dark', String(dark)); } catch {}
  }, [dark]);

  return [dark, setDark];
}
