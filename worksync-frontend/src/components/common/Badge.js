import React from 'react';
const statusMap   = { TODO:'badge-todo', IN_PROGRESS:'badge-progress', REVIEW:'badge-review', DONE:'badge-done' };
const priorityMap = { LOW:'badge-low', MEDIUM:'badge-medium', HIGH:'badge-high' };
export function StatusBadge({ status }) {
  const labels = { TODO:'To Do', IN_PROGRESS:'In Progress', REVIEW:'In Review', DONE:'Done' };
  return <span className={`badge ${statusMap[status]||'badge-todo'}`}>{labels[status]||status}</span>;
}
export function PriorityBadge({ priority }) {
  return <span className={`badge ${priorityMap[priority]||'badge-low'}`}>{priority}</span>;
}
