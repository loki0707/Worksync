import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

export default function useGlobalSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState({ tasks:[], projects:[], users:[] });
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (!q.trim() || q.length < 2) { setResults({ tasks:[], projects:[], users:[] }); return; }

    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [tasks, projects, users] = await Promise.all([
          api.get('/search/tasks',    { params: { q } }),
          api.get('/search/projects', { params: { q } }),
          api.get('/users/search',    { params: { q } }),
        ]);
        setResults({
          tasks:    tasks.data.results    || [],
          projects: projects.data.results || [],
          users:    users.data.users      || [],
        });
      } catch { setResults({ tasks:[], projects:[], users:[] }); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const clear = useCallback(() => { setQuery(''); setResults({ tasks:[], projects:[], users:[] }); }, []);

  return { query, results, loading, search, clear };
}
