import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { projectsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime, truncate, isOverdue } from '../utils/helpers';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list({ limit: 12 })
      .then(({ data }) => setProjects(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const active = projects.filter(p => p.status === 'ACTIVE').length;

  const stats = [
    {
      label: 'Active Projects',
      value: active,
      icon: <FolderKanban size={18} />,
      iconBg: 'rgba(99,102,241,0.15)',
      iconColor: '#a5b4fc',
    },
    {
      label: 'Total Projects',
      value: projects.length,
      icon: <CheckCircle2 size={18} />,
      iconBg: 'rgba(16,185,129,0.15)',
      iconColor: '#6ee7b7',
    },
    {
      label: 'Tasks Due Today',
      value: '—',
      icon: <Clock size={18} />,
      iconBg: 'rgba(245,158,11,0.15)',
      iconColor: '#fcd34d',
    },
    {
      label: 'Overdue',
      value: '—',
      icon: <AlertTriangle size={18} />,
      iconBg: 'rgba(239,68,68,0.15)',
      iconColor: '#fca5a5',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6 }}>
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem' }}>
          Here's what's happening across your projects today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <span className="stat-label">{s.label}</span>
              <div
                className="stat-icon"
                style={{ background: s.iconBg, color: s.iconColor }}
              >
                {s.icon}
              </div>
            </div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      {/* Projects header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-.02em' }}>Recent Projects</h2>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="spinner-center"><div className="spinner spinner-lg" /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderKanban size={28} /></div>
          <h3>No projects yet</h3>
          <p>Create your first project to start collaborating with your team</p>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <div
              key={p._id}
              className="card card-hover"
              onClick={() => navigate(`/projects/${p._id}`)}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'ui-monospace,monospace',
                    fontSize: '.7rem', fontWeight: 800,
                    background: 'var(--accent-dim)',
                    color: 'var(--accent-text)',
                    padding: '2px 8px', borderRadius: 5,
                    border: '1px solid var(--accent-glow)',
                  }}>
                    {p.key}
                  </span>
                  <span style={{
                    fontSize: '.68rem', fontWeight: 700,
                    color: p.status === 'ACTIVE' ? 'var(--green-text)' : 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '.04em',
                  }}>
                    {p.status}
                  </span>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
              </div>

              {/* Name */}
              <h3 style={{
                fontSize: '.95rem', fontWeight: 700,
                letterSpacing: '-.01em',
                marginBottom: p.description ? '.4rem' : '.75rem',
              }}>
                {p.name}
              </h3>

              {/* Description */}
              {p.description && (
                <p style={{
                  fontSize: '.8rem', color: 'var(--text-secondary)',
                  marginBottom: '.85rem', lineHeight: 1.55,
                }}>
                  {truncate(p.description, 80)}
                </p>
              )}

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingTop: '.65rem', borderTop: '1px solid var(--border)',
                marginTop: 'auto',
              }}>
                <div className="avatar avatar-sm">
                  {p.owner?.name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                  {p.owner?.name} · {formatRelativeTime(p.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
