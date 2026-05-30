import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, ArrowRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsApi } from '../services/api';
import { formatRelativeTime, truncate, getErrorMessage } from '../utils/helpers';
import Modal from '../components/common/Modal';

function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', key:'', description:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name||!form.key) return toast.error('Name and key are required');
    setLoading(true);
    try {
      const {data} = await projectsApi.create(form);
      toast.success('Project created!');
      onCreated(data.project);
      setForm({name:'',key:'',description:''});
    } catch(err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input className="input" placeholder="e.g. Mobile App Redesign" value={form.name}
            autoFocus
            onChange={e => {
              const name = e.target.value;
              setForm(f=>({...f, name, key: name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,6)}));
            }}/>
        </div>
        <div className="form-group">
          <label className="form-label">Project Key *</label>
          <input className="input" placeholder="MAR" value={form.key} maxLength={10}
            onChange={e=>setForm(f=>({...f,key:e.target.value.toUpperCase()}))}/>
          <span className="text-xs text-3" style={{marginTop:3}}>Used to prefix task IDs (e.g. MAR-1)</span>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input" rows={3} placeholder="What's this project about?"
            value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'.25rem'}}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner"/> : <><Plus size={14}/> Create</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => {
    projectsApi.list({limit:50})
      .then(({data})=>setProjects(data.data||[]))
      .catch(()=>toast.error('Failed to load projects'))
      .finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{load();},[load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>All your workspaces in one place</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={15}/> New Project</button>
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner spinner-lg"/></div>
      ) : projects.length===0 ? (
        <div className="empty-state">
          <FolderKanban size={48}/>
          <h3>No projects yet</h3>
          <p>Create your first project to start managing tasks</p>
          <button className="btn btn-primary" onClick={()=>setShowModal(true)}><Plus size={14}/> Create Project</button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p=>(
            <div key={p._id} className="card card-hover" onClick={()=>navigate(`/projects/${p._id}`)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.6rem'}}>
                <span style={{fontFamily:'ui-monospace,monospace',fontSize:'.7rem',fontWeight:700,background:'var(--primary-bg)',color:'var(--primary-text)',padding:'2px 7px',borderRadius:5}}>
                  {p.key}
                </span>
                <ArrowRight size={14} style={{color:'var(--text-3)',marginTop:2}}/>
              </div>
              <h3 style={{fontSize:'.95rem',fontWeight:700,marginBottom:'.4rem',letterSpacing:'-.01em'}}>{p.name}</h3>
              {p.description && (
                <p className="text-2 text-sm" style={{marginBottom:'.85rem',lineHeight:1.55}}>
                  {truncate(p.description,100)}
                </p>
              )}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:'.5rem',borderTop:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}>
                  <div className="avatar avatar-sm">{p.owner?.name?.[0]?.toUpperCase()}</div>
                  <span className="text-xs text-3">{p.owner?.name}</span>
                </div>
                <span style={{fontSize:'.7rem',fontWeight:600,color:p.status==='ACTIVE'?'var(--green-text)':'var(--text-3)',background:p.status==='ACTIVE'?'var(--green-bg)':'var(--bg-subtle)',padding:'2px 8px',borderRadius:99,textTransform:'uppercase',letterSpacing:'.04em'}}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateProjectModal open={showModal} onClose={()=>setShowModal(false)}
        onCreated={p=>{ setProjects(prev=>[p,...prev]); setShowModal(false); }}/>
    </div>
  );
}
