import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Bell,
  User, LogOut, ChevronDown, Zap, Moon, Sun, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import CommandPalette from '../common/CommandPalette';
import useNotifications from '../../hooks/useNotifications';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import { useDarkMode } from '../../hooks/useDarkMode';
import { getInitials } from '../../utils/helpers';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpen: openCmd } = useCommandPalette();
  const [userMenu, setUserMenu] = useState(false);
  const { unreadCount } = useNotifications();
  const [dark, setDark] = useDarkMode();

  useKeyboardShortcuts([
    { key: 'k', meta: true, handler: () => openCmd(true) },
    { key: '/', handler: () => openCmd(true) },
  ]);

  const nav = [
    { to: '/dashboard',     icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/projects',      icon: <FolderKanban size={16} />,    label: 'Projects' },
    { to: '/notifications', icon: <Bell size={16} />,            label: 'Notifications', badge: unreadCount },
  ];

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <Zap size={15} color="#fff" />
          </div>
          <span className="sidebar-logo-text">WorkSync</span>
        </div>

        <div className="sidebar-section" style={{ flex: 1 }}>
          <span className="sidebar-label">Menu</span>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Search hint */}
        <div style={{ padding: '.25rem .75rem .5rem' }}>
          <button
            className="nav-item"
            style={{ width: '100%', color: 'var(--text-muted)', fontSize: '.78rem' }}
            onClick={() => openCmd(true)}
          >
            <Search size={13} />
            <span style={{ flex: 1 }}>Search…</span>
            <span className="kbd">⌘K</span>
          </button>
        </div>

        {/* User */}
        <div className="sidebar-bottom">
          <div style={{ position: 'relative' }}>
            <button className="user-card" onClick={() => setUserMenu(o => !o)}>
              <div className="avatar avatar-sm" style={{ position: 'relative' }}>
                {getInitials(user?.name)}
                <span className="user-status" />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p className="truncate" style={{ fontSize: '.82rem', fontWeight: 700, lineHeight: 1.3 }}>
                  {user?.name}
                </p>
                <p className="truncate text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {user?.email}
                </p>
              </div>
              <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>

            {userMenu && (
              <div
                className="dropdown-menu"
                style={{ bottom: 'calc(100% + 5px)', top: 'auto', left: 0, right: 0, minWidth: 'unset' }}
              >
                <button
                  className="dropdown-item"
                  onClick={() => { navigate('/profile'); setUserMenu(false); }}
                >
                  <User size={14} /> Profile
                </button>
                <div className="dropdown-sep" />
                <button
                  className="dropdown-item danger"
                  onClick={() => { logout(); navigate('/login'); }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Header ── */}
      <header className="header">
        <button className="header-search" onClick={() => openCmd(true)}>
          <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className="header-search-text">Search or jump to…</span>
          <span className="header-search-kbd">⌘K</span>
        </button>

        <div className="header-right">
          {/* Dark mode toggle */}
          <button
            className="header-btn"
            onClick={() => setDark(d => !d)}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notifications */}
          <NavLink to="/notifications" className="header-btn" style={{ position: 'relative', textDecoration: 'none' }}>
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                width: 7, height: 7, background: 'var(--accent)',
                borderRadius: '50%', animation: 'pulse 2s infinite',
              }} />
            )}
          </NavLink>

          {/* Avatar */}
          <button className="header-btn" onClick={() => navigate('/profile')}>
            <div className="avatar avatar-sm" style={{ position: 'relative' }}>
              {getInitials(user?.name)}
              <span className="user-status" />
            </div>
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}
