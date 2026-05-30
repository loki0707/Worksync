import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, ChevronDown, Shield, Code2, Eye, Crown, Mail, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectExtApi, usersApi } from '../../services/api';
import { getInitials, getErrorMessage } from '../../utils/helpers';

const ROLE_META = {
  ADMIN:     { label: 'Admin',     icon: <Crown size={12}/>,   color: 'var(--yellow-text)',  bg: 'var(--yellow-dim)' },
  DEVELOPER: { label: 'Developer', icon: <Code2 size={12}/>,   color: 'var(--accent-text)',  bg: 'var(--accent-dim)' },
  REVIEWER:  { label: 'Reviewer',  icon: <Eye size={12}/>,     color: 'var(--green-text)',   bg: 'var(--green-dim)' },
};

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.DEVELOPER;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 99,
      fontSize: '.68rem', fontWeight: 700,
      background: m.bg, color: m.color,
    }}>
      {m.icon} {m.label}
    </span>
  );
}

function RoleDropdown({ currentRole, memberId, projectId, onUpdated, myRole }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const change = async (role) => {
    if (role === currentRole) { setOpen(false); return; }
    setLoading(true);
    try {
      const { data } = await projectExtApi.updateRole(projectId, memberId, role);
      onUpdated(data.membership);
      toast.success(`Role updated to ${role}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); setOpen(false); }
  };

  if (myRole !== 'ADMIN') return <RoleBadge role={currentRole}/>;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <RoleBadge role={currentRole}/>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)' }}/>
      </button>
      {open && (
        <div className="dropdown-menu" style={{ right: 'auto', left: 0, minWidth: 140 }}>
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <button key={role} className={`dropdown-item${role === currentRole ? ' active' : ''}`}
              style={{ color: role === currentRole ? meta.color : undefined }}
              onClick={() => change(role)}>
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamPanel({ projectId, members: initialMembers, myRole, onMembersChange }) {
  const [members, setMembers] = useState(initialMembers || []);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setMembers(initialMembers || []); }, [initialMembers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      const { data } = await projectExtApi.addMemberByEmail(projectId, { email: email.trim(), role });
      const updated = [...members, data.membership];
      setMembers(updated);
      onMembersChange?.(updated);
      setEmail(''); setShowForm(false);
      toast.success(`${data.membership.user.name} added as ${role}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this project?`)) return;
    try {
      await projectExtApi.removeMember(projectId, userId);
      const updated = members.filter(m => m.user._id !== userId);
      setMembers(updated);
      onMembersChange?.(updated);
      toast.success(`${userName} removed`);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const handleRoleUpdated = (updated) => {
    setMembers(prev => prev.map(m => m._id === updated._id ? updated : m));
  };

  const roleCount = (r) => members.filter(m => m.role === r).length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(ROLE_META).map(([r, meta]) => (
          <div key={r} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '.45rem .85rem', borderRadius: 'var(--r-lg)',
            background: meta.bg, border: `1px solid ${meta.color}22`,
          }}>
            <span style={{ color: meta.color }}>{meta.icon}</span>
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: meta.color }}>
              {roleCount(r)} {meta.label}{roleCount(r) !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Add member — ADMIN only */}
      {myRole === 'ADMIN' && (
        <div style={{ marginBottom: '1.25rem' }}>
          {!showForm ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <UserPlus size={14}/> Invite Member
            </button>
          ) : (
            <form onSubmit={handleAdd} style={{
              display: 'flex', gap: '.75rem', alignItems: 'flex-end',
              background: 'var(--bg-raised)', padding: '1rem', borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)', flexWrap: 'wrap',
            }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200, margin: 0 }}>
                <label className="form-label">Email address</label>
                <div className="input-group">
                  <Mail size={13} className="input-icon"/>
                  <input className="input" type="email" placeholder="colleague@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} autoFocus required/>
                </div>
              </div>
              <div className="form-group" style={{ width: 140, margin: 0 }}>
                <label className="form-label">Role</label>
                <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="DEVELOPER">Developer</option>
                  <option value="REVIEWER">Reviewer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', paddingBottom: 1 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={adding}>
                  {adding ? <span className="spinner"/> : <><UserPlus size={13}/> Add</>}
                </button>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>
                  <X size={14}/>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Member list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {members.map(m => (
          <div key={m._id} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '.75rem 1rem', background: 'var(--bg-raised)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
            transition: 'all var(--t)',
          }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div className="avatar avatar-md">{getInitials(m.user?.name)}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text-primary)' }}>
                {m.user?.name}
              </p>
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{m.user?.email}</p>
            </div>

            {/* Role */}
            <RoleDropdown
              currentRole={m.role}
              memberId={m.user._id}
              projectId={projectId}
              onUpdated={handleRoleUpdated}
              myRole={myRole}
            />

            {/* Remove — ADMIN only, cannot remove self if owner */}
            {myRole === 'ADMIN' && m.role !== 'ADMIN' && (
              <button className="btn-icon-sm" onClick={() => handleRemove(m.user._id, m.user.name)}
                title="Remove member">
                <Trash2 size={13} style={{ color: 'var(--red-text)' }}/>
              </button>
            )}
          </div>
        ))}

        {members.length === 0 && (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>No members yet. Invite your team.</p>
          </div>
        )}
      </div>
    </div>
  );
}
