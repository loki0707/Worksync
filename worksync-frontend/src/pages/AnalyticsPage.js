import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsApi, aiApi } from '../services/api';
import { getInitials } from '../utils/helpers';

const STATUS_COLORS  = { TODO: '#545870', IN_PROGRESS: '#5b7cfa', REVIEW: '#a78bfa', DONE: '#34d399' };
const PRIORITY_COLORS = { LOW: '#545870', MEDIUM: '#fbbf24', HIGH: '#f87171' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [overview, setOverview]         = useState(null);
  const [productivity, setProductivity] = useState([]);
  const [velocity, setVelocity]         = useState([]);
  const [health, setHealth]             = useState(null);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    try {
      const [ovRes, prRes, vRes, hRes] = await Promise.all([
        analyticsApi.overview(projectId),
        analyticsApi.productivity(projectId),
        analyticsApi.velocity(projectId),
        aiApi.healthCheck(projectId),
      ]);
      setOverview(ovRes.data.analytics);
      setProductivity(prRes.data.productivity || []);
      setVelocity(vRes.data.velocity || []);
      setHealth(hRes.data);
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="empty-state"><div className="spinner spinner-lg" /></div>;
  if (!overview) return <div className="empty-state"><p>No data available</p></div>;

  // Prepare chart data
  const statusData = Object.entries(overview.tasksByStatus).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(overview.tasksByPriority).map(([name, value]) => ({ name, value }));
  const velocityData = velocity.map(v => ({
    date: new Date(v.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    completed: v.count,
  }));

  const healthColor = health?.healthScore >= 80 ? 'var(--green)'
    : health?.healthScore >= 60 ? 'var(--yellow)'
    : 'var(--red)';

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1rem' }}
        onClick={() => navigate(`/projects/${projectId}`)}>
        <ArrowLeft size={14} /> Back to project
      </button>

      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 4 }}>
            Project performance overview
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Tasks',     value: overview.totalTasks,     icon: <Clock size={18} />,        color: 'var(--accent)' },
          { label: 'Completed',       value: overview.completedTasks, icon: <CheckCircle2 size={18} />, color: 'var(--green)' },
          { label: 'Pending',         value: overview.pendingTasks,   icon: <AlertTriangle size={18} />,color: 'var(--yellow)' },
          { label: 'Team Members',    value: overview.memberCount,    icon: <Users size={18} />,        color: 'var(--purple)' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="stat-label">{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Completion rate + Health score */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Completion Rate</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--green)" strokeWidth="8"
                  strokeDasharray={`${overview.completionRate * 2.01} 201`}
                  strokeLinecap="round" />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1rem', fontWeight: 800,
                fontFamily: 'var(--font-display)',
              }}>
                {overview.completionRate}%
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                {overview.completedTasks} of {overview.totalTasks} tasks completed
              </p>
              <div className="progress-bar" style={{ width: 160 }}>
                <div className="progress-fill" style={{ width: `${overview.completionRate}%`, background: 'var(--green)' }} />
              </div>
            </div>
          </div>
        </div>

        {health && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem' }}>AI Health Score</h3>
              <span style={{
                fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: healthColor,
              }}>{health.healthScore} <span style={{ fontSize: '0.9rem' }}>{health.grade}</span></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {health.insights?.map((insight, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                  <span>{insight.type === 'SUCCESS' ? '✅' : insight.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{insight.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: '1.75rem' }}>
        {/* Tasks by status */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#888'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by priority */}
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity chart */}
      {velocityData.length > 0 && (
        <div className="card" style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            <TrendingUp size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Completion Velocity (Last 30 days)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="completed" stroke="var(--accent)" strokeWidth={2}
                dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Team productivity */}
      {productivity.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Team Productivity</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Assigned</th>
                  <th>Completed</th>
                  <th>In Progress</th>
                  <th>In Review</th>
                  <th>Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {productivity.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{getInitials(p.user?.name)}</div>
                        <div>
                          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.user?.name}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{p.totalAssigned}</td>
                    <td style={{ color: 'var(--green)' }}>{p.completed}</td>
                    <td style={{ color: 'var(--accent)' }}>{p.inProgress}</td>
                    <td style={{ color: 'var(--purple)' }}>{p.inReview}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className="progress-fill" style={{ width: `${p.completionRate}%` }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {p.completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
