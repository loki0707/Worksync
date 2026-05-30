import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CmdCtx = createContext(null);

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <CmdCtx.Provider value={{ open, setOpen }}>
      {children}
    </CmdCtx.Provider>
  );
}

export const useCommandPalette = () => {
  const ctx = useContext(CmdCtx);
  if (!ctx) throw new Error('useCommandPalette must be inside CommandPaletteProvider');
  return ctx;
};
