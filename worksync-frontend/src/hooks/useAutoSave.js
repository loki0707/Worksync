import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Auto-save hook. Debounces writes and shows a "Saved" indicator.
 * @param {Function} saveFn - async function to call with current value
 * @param {number} delay - debounce ms (default 1200)
 */
export default function useAutoSave(saveFn, delay = 1200) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const timer = useRef(null);
  const fn = useRef(saveFn);
  fn.current = saveFn;

  const trigger = useCallback((value) => {
    clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(async () => {
      try {
        await fn.current(value);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2500);
      } catch {
        setStatus('error');
      }
    }, delay);
  }, [delay]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { status, trigger };
}
