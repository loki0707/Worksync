import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, BarChart2, Search, Trophy, Filter, RotateCcw, Pin, PinOff, Users, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsApi, tasksApi, activityApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Avatar from '../components/common/Avatar';
import ActivityTimeline from '../components/common/ActivityTimeline';
import TeamPanel from '../components/project/TeamPanel';
import { getStatusLabel, formatDate, getErrorMessage, isOverdue, isDueSoon } from '../utils/helpers';
import { joinProject, leaveProject, getSocket } from '../services/socket';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const COLUMNS = ['TODO','IN_PROGRESS','REVIEW','DONE'];
const COL_META = {
  TODO:        { label:'To Do',       color:'#64748b', dot:'#64748b' },
  IN_PROGRESS: { label:'In Progress', color:'#6366f1', dot:'#6366f1' },
  REVIEW:      { label:'In Review',   color:'#8b5cf6', dot:'#8b5cf6' },
  DONE:        { label:'Done',        color:'#10b981', dot:'#10b981' },
};

function KanbanCard({ task, project, onClick, onPin, myRole }) {
  const overdue  = isOverdue(task.dueDate) && task.status !== 'DONE';
  const dueSoon  = isDueSoon(task.dueDate) && task.status !== 'DONE';

  return (
    <div
      className={`kanban-card${task.isPinned?' pinned':''}${task.priority==='HIGH'&&!task.isPinned?' high-priority':''}${overdue?' overdue':''}`}
      onClick={() => onClick(task)}
      style={{ position: 'relative' }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6 }}>
        <span className="kanban-card-id">{project?.key}-{task.taskNumber}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {task.isPinned && <Pin size={11} style={{ color:'var(--orange-text)' }}/>}
          <PriorityBadge priority={task.priority}/>
        </div>
      </div>
      <p className="kanban-card-title">{task.title}</p>
      {task.dependencies?.some(d => d.status !== 'DONE') && (
        <div style={{ marginBottom:6 }}>
          <span className="dep-badge dep-blocked">⛔ {task.dependencies.filter(d=>d.status!=='DONE').length} blocked</span>
        </div>
      )}
      {task.githubPR && (
        <div style={{ marginBottom:6 }}>
          <span style={{ fontSize:'.68rem', color:'var(--accent-text)', fontWeight:500 }}>🔗 PR linked</span>
        </div>
      )}
      <div className="kanban-card-footer">
        {task.dueDate ? (
          <span style={{ fontSize:'.7rem', fontWeight:500, color:overdue?'var(--red-text)':dueSoon?'var(--yellow-text)':'var(--text-muted)' }}>
            {overdue?'⚠ ':dueSoon?'⏰ ':''}{formatDate(task.dueDate)}
          </span>
        ) : <span/>}
        {task.assignee && <Avatar name={task.assignee.name} size="sm"/>}
      </div>
    </div>
  );
}

