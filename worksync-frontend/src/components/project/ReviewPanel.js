import React, { useState } from 'react';
import { CheckCircle, XCircle, GitPullRequest, Plus, Star, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewsApi, projectExtApi } from '../../services/api';
import StarRating from '../common/StarRating';
import PRStatusWidget from './PRStatusWidget';
import { getInitials, formatRelativeTime, getErrorMessage } from '../../utils/helpers';

const ACTION_META = {
  SUBMITTED:         { label: 'Submitted for review', color: 'var(--accent-text)',  bg: 'var(--accent-dim)' },
  APPROVED:          { label: 'Approved',             color: 'var(--green-text)',   bg: 'var(--green-dim)' },
  CHANGES_REQUESTED: { label: 'Changes requested',    color: 'var(--orange-text)',  bg: 'var(--orange-dim)' },
};

export default function ReviewPanel({ projectId, taskId, task, reviews, onReviewsChange, myRole, currentUser }) {
  const [githubPR, setGithubPR]   = useState(task?.githubPR || '');
  const [reviewerIds, setReviewerIds] = useState([]);
  const [minApprovals, setMinApprovals] = useState(1);
  const [reviewComment, setReviewComment] = useState('');
  const [codeQuality, setCodeQuality] = useState(0);
  const [readability, setReadability] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewers, setReviewers] = useState([]);
  const [loadedReviewers, setLoadedReviewers] = useState(false);

  const loadReviewers = async () => {
    if (loadedReviewers) return;
    try {
      const { data } = await projectExtApi.getReviewers(projectId);
      setReviewers(data.reviewers || []);
      setLoadedReviewers(true);
    } catch {}
  };

  const toggleReviewer = (uid) => {
    setReviewerIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await reviewsApi.submit(projectId, taskId, { githubPR, reviewerIds, minApprovals });
      onReviewsChange([data.review, ...reviews]);
      toast.success('Submitted for review');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  const handleAction = async (reviewId, action) => {
    try {
      const { data } = await reviewsApi.action(projectId, taskId, reviewId, { action, comment: reviewComment, codeQuality, readability });
      onReviewsChange(reviews.map(r => r._id === reviewId ? data.review : r));
      setReviewComment(''); setCodeQuality(0); setReadability(0);
      toast.success(action === 'APPROVED' ? '✅ Approved!' : '🔄 Changes requested');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const pendingReview = reviews.find(r => r.status === 'PENDING');
  const canSubmit = (myRole === 'ADMIN' || myRole === 'DEVELOPER') && task?.status !== 'REVIEW' && task?.status !== 'DONE';
  const canReview = (myRole === 'ADMIN' || myRole === 'REVIEWER');

  return (
    <div>
      {/* Submit for review — developer/admin */}
      {canSubmit && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: '.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
            <GitPullRequest size={15} style={{ color: 'var(--accent-text)' }}/> Submit for Code Review
          </h3>

          <div className="form-group">
            <label className="form-label">GitHub PR URL</label>
            <input className="input" placeholder="https://github.com/org/repo/pull/42"
              value={githubPR} onChange={e => setGithubPR(e.target.value)}/>
          </div>

          {/* Reviewer selection */}
          <div className="form-group">
            <label className="form-label">
              Assign Reviewers
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }} onClick={loadReviewers}>
                {loadedReviewers ? null : <Plus size={11}/>} {loadedReviewers ? 'Loaded' : 'Load reviewers'}
              </button>
            </label>
            {loadedReviewers && (
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: 4 }}>
                {reviewers.map(m => (
                  <button key={m._id} type="button"
                    onClick={() => toggleReviewer(m.user._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 99,
                      border: `2px solid ${reviewerIds.includes(m.user._id) ? 'var(--accent)' : 'var(--border)'}`,
                      background: reviewerIds.includes(m.user._id) ? 'var(--accent-dim)' : 'var(--bg-raised)',
                      cursor: 'pointer', transition: 'all var(--t)', fontSize: '.8rem', fontWeight: 500,
                      color: reviewerIds.includes(m.user._id) ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}>
                    <div className="avatar avatar-sm">{getInitials(m.user.name)}</div>
                    {m.user.name}
                  </button>
                ))}
                {reviewers.length === 0 && <p className="text-sm text-3">No reviewers in this project yet</p>}
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '.5rem' }}>
            <label className="form-label">Min. Approvals Required</label>
            <input className="input" type="number" min={1} max={10} value={minApprovals}
              onChange={e => setMinApprovals(Number(e.target.value))} style={{ width: 80 }}/>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner"/> : <><GitPullRequest size={13}/> Submit for Review</>}
          </button>
        </div>
      )}

      {/* PR status widget */}
      {task?.githubPR && (
        <div style={{ marginBottom: '1rem' }}>
          <PRStatusWidget prUrl={task.githubPR}/>
        </div>
      )}

      {/* Pending review — reviewer action */}
      {pendingReview && canReview && (
        <div className="card" style={{ marginBottom: '1rem', borderColor: 'var(--purple)', borderWidth: 1.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
            <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--purple-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
              🔍 Review In Progress
            </h3>
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
              {pendingReview.reviewers?.filter(r => r.status === 'APPROVED').length} / {pendingReview.minApprovals} approvals
            </span>
          </div>

          {/* Reviewer statuses */}
          {pendingReview.reviewers?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '.85rem' }}>
              {pendingReview.reviewers.map(r => (
                <div key={r._id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99, fontSize: '.75rem', fontWeight: 600,
                  background: r.status === 'APPROVED' ? 'var(--green-dim)' : r.status === 'CHANGES_REQUESTED' ? 'var(--red-dim)' : 'var(--bg-overlay)',
                  color: r.status === 'APPROVED' ? 'var(--green-text)' : r.status === 'CHANGES_REQUESTED' ? 'var(--red-text)' : 'var(--text-secondary)',
                }}>
                  <div className="avatar avatar-sm">{getInitials(r.user?.name)}</div>
                  {r.user?.name}
                  {r.status !== 'PENDING' && <span>· {r.status.replace('_', ' ')}</span>}
                  {r.avgScore && <span>· ⭐{r.avgScore.toFixed(1)}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Score inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '.75rem' }}>
            <StarRating label="Code Quality" value={codeQuality} onChange={setCodeQuality}/>
            <StarRating label="Readability"  value={readability}  onChange={setReadability}/>
          </div>

          <div className="form-group">
            <label className="form-label">Review Comment</label>
            <textarea className="input" rows={2} placeholder="Add your review feedback…"
              value={reviewComment} onChange={e => setReviewComment(e.target.value)}/>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success btn-sm" onClick={() => handleAction(pendingReview._id, 'APPROVED')}>
              <CheckCircle size={14}/> Approve
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleAction(pendingReview._id, 'CHANGES_REQUESTED')}>
              <XCircle size={14}/> Request Changes
            </button>
          </div>
        </div>
      )}

      {/* Review history */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
        {reviews.map(r => (
          <div key={r._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="avatar avatar-sm">{getInitials(r.submittedBy?.name)}</div>
                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{r.submittedBy?.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {r.overallScore != null && (
                  <span style={{ fontSize: '.75rem', color: 'var(--yellow-text)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={11} fill="currentColor"/> {r.overallScore.toFixed(1)}/5
                  </span>
                )}
                <span style={{
                  padding: '2px 8px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700,
                  background: r.status === 'APPROVED' ? 'var(--green-dim)' : r.status === 'PENDING' ? 'var(--purple-dim)' : 'var(--red-dim)',
                  color: r.status === 'APPROVED' ? 'var(--green-text)' : r.status === 'PENDING' ? 'var(--purple-text)' : 'var(--red-text)',
                }}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* History */}
            {r.history?.map((h, i) => {
              const hm = ACTION_META[h.action] || ACTION_META.SUBMITTED;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '.65rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div className="avatar avatar-sm">{getInitials(h.reviewer?.name)}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{h.reviewer?.name}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 99, fontSize: '.65rem', fontWeight: 700, background: hm.bg, color: hm.color }}>
                        {hm.label}
                      </span>
                    </div>
                    {h.comment && <p style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{h.comment}</p>}
                    <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatRelativeTime(h.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <GitPullRequest size={36}/>
            <h3>No reviews yet</h3>
            <p>Submit the task for review when it's ready</p>
          </div>
        )}
      </div>
    </div>
  );
}
