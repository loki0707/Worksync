import React, { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const fmt = (s) => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

export default function TimerWidget({ projectId, taskId, totalTime=0 }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const interval = useRef(null);

  useEffect(() => {
    if (running) { interval.current = setInterval(() => setElapsed(e=>e+1), 1000); }
    else clearInterval(interval.current);
    return () => clearInterval(interval.current);
  }, [running]);

  const start = async () => {
    setLoading(true);
    try { await api.post(`/projects/${projectId}/tasks/${taskId}/time/start`); setRunning(true); setElapsed(0); toast.success('Timer started'); }
    catch(e) { toast.error(e.response?.data?.message || 'Failed to start timer'); }
    finally { setLoading(false); }
  };
  const stop = async () => {
    setLoading(true);
    try { await api.post(`/projects/${projectId}/tasks/${taskId}/time/stop`); setRunning(false); toast.success(`Logged ${fmt(elapsed)}`); }
    catch(e) { toast.error(e.response?.data?.message || 'Failed to stop timer'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'.6rem .85rem',background:'var(--bg-subtle)',borderRadius:'var(--radius)',border:'1px solid var(--border)'}}>
      <span style={{fontFamily:'ui-monospace,monospace',fontWeight:700,fontSize:'1rem',color:running?'var(--green)':'var(--text)',letterSpacing:'.05em'}}>
        {fmt(running?elapsed:0)}
      </span>
      {!running
        ? <button className="btn btn-success btn-sm" onClick={start} disabled={loading}><Play size={12}/> Start</button>
        : <button className="btn btn-danger btn-sm"  onClick={stop}  disabled={loading}><Square size={12}/> Stop</button>
      }
      <span className="text-xs text-3">Total: {fmt(totalTime)}</span>
    </div>
  );
}
