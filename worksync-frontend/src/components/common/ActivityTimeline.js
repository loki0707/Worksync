import React from 'react';
import { CheckCircle2, MessageSquare, UserPlus, GitPullRequest, Pencil, Trash2, RefreshCw, Star, Clock } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';

const ACTION_META = {
  TASK_CREATED:             { icon:<CheckCircle2 size={14}/>,  color:'var(--green)',   label:'created task' },
  TASK_UPDATED:             { icon:<Pencil size={14}/>,        color:'var(--accent)',  label:'updated task' },
  TASK_DELETED:             { icon:<Trash2 size={14}/>,        color:'var(--red)',     label:'deleted task' },
  STATUS_CHANGED:           { icon:<RefreshCw size={14}/>,     color:'var(--cyan)',    label:'changed status' },
  COMMENT_ADDED:            { icon:<MessageSquare size={14}/>, color:'var(--purple)',  label:'commented' },
  REVIEW_SUBMITTED:         { icon:<GitPullRequest size={14}/>,color:'var(--yellow)',  label:'submitted review' },
  REVIEW_APPROVED:          { icon:<Star size={14}/>,          color:'var(--green)',   label:'approved review' },
  REVIEW_CHANGES_REQUESTED: { icon:<GitPullRequest size={14}/>,color:'var(--orange)',  label:'requested changes' },
  MEMBER_ADDED:             { icon:<UserPlus size={14}/>,      color:'var(--accent)',  label:'added member' },
  ATTACHMENT_ADDED:         { icon:<Clock size={14}/>,         color:'var(--text-secondary)', label:'attached file' },
};

export default function ActivityTimeline({ logs = [] }) {
  if (!logs.length) return (
    <div className="empty-state" style={{padding:'2rem'}}>
      <Clock size={36}/>
      <h3>No activity yet</h3>
      <p>Actions on this project will appear here</p>
    </div>
  );

  return (
    <div className="timeline">
      {logs.map((log, i) => {
        const meta = ACTION_META[log.action] || { icon:<Clock size={14}/>, color:'var(--text-muted)', label:log.action };
        return (
          <div key={log._id||i} className="timeline-item">
            <div className="timeline-left">
              <div className="timeline-dot" style={{borderColor:meta.color,color:meta.color}}>
                {meta.icon}
              </div>
              <div className="timeline-line"/>
            </div>
            <div className="timeline-content">
              <div className="timeline-text">
                <strong style={{color:'var(--text-primary)'}}>{log.user?.name || 'Someone'}</strong>
                {' '}{meta.label}
                {log.task && <span style={{color:'var(--accent-text)',marginLeft:4}}>· {log.task?.title || log.task?.taskNumber && `#${log.task.taskNumber}`}</span>}
                {log.meta?.from && log.meta?.to && (
                  <span style={{color:'var(--text-muted)',fontSize:'.78rem',display:'block',marginTop:2}}>
                    {log.meta.from} → {log.meta.to}
                  </span>
                )}
              </div>
              <div className="timeline-meta">{formatRelativeTime(log.createdAt)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
