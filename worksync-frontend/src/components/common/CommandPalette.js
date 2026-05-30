import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, User, Plus, ArrowRight, Hash } from 'lucide-react';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import useGlobalSearch from '../../hooks/useGlobalSearch';

const QUICK_ACTIONS = [
  { id:'dashboard', icon:<FolderKanban size={14}/>, title:'Go to Dashboard', sub:'Navigation', path:'/dashboard' },
  { id:'projects',  icon:<FolderKanban size={14}/>, title:'View All Projects', sub:'Navigation', path:'/projects' },
  { id:'notifs',    icon:<Hash size={14}/>,          title:'Notifications',    sub:'Navigation', path:'/notifications' },
  { id:'profile',   icon:<User size={14}/>,          title:'Profile Settings', sub:'Navigation', path:'/profile' },
];

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { query, results, loading, search, clear } = useGlobalSearch();
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setSelected(0); }
    else clear();
  }, [open, clear]);

  const hasResults = results.tasks.length + results.projects.length + results.users.length > 0;

  // Build flat list for keyboard nav
  const flatItems = query.length < 2
    ? QUICK_ACTIONS.map(a => ({ ...a, type:'action' }))
    : [
        ...results.projects.map(p => ({ id:p._id, type:'project', title:p.name, sub:`Project · ${p.key}`, path:`/projects/${p._id}` })),
        ...results.tasks.map(t   => ({ id:t._id, type:'task',    title:t.title, sub:`Task · ${t.project?.name||''}`, path:`/projects/${t.project?._id||t.project}/tasks/${t._id}` })),
        ...results.users.map(u   => ({ id:u._id, type:'user',    title:u.name,  sub:u.email, path:'/profile' })),
      ];

  const go = useCallback((item) => {
    if (item.path) navigate(item.path);
    setOpen(false);
  }, [navigate, setOpen]);

  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key==='ArrowDown') { e.preventDefault(); setSelected(s=>Math.min(s+1,flatItems.length-1)); }
      if (e.key==='ArrowUp')   { e.preventDefault(); setSelected(s=>Math.max(s-1,0)); }
      if (e.key==='Enter' && flatItems[selected]) go(flatItems[selected]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, flatItems, selected, go]);

  if (!open) return null;

  const iconForType = (type) => {
    if (type==='project') return <FolderKanban size={14}/>;
    if (type==='task')    return <CheckSquare  size={14}/>;
    if (type==='user')    return <User size={14}/>;
    return <ArrowRight size={14}/>;
  };

  return (
    <div className="cmd-overlay" onClick={()=>setOpen(false)}>
      <div className="cmd-box" onClick={e=>e.stopPropagation()}>
        {/* Input */}
        <div className="cmd-input-wrap">
          {loading ? <span className="spinner" style={{width:16,height:16}}/> : <Search size={16} style={{color:'var(--text-muted)',flexShrink:0}}/>}
          <input ref={inputRef} className="cmd-input" placeholder="Search tasks, projects, users… or type a command"
            value={query} onChange={e=>search(e.target.value)}/>
          {query && <button className="btn-icon-sm" onClick={clear} style={{fontSize:'.7rem'}}>✕</button>}
        </div>

        {/* Results */}
        <div className="cmd-results">
          {query.length < 2 && (
            <>
              <div className="cmd-section-label">Quick Actions</div>
              {QUICK_ACTIONS.map((a,i)=>(
                <div key={a.id} className={`cmd-item${selected===i?' selected':''}`} onMouseEnter={()=>setSelected(i)} onClick={()=>go(a)}>
                  <div className="cmd-item-icon">{a.icon}</div>
                  <div><div className="cmd-item-title">{a.title}</div><div className="cmd-item-sub">{a.sub}</div></div>
                </div>
              ))}
            </>
          )}

          {query.length >= 2 && !hasResults && !loading && (
            <div className="empty-state" style={{padding:'2rem'}}>
              <p>No results for "<strong>{query}</strong>"</p>
            </div>
          )}

          {results.projects.length > 0 && (
            <>
              <div className="cmd-section-label">Projects</div>
              {results.projects.map((p,i)=>{
                const idx = QUICK_ACTIONS.length + i;
                return (
                  <div key={p._id} className={`cmd-item${selected===idx?' selected':''}`} onMouseEnter={()=>setSelected(idx)}
                    onClick={()=>go({path:`/projects/${p._id}`})}>
                    <div className="cmd-item-icon"><FolderKanban size={14}/></div>
                    <div><div className="cmd-item-title">{p.name}</div><div className="cmd-item-sub">{p.key} · {p.status}</div></div>
                  </div>
                );
              })}
            </>
          )}

          {results.tasks.length > 0 && (
            <>
              <div className="cmd-section-label">Tasks</div>
              {results.tasks.slice(0,6).map((t,i)=>{
                const idx = results.projects.length + i;
                return (
                  <div key={t._id} className={`cmd-item${selected===idx?' selected':''}`} onMouseEnter={()=>setSelected(idx)}
                    onClick={()=>go({path:`/projects/${t.project?._id||t.project}/tasks/${t._id}`})}>
                    <div className="cmd-item-icon"><CheckSquare size={14}/></div>
                    <div>
                      <div className="cmd-item-title">{t.title}</div>
                      <div className="cmd-item-sub">{t.project?.name} · {t.status}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {results.users.length > 0 && (
            <>
              <div className="cmd-section-label">People</div>
              {results.users.slice(0,4).map((u,i)=>(
                <div key={u._id} className="cmd-item" onClick={()=>setOpen(false)}>
                  <div className="avatar avatar-sm" style={{flexShrink:0}}>{u.name?.[0]?.toUpperCase()}</div>
                  <div><div className="cmd-item-title">{u.name}</div><div className="cmd-item-sub">{u.email}</div></div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="cmd-footer">
          <span className="cmd-hint"><span className="cmd-kbd">↑↓</span> navigate</span>
          <span className="cmd-hint"><span className="cmd-kbd">↵</span> open</span>
          <span className="cmd-hint"><span className="cmd-kbd">Esc</span> close</span>
          <span style={{marginLeft:'auto',fontSize:'.68rem',color:'var(--text-muted)'}}>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
