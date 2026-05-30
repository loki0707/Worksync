import React, { useState, useCallback } from 'react';
import { GitPullRequest, GitMerge, GitBranchPlus, ExternalLink, RefreshCw, Plus, Minus, FileCode } from 'lucide-react';
import { githubApi } from '../../services/api';
import { formatRelativeTime, getErrorMessage } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUS_META = {
  OPEN:   { label: 'Open',   color: 'var(--green-text)',  bg: 'var(--green-dim)',  icon: <GitPullRequest size={13}/> },
  MERGED: { label: 'Merged', color: 'var(--purple-text)', bg: 'var(--purple-dim)', icon: <GitMerge size={13}/> },
  CLOSED: { label: 'Closed', color: 'var(--red-text)',    bg: 'var(--red-dim)',    icon: <GitPullRequest size={13}/> },
};

export default function PRStatusWidget({ prUrl }) {
  const [pr, setPr]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!prUrl) return;
    setLoading(true);
    try {
      const { data } = await githubApi.getPRStatus(prUrl);
      setPr(data.pr);
      setFetched(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally { setLoading(false); }
  }, [prUrl]);

  if (!prUrl) return null;

  const status = pr?.displayStatus;
  const meta = status ? STATUS_META[status] : null;

  return (
    <div style={{
      background: 'var(--bg-raised)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '.75rem 1rem', borderBottom: fetched ? '1px solid var(--border)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitPullRequest size={16} style={{ color: 'var(--accent-text)' }}/>
          <span style={{ fontWeight: 700, fontSize: '.85rem' }}>Pull Request</span>
          {meta && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: 99, fontSize: '.68rem', fontWeight: 700, background: meta.bg, color: meta.color }}>
              {meta.icon} {meta.label}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchStatus} disabled={loading}>
            {loading ? <span className="spinner" style={{width:12,height:12}}/> : <><RefreshCw size={12}/> {fetched ? 'Refresh' : 'Check Status'}</>}
          </button>
          <a href={prUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={12}/> Open PR
          </a>
        </div>
      </div>

      {/* PR details */}
      {pr && (
        <div style={{ padding: '.85rem 1rem' }}>
          <p style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)', marginBottom: 8 }}>
            #{pr.number} {pr.title}
            {pr.draft && <span style={{ marginLeft: 8, fontSize: '.68rem', background: 'var(--bg-overlay)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 4 }}>Draft</span>}
          </p>

          {/* Branches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <GitBranchPlus size={12} style={{ color: 'var(--text-muted)' }}/>
            <span className="mono text-xs" style={{
              background: 'var(--bg-overlay)', padding: '1px 7px', borderRadius: 4,
              color: 'var(--accent-text)', border: '1px solid var(--border)',
            }}>{pr.headBranch}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>→</span>
            <span className="mono text-xs" style={{
              background: 'var(--bg-overlay)', padding: '1px 7px', borderRadius: 4,
              color: 'var(--text-secondary)', border: '1px solid var(--border)',
            }}>{pr.baseBranch}</span>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {pr.additions != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', color: 'var(--green-text)' }}>
                <Plus size={11}/> {pr.additions}
              </span>
            )}
            {pr.deletions != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', color: 'var(--red-text)' }}>
                <Minus size={11}/> {pr.deletions}
              </span>
            )}
            {pr.changedFiles != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', color: 'var(--text-muted)' }}>
                <FileCode size={11}/> {pr.changedFiles} file{pr.changedFiles !== 1 ? 's' : ''}
              </span>
            )}
            <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
              by <strong style={{ color: 'var(--text-secondary)' }}>{pr.author}</strong>
              {' · '}{formatRelativeTime(pr.createdAt)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
