import { formatDistanceToNow, format, isToday, isYesterday, isPast, isBefore, addHours } from 'date-fns';

export const formatRelativeTime = (date) => {
  if (!date) return '';
  try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
  catch { return ''; }
};

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
  } catch { return '—'; }
};

export const formatDateTime = (date) => {
  if (!date) return '';
  try { return format(new Date(date), 'MMM d, yyyy · h:mm a'); }
  catch { return ''; }
};

export const getInitials = (name='') =>
  name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);

export const getStatusLabel = (status) =>
  ({ TODO:'To Do', IN_PROGRESS:'In Progress', REVIEW:'In Review', DONE:'Done' }[status] || status);

export const getStatusClass = (status) =>
  ({ TODO:'badge-todo', IN_PROGRESS:'badge-progress', REVIEW:'badge-review', DONE:'badge-done' }[status] || 'badge-todo');

export const getPriorityClass = (priority) =>
  ({ LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high' }[priority] || 'badge-low');

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong';

export const truncate = (str, n=60) => {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k=1024, sizes=['B','KB','MB','GB'];
  const i=Math.floor(Math.log(bytes)/Math.log(k));
  return `${parseFloat((bytes/Math.pow(k,i)).toFixed(1))} ${sizes[i]}`;
};

export const formatSeconds = (s=0) => {
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
  if (h>0) return `${h}h ${m}m`;
  if (m>0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  try { return isPast(new Date(dueDate)); } catch { return false; }
};

export const isDueSoon = (dueDate) => {
  if (!dueDate) return false;
  try {
    const d = new Date(dueDate);
    return !isPast(d) && isBefore(d, addHours(new Date(), 24));
  } catch { return false; }
};
