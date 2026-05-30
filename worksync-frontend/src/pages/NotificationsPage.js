import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';
import useNotifications from '../hooks/useNotifications';
import { notificationsApi } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_ICONS = {
  TASK_ASSIGNED:'📋', REVIEW_REQUESTED:'🔍', REVIEW_APPROVED:'✅',
  REVIEW_CHANGES_REQUESTED:'🔄', COMMENT_ADDED:'💬', MEMBER_ADDED:'👥', TASK_DUE_SOON:'⏰',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    if (n.link) navigate(n.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try { await notificationsApi.delete(id); toast.success('Removed'); window.location.reload(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div style={{maxWidth:680,margin:'0 auto'}}>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          {unreadCount>0&&<p>{unreadCount} unread</p>}
        </div>
        {unreadCount>0&&(
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={14}/> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-center"><div className="spinner spinner-lg"/></div>
      ) : notifications.length===0 ? (
        <div className="empty-state"><Bell size={48}/><h3>All caught up</h3><p>No notifications yet.</p></div>
      ) : (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {notifications.map((n,i)=>(
            <div key={n._id} className={`notif-item${!n.isRead?' unread':''}`}
              style={{borderBottom:i<notifications.length-1?'1px solid var(--border)':'none'}}
              onClick={()=>handleClick(n)}>
              <span style={{fontSize:'1.15rem',flexShrink:0,marginTop:2}}>{TYPE_ICONS[n.type]||'🔔'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                  <p style={{fontSize:'.875rem',fontWeight:600,color:'var(--text)'}}>{n.title}</p>
                  {!n.isRead&&<div className="notif-dot" style={{flexShrink:0,marginTop:7}}/>}
                </div>
                <p style={{fontSize:'.82rem',color:'var(--text-2)',marginTop:2}}>{n.message}</p>
                <p style={{fontSize:'.72rem',color:'var(--text-3)',marginTop:4}}>{formatRelativeTime(n.createdAt)}</p>
              </div>
              <button className="btn btn-ghost btn-icon-sm" style={{flexShrink:0,alignSelf:'center'}}
                onClick={e=>handleDelete(e,n._id)}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