function CreateTaskModal({ open, onClose, onCreated, projectId, members, myRole }) {
  const [form, setForm] = useState({ title:'', description:'', priority:'MEDIUM', status:'TODO', dueDate:'', assignee:'' });
  const [loading, setLoading] = useState(false);

  // REVIEWER cannot create tasks
  if (myRole === 'REVIEWER') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setLoading(true);
    try {
      const { data } = await tasksApi.create(projectId, { ...form, assignee: form.assignee||undefined });
      onCreated(data.task); toast.success('Task created');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="input" placeholder="What needs to be done?" value={form.title} autoFocus
            onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input" rows={2} placeholder="Details…"
            value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              {COLUMNS.map(s=><option key={s} value={s}>{COL_META[s].label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
              {['LOW','MEDIUM','HIGH'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assign To</label>
            <select className="input" value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))}>
              <option value="">Unassigned</option>
              {(members||[]).filter(m => m.role !== 'REVIEWER').map(m=>(
                <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="input" type="date" value={form.dueDate}
              onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading?<span className="spinner"/>:<><Plus size={14}/> Create</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject]     = useState(null);
  const [tasks, setTasks]         = useState([]);
  const [activity, setActivity]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters]     = useState({ status:'', priority:'', assignee:'', search:'', showDeleted:false });

  const myRole = project?.myRole || 'DEVELOPER';

  // N shortcut — only developers and admins
  useKeyboardShortcuts([{
    key: 'n',
    handler: () => { if (myRole !== 'REVIEWER') setShowCreate(true); }
  }]);

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        projectsApi.get(projectId),
        tasksApi.list(projectId, { limit:200 }),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks || []);
    } catch { toast.error('Failed to load project'); }
    finally { setLoading(false); }
  }, [projectId]);

  const loadActivity = useCallback(async () => {
    try {
      const { data } = await activityApi.list(projectId, { limit:30 });
      setActivity(data.logs || []);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    load(); loadActivity();
    joinProject(projectId);
    const socket = getSocket();
    if (socket) {
      socket.on('task_created', t => setTasks(p => [t,...p]));
      socket.on('task_updated', t => setTasks(p => p.map(x => x._id===t._id?t:x)));
      socket.on('task_status_changed', ({taskId, status}) => setTasks(p => p.map(x => x._id===taskId?{...x,status}:x)));
      socket.on('task_deleted', ({taskId}) => setTasks(p => p.filter(x => x._id!==taskId)));
    }
    return () => {
      leaveProject(projectId);
      if (socket) ['task_created','task_updated','task_status_changed','task_deleted'].forEach(e=>socket.off(e));
    };
  }, [projectId, load, loadActivity]);

  const handlePin = useCallback(async (task) => {
    try {
      const { data } = await tasksApi.update(projectId, task._id, { isPinned: !task.isPinned });
      setTasks(p => p.map(t => t._id===task._id ? data.task : t));
      toast.success(task.isPinned ? 'Unpinned' : '📌 Pinned');
    } catch (err) { toast.error(getErrorMessage(err)); }
  }, [projectId]);

  const filtered = tasks.filter(t => {
    if (!filters.showDeleted && t.isDeleted) return false;
    if (filters.showDeleted && !t.isDeleted) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee === 'unassigned' && t.assignee) return false;
    if (filters.assignee && filters.assignee !== 'unassigned' && t.assignee?._id !== filters.assignee) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => (b.isPinned?1:0)-(a.isPinned?1:0));
  const byStatus = COLUMNS.reduce((acc,s) => { acc[s]=sorted.filter(t=>t.status===s); return acc; }, {});

  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg"/></div>;
  if (!project) return <div className="empty-state"><p>Project not found</p></div>;

  const tabs = [
    { id:'board',    label:'Board' },
    { id:'list',     label:'List' },
    { id:'activity', label:'Activity' },
    { id:'team',     label:'Team', count: project.members?.length },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:'.85rem', fontSize:'.82rem', color:'var(--text-muted)' }}>
        <button className="btn btn-ghost btn-sm" style={{ padding:'2px 5px' }} onClick={()=>navigate('/projects')}>Projects</button>
        <span style={{ opacity:.4 }}>/</span>
        <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>{project.name}</span>
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ padding:'3px 9px', background:'var(--accent-dim)', borderRadius:'var(--r)', border:'1px solid var(--accent-glow)' }}>
            <span style={{ fontFamily:'ui-monospace,monospace', fontSize:'.72rem', fontWeight:800, color:'var(--accent-text)' }}>{project.key}</span>
          </div>
          <h1 style={{ fontSize:'1.25rem', fontWeight:800, letterSpacing:'-.03em' }}>{project.name}</h1>
          {/* Role badge */}
          <span style={{
            fontSize:'.68rem', fontWeight:700, padding:'2px 8px', borderRadius:99,
            background: myRole==='ADMIN'?'var(--yellow-dim)':myRole==='REVIEWER'?'var(--green-dim)':'var(--accent-dim)',
            color: myRole==='ADMIN'?'var(--yellow-text)':myRole==='REVIEWER'?'var(--green-text)':'var(--accent-text)',
          }}>
            {myRole}
          </span>
        </div>
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          {myRole === 'ADMIN' && (
            <button className="btn btn-secondary btn-sm" onClick={()=>setActiveTab('team')}>
              <Users size={13}/> Team
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate(`/leaderboard/${projectId}`)}>
            <Trophy size={13}/> Leaderboard
          </button>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate(`/analytics/${projectId}`)}>
            <BarChart2 size={13}/> Analytics
          </button>
          {myRole !== 'REVIEWER' && (
            <button className="btn btn-primary btn-sm" onClick={()=>setShowCreate(true)}>
              <Plus size={13}/> Task <span className="kbd" style={{ background:'rgba(255,255,255,0.15)', borderColor:'rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)', marginLeft:4 }}>N</span>
            </button>
          )}
        </div>
      </div>

      {project.description && <p className="text-2 text-sm" style={{ marginBottom:'1.25rem' }}>{project.description}</p>}

      {/* Tabs + search */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
          <div className="tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`tab-btn${activeTab===tab.id?' active':''}`} onClick={()=>setActiveTab(tab.id)}>
                {tab.label}{tab.count!=null&&` (${tab.count})`}
              </button>
            ))}
          </div>
          {(activeTab==='board'||activeTab==='list') && (
            <button className={`btn btn-sm ${showFilters?'btn-primary':'btn-secondary'}`} onClick={()=>setShowFilters(f=>!f)}>
              <Filter size={12}/> Filters
            </button>
          )}
        </div>
        {(activeTab==='board'||activeTab==='list') && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'.38rem .9rem', width:220 }}>
            <Search size={13} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
            <input placeholder="Search tasks…" value={filters.search}
              onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
              style={{ background:'none', border:'none', outline:'none', fontSize:'.82rem', color:'var(--text-primary)', width:'100%' }}/>
          </div>
        )}
      </div>

      {/* Filter bar */}
      {showFilters && (activeTab==='board'||activeTab==='list') && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', alignItems:'center', padding:'.75rem 1rem', background:'var(--bg-layer)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', marginBottom:'1rem' }}>
          <Filter size={12} style={{ color:'var(--text-muted)' }}/>
          {[
            { key:'status', opts:[{v:'',l:'All statuses'},...COLUMNS.map(s=>({v:s,l:COL_META[s].label}))] },
            { key:'priority', opts:[{v:'',l:'All priorities'},...['LOW','MEDIUM','HIGH'].map(p=>({v:p,l:p}))] },
            { key:'assignee', opts:[{v:'',l:'All assignees'},{v:'unassigned',l:'Unassigned'},...(project.members||[]).map(m=>({v:m.user._id,l:m.user.name}))] },
          ].map(f=>(
            <select key={f.key} className="input" style={{ width:'auto', fontSize:'.8rem', padding:'.3rem .65rem', minWidth:130 }}
              value={filters[f.key]} onChange={e=>setFilters(prev=>({...prev,[f.key]:e.target.value}))}>
              {f.opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={()=>setFilters({status:'',priority:'',assignee:'',search:'',showDeleted:false})}>
            <RotateCcw size={11}/> Clear
          </button>
        </div>
      )}

      {/* Board */}
      {activeTab==='board' && (
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <div key={col} className="kanban-col">
              <div className="kanban-col-header">
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span className="kanban-col-dot" style={{ background:COL_META[col].dot }}/>
                  <span className="kanban-col-title" style={{ color:COL_META[col].color }}>{COL_META[col].label}</span>
                </div>
                <span className="kanban-col-count">{byStatus[col].length}</span>
              </div>
              <div className="kanban-cards">
                {byStatus[col].map(task => (
                  <KanbanCard key={task._id} task={task} project={project} myRole={myRole}
                    onClick={()=>navigate(`/projects/${projectId}/tasks/${task._id}`)}
                    onPin={handlePin}/>
                ))}
                {byStatus[col].length===0 && (
                  <div style={{ textAlign:'center', padding:'1.5rem .5rem', color:'var(--text-muted)', fontSize:'.78rem' }}>
                    {col==='REVIEW' ? 'Awaiting review' : col==='DONE' ? 'Nothing completed yet' : 'No tasks'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {activeTab==='list' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th><th>PR</th></tr>
            </thead>
            <tbody>
              {sorted.map(task => (
                <tr key={task._id} style={{ cursor:'pointer', opacity:task.isDeleted?.5:1 }}
                  onClick={()=>navigate(`/projects/${projectId}/tasks/${task._id}`)}>
                  <td><span className="mono text-xs text-3">{project.key}-{task.taskNumber}</span></td>
                  <td style={{ color:'var(--text-primary)', fontWeight:600, maxWidth:320 }}>
                    {task.isPinned && <Pin size={11} style={{ color:'var(--orange-text)', marginRight:5, verticalAlign:'middle' }}/>}
                    {task.title}
                  </td>
                  <td><StatusBadge status={task.status}/></td>
                  <td><PriorityBadge priority={task.priority}/></td>
                  <td>
                    {task.assignee
                      ? <div style={{ display:'flex', alignItems:'center', gap:6 }}><Avatar name={task.assignee.name} size="sm"/><span className="text-sm">{task.assignee.name}</span></div>
                      : <span className="text-3 text-sm">—</span>}
                  </td>
                  <td><span className="text-sm" style={{ color:isOverdue(task.dueDate)&&task.status!=='DONE'?'var(--red-text)':isDueSoon(task.dueDate)?'var(--yellow-text)':'var(--text-2)' }}>{formatDate(task.dueDate)}</span></td>
                  <td>{task.githubPR && <span style={{ fontSize:'.68rem', color:'var(--accent-text)' }}>🔗 PR</span>}</td>
                </tr>
              ))}
              {sorted.length===0 && <tr><td colSpan={7}><div className="empty-state"><p>No tasks match your filters</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Activity */}
      {activeTab==='activity' && (
        <div className="card" style={{ maxWidth:600 }}>
          <ActivityTimeline logs={activity}/>
        </div>
      )}

      {/* Team management */}
      {activeTab==='team' && (
        <div style={{ maxWidth:700 }}>
          <TeamPanel
            projectId={projectId}
            members={project.members || []}
            myRole={myRole}
            onMembersChange={(updated) => setProject(p => ({...p, members: updated}))}
          />
        </div>
      )}

      <CreateTaskModal open={showCreate} onClose={()=>setShowCreate(false)} projectId={projectId}
        members={project.members} myRole={myRole}
        onCreated={t=>{ setTasks(p=>[t,...p]); setShowCreate(false); }}/>
    </div>
  );
}
