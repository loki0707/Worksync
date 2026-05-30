import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Clock, Trash2, RotateCcw, GitPullRequest } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi, commentsApi, reviewsApi, attachmentsApi, projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';
import StarRating from '../components/common/StarRating';
import TimerWidget from '../components/common/TimerWidget';
import ReviewPanel from '../components/project/ReviewPanel';
import AutoSaveIndicator from '../components/common/AutoSaveIndicator';
import useAutoSave from '../hooks/useAutoSave';
import {
  getStatusLabel, formatRelativeTime, formatDate, formatBytes,
  formatSeconds, getErrorMessage, isOverdue, isDueSoon
} from '../utils/helpers';

const STATUSES = ['TODO','IN_PROGRESS','REVIEW','DONE'];

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask]             = useState(null);
  const [comments, setComments]     = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [myRole, setMyRole]         = useState('DEVELOPER');
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('comments');
  const [commentText, setCommentText] = useState('');
  const [sending, setSending]       = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions]     = useState([]);

  // Auto-save description
  const { status: saveStatus, trigger: triggerSave } = useAutoSave(async (val) => {
    await tasksApi.update(projectId, taskId, { description: val });
  }, 1500);

  const load = useCallback(async () => {
    try {
      const [tRes, cRes, rRes, aRes, pRes] = await Promise.all([
        tasksApi.get(projectId, taskId),
        commentsApi.list(projectId, taskId),
        reviewsApi.list(projectId, taskId),
        attachmentsApi.list(projectId, taskId),
        projectsApi.get(projectId),
      ]);
      setTask(tRes.data.task);
      setComments(cRes.data.comments || []);
      setReviews(rRes.data.reviews || []);
      setAttachments(aRes.data.attachments || []);
      setMyRole(pRes.data.project?.myRole || 'DEVELOPER');
    } catch { toast.error('Failed to load task'); }
    finally { setLoading(false); }
  }, [projectId, taskId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (status) => {
    // REVIEWER cannot change status manually
    if (myRole === 'REVIEWER') return toast.error('Reviewers cannot change task status directly');
    try {
      const { data } = await tasksApi.updateStatus(projectId, taskId, status);
      setTask(data.task);
      toast.success(`Status → ${getStatusLabel(status)}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const { data } = await commentsApi.create(projectId, taskId, { content: commentText });
      setComments(prev => [data.comment, ...prev]);
      setCommentText('');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const handleDeleteComment = async (id) => {
    try {
      await commentsApi.delete(projectId, taskId, id);
      setComments(prev => prev.filter(c => c._id !== id));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const frm = new FormData(); frm.append('file', file);
    try {
      const { data } = await attachmentsApi.upload(projectId, taskId, frm);
      setAttachments(prev => [data.attachment, ...prev]);
      toast.success('Uploaded');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleDeleteAttachment = async (id) => {
    try {
      await attachmentsApi.delete(projectId, taskId, id);
      setAttachments(prev => prev.filter(a => a._id !== id));
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRestore = async () => {
    try {
      await tasksApi.restore(projectId, taskId);
      setTask(t => ({ ...t, isDeleted: false }));
      toast.success('Task restored');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const loadVersions = async () => {
    try {
      const { data } = await tasksApi.versions(projectId, taskId);
      setVersions(data.versions || []);
      setShowVersions(true);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  if (loading) return <div className="spinner-center"><div className="spinner spinner-lg"/></div>;
  if (!task) return <div className="empty-state"><p>Task not found</p></div>;

  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE';
  const dueSoon = isDueSoon(task.dueDate) && task.status !== 'DONE';

  const tabs = [
    { id:'comments',    label:`Comments (${comments.length})` },
    { id:'reviews',     label:'Review' },
    { id:'attachments', label:`Files (${attachments.length})` },
    { id:'history',     label:'History' },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom:'1rem' }}
        onClick={() => navigate(`/projects/${projectId}`)}>
        <ArrowLeft size={14}/> Back to project
      </button>

      {/* Banners */}
      {task.isDeleted && (
        <div className="alert alert-warning" style={{ marginBottom:'1rem' }}>
          <Trash2 size={14}/> This task has been deleted.
          <button className="btn btn-secondary btn-sm" style={{ marginLeft:'auto' }} onClick={handleRestore}>
            <RotateCcw size={12}/> Restore
          </button>
        </div>
      )}
      {overdue && <div className="alert alert-danger" style={{ marginBottom:'1rem' }}><Clock size={14}/> This task is overdue!</div>}
      {dueSoon && !overdue && <div className="alert alert-warning" style={{ marginBottom:'1rem' }}><Clock size={14}/> Due within 24 hours</div>}
      {task.dependencies?.filter(d => d.status !== 'DONE').length > 0 && (
        <div className="alert alert-info" style={{ marginBottom:'1rem' }}>
          <GitPullRequest size={14}/>
          Blocked by: {task.dependencies.filter(d=>d.status!=='DONE').map(d=>(
            <span key={d._id} className="dep-badge dep-blocked" style={{ marginLeft:6 }}>#{d.taskNumber} {d.title}</span>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 268px', gap:'1.5rem', alignItems:'start' }}>
        {/* Main */}
        <div>
          <div className="card" style={{ marginBottom:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span className="mono text-xs text-3">#{task.taskNumber}</span>
              <StatusBadge status={task.status}/>
              <PriorityBadge priority={task.priority}/>
              <div style={{ marginLeft:'auto' }}>
                <AutoSaveIndicator status={saveStatus}/>
              </div>
            </div>
            <h2 style={{ fontSize:'1.15rem', fontWeight:700, letterSpacing:'-.01em', marginBottom:'.85rem', lineHeight:1.35 }}>
              {task.title}
            </h2>
            <textarea
              className="input"
              rows={4}
              placeholder="Add a description… (auto-saved)"
              value={task.description}
              onChange={e => {
                const val = e.target.value;
                setTask(t => ({ ...t, description: val }));
                triggerSave(val);
              }}
              style={{ marginBottom:'1rem' }}
            />

            {/* Timer */}
            <div style={{ paddingTop:'.9rem', borderTop:'1px solid var(--border)' }}>
              <p className="form-label" style={{ marginBottom:6 }}>Time Tracking</p>
              <TimerWidget projectId={projectId} taskId={taskId} totalTime={task.totalTime||0}/>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <div className="tabs">
              {tabs.map(t => (
                <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={loadVersions}>
              <Clock size={12}/> Versions
            </button>
          </div>

          {/* Comments */}
          {tab==='comments' && (
            <div>
              <form onSubmit={handleComment} style={{ display:'flex', gap:'.75rem', marginBottom:'1.25rem' }}>
                <Avatar name={user?.name}/>
                <div style={{ flex:1 }}>
                  <textarea className="input" rows={2} placeholder="Add a comment…"
                    value={commentText} onChange={e=>setCommentText(e.target.value)}/>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={sending||!commentText.trim()}>
                      {sending?<span className="spinner"/>:<><Send size={12}/> Post</>}
                    </button>
                  </div>
                </div>
              </form>
              <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {comments.map(c => (
                  <div key={c._id} className="comment-item">
                    <Avatar name={c.author?.name} size="sm"/>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span className="comment-author">{c.author?.name}</span>
                          <span className="comment-time">{formatRelativeTime(c.createdAt)}</span>
                          {c.isEdited && <span className="text-xs text-3">(edited)</span>}
                        </div>
                        {c.author?._id===user?._id && (
                          <button className="btn-icon-sm" onClick={()=>handleDeleteComment(c._id)}><Trash2 size={12}/></button>
                        )}
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length===0 && <div className="empty-state" style={{ padding:'2rem' }}><p>No comments yet</p></div>}
              </div>
            </div>
          )}

          {/* Reviews */}
          {tab==='reviews' && (
            <ReviewPanel
              projectId={projectId}
              taskId={taskId}
              task={task}
              reviews={reviews}
              onReviewsChange={setReviews}
              myRole={myRole}
              currentUser={user}
            />
          )}

          {/* Attachments */}
          {tab==='attachments' && (
            <div>
              {myRole !== 'REVIEWER' && (
                <label className="btn btn-secondary" style={{ cursor:'pointer', marginBottom:'1rem', display:'inline-flex' }}>
                  <Paperclip size={14}/> Upload File
                  <input type="file" style={{ display:'none' }} onChange={handleFileUpload}/>
                </label>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                {attachments.map(a => (
                  <div key={a._id} className="card" style={{ padding:'.75rem', display:'flex', alignItems:'center', gap:12 }}>
                    <Paperclip size={16} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p className="text-sm fw-600 truncate">{a.originalName}</p>
                      <p className="text-xs text-3">{formatBytes(a.size)} · {a.uploadedBy?.name} · {formatRelativeTime(a.createdAt)}</p>
                    </div>
                    <button className="btn-icon-sm" onClick={()=>handleDeleteAttachment(a._id)}><Trash2 size={13}/></button>
                  </div>
                ))}
                {attachments.length===0 && <div className="empty-state" style={{ padding:'2rem' }}><p>No attachments</p></div>}
              </div>
            </div>
          )}

          {/* Status history */}
          {tab==='history' && (
            <div>
              {(task.statusHistory||[]).map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'.65rem 0', borderBottom:'1px solid var(--border)' }}>
                  <Clock size={13} style={{ color:'var(--text-muted)', flexShrink:0 }}/>
                  <span className="text-sm text-2">
                    <strong style={{ color:'var(--text-primary)' }}>{h.changedBy?.name||'Someone'}</strong>
                    {' '}moved task from <StatusBadge status={h.from}/> to <StatusBadge status={h.to}/>
                  </span>
                  <span className="text-xs text-3" style={{ marginLeft:'auto' }}>{formatRelativeTime(h.changedAt)}</span>
                </div>
              ))}
              {(!task.statusHistory||task.statusHistory.length===0) && (
                <div className="empty-state" style={{ padding:'2rem' }}><p>No status changes yet</p></div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          <div className="card">
            <div style={{ marginBottom:'1rem' }}>
              <p className="form-label" style={{ marginBottom:6 }}>Status</p>
              <select className="input" value={task.status}
                onChange={e=>handleStatusChange(e.target.value)}
                disabled={myRole==='REVIEWER'}>
                {STATUSES.map(s=><option key={s} value={s}>{getStatusLabel(s)}</option>)}
              </select>
              {myRole==='REVIEWER' && <p className="text-xs text-3" style={{ marginTop:4 }}>Reviewers approve via the Review tab</p>}
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <p className="form-label" style={{ marginBottom:4 }}>Priority</p>
              <PriorityBadge priority={task.priority}/>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <p className="form-label" style={{ marginBottom:4 }}>Reporter</p>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Avatar name={task.reporter?.name} size="sm"/>
                <span className="text-sm text-2">{task.reporter?.name}</span>
              </div>
            </div>
            {task.assignee && (
              <div style={{ marginBottom:'1rem' }}>
                <p className="form-label" style={{ marginBottom:4 }}>Assignee</p>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Avatar name={task.assignee?.name} size="sm"/>
                  <span className="text-sm text-2">{task.assignee?.name}</span>
                </div>
              </div>
            )}
            {task.dueDate && (
              <div>
                <p className="form-label" style={{ marginBottom:4 }}>Due Date</p>
                <span className="text-sm" style={{ color:overdue?'var(--red-text)':dueSoon?'var(--yellow-text)':'var(--text-2)' }}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
          </div>

          {/* Dependencies */}
          {task.dependencies?.length > 0 && (
            <div className="card">
              <p className="form-label" style={{ marginBottom:8 }}>Dependencies</p>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {task.dependencies.map(d => (
                  <div key={d._id} className={`dep-badge ${d.status==='DONE'?'dep-done':'dep-blocked'}`}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 8px', borderRadius:6 }}>
                    <span>#{d.taskNumber} {d.title?.slice(0,28)}</span>
                    <StatusBadge status={d.status}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.totalTime > 0 && (
            <div className="card">
              <p className="form-label" style={{ marginBottom:4 }}>Total Time Logged</p>
              <span className="fw-700" style={{ color:'var(--accent-text)' }}>{formatSeconds(task.totalTime)}</span>
            </div>
          )}

          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <p className="form-label">Created</p>
              <span className="text-xs text-3">{formatRelativeTime(task.createdAt)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <p className="form-label">Updated</p>
              <span className="text-xs text-3">{formatRelativeTime(task.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      <Modal open={showVersions} onClose={()=>setShowVersions(false)} title="Version History" size="lg">
        {versions.length===0
          ? <div className="empty-state"><p>No previous versions</p></div>
          : versions.map((v,i) => (
            <div key={v._id||i} style={{ padding:'.75rem 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span className="text-sm fw-600">Version {v.version}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {v.updatedBy && <div style={{ display:'flex', alignItems:'center', gap:5 }}><Avatar name={v.updatedBy.name} size="sm"/><span className="text-xs text-2">{v.updatedBy.name}</span></div>}
                  <span className="text-xs text-3">{formatRelativeTime(v.updatedAt)}</span>
                </div>
              </div>
              {v.changeNote && <p className="text-sm text-2" style={{ marginBottom:6 }}>{v.changeNote}</p>}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span className="tag">Status: {v.snapshot?.status}</span>
                <span className="tag">Priority: {v.snapshot?.priority}</span>
              </div>
            </div>
          ))
        }
      </Modal>
    </div>
  );
}
