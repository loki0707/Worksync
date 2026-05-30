import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../services/api';
import { getSocket } from '../services/socket';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await notificationsApi.list({ limit: 30 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Listen for real-time notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(c => c + 1);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, refetch: fetch, markRead, markAllRead };
}
