import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ws_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ws_token');
      localStorage.removeItem('ws_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register:       (d)    => api.post('/auth/register', d),
  login:          (d)    => api.post('/auth/login', d),
  getMe:          ()     => api.get('/auth/me'),
  updateMe:       (d)    => api.put('/auth/me', d),
  changePassword: (d)    => api.put('/auth/change-password', d),
};

export const projectsApi = {
  list:         (p)       => api.get('/projects', { params: p }),
  get:          (id)      => api.get(`/projects/${id}`),
  create:       (d)       => api.post('/projects', d),
  update:       (id,d)    => api.put(`/projects/${id}`, d),
  delete:       (id)      => api.delete(`/projects/${id}`),
  addMember:    (id,d)    => api.post(`/projects/${id}/members`, d),
  updateMember: (id,uid,d)=> api.put(`/projects/${id}/members/${uid}`, d),
  removeMember: (id,uid)  => api.delete(`/projects/${id}/members/${uid}`),
};

export const tasksApi = {
  list:         (pid,p)        => api.get(`/projects/${pid}/tasks`, { params: p }),
  get:          (pid,tid)      => api.get(`/projects/${pid}/tasks/${tid}`),
  create:       (pid,d)        => api.post(`/projects/${pid}/tasks`, d),
  update:       (pid,tid,d)    => api.put(`/projects/${pid}/tasks/${tid}`, d),
  updateStatus: (pid,tid,s)    => api.patch(`/projects/${pid}/tasks/${tid}/status`, { status: s }),
  delete:       (pid,tid)      => api.delete(`/projects/${pid}/tasks/${tid}`),
  restore:      (pid,tid)      => api.patch(`/projects/${pid}/tasks/${tid}/restore`),
  versions:     (pid,tid)      => api.get(`/projects/${pid}/tasks/${tid}/versions`),
};

export const commentsApi = {
  list:   (pid,tid)        => api.get(`/projects/${pid}/tasks/${tid}/comments`),
  create: (pid,tid,d)      => api.post(`/projects/${pid}/tasks/${tid}/comments`, d),
  update: (pid,tid,id,d)   => api.put(`/projects/${pid}/tasks/${tid}/comments/${id}`, d),
  delete: (pid,tid,id)     => api.delete(`/projects/${pid}/tasks/${tid}/comments/${id}`),
};

export const reviewsApi = {
  list:        (pid,tid)          => api.get(`/projects/${pid}/tasks/${tid}/reviews`),
  submit:      (pid,tid,d)        => api.post(`/projects/${pid}/tasks/${tid}/reviews/submit`, d),
  action:      (pid,tid,rid,d)    => api.post(`/projects/${pid}/tasks/${tid}/reviews/${rid}/action`, d),
  addReviewer: (pid,tid,rid,d)    => api.post(`/projects/${pid}/tasks/${tid}/reviews/${rid}/add-reviewer`, d),
};

export const notificationsApi = {
  list:       (p)  => api.get('/notifications', { params: p }),
  markRead:   (id) => api.patch(`/notifications/${id}/read`),
  markAllRead:()   => api.patch('/notifications/read-all'),
  delete:     (id) => api.delete(`/notifications/${id}`),
};

export const activityApi = {
  list: (pid,p) => api.get(`/projects/${pid}/activity`, { params: p }),
};

export const analyticsApi = {
  overview:     (pid) => api.get(`/projects/${pid}/analytics/overview`),
  productivity: (pid) => api.get(`/projects/${pid}/analytics/productivity`),
  velocity:     (pid) => api.get(`/projects/${pid}/analytics/velocity`),
};

export const attachmentsApi = {
  list:   (pid,tid)     => api.get(`/projects/${pid}/tasks/${tid}/attachments`),
  upload: (pid,tid,frm) => api.post(`/projects/${pid}/tasks/${tid}/attachments`, frm, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (pid,tid,id)  => api.delete(`/projects/${pid}/tasks/${tid}/attachments/${id}`),
};

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
};

export const timeApi = {
  start:       (pid,tid)   => api.post(`/projects/${pid}/tasks/${tid}/time/start`),
  stop:        (pid,tid,d) => api.post(`/projects/${pid}/tasks/${tid}/time/stop`, d),
  taskLogs:    (pid,tid)   => api.get(`/projects/${pid}/tasks/${tid}/time`),
  userLogs:    (pid)       => api.get(`/projects/${pid}/time/user`),
};

export const leaderboardApi = {
  get: (pid) => api.get(`/projects/${pid}/leaderboard`),
};

export const aiApi = {
  suggestPriority: (pid,d) => api.post(`/projects/${pid}/ai/suggest-priority`, d),
  suggestAssignee: (pid)   => api.get(`/projects/${pid}/ai/suggest-assignee`),
  healthCheck:     (pid)   => api.get(`/projects/${pid}/ai/health-check`),
  taskBreakdown:   (pid,tid) => api.post(`/projects/${pid}/ai/tasks/${tid}/breakdown`),
};

// ─── Extended project APIs ────────────────────────────────────────────────────
export const projectExtApi = {
  getReviewers: (pid)           => api.get(`/projects/${pid}/reviewers`),
  addMemberByEmail: (pid, data) => api.post(`/projects/${pid}/members`, data),
  updateRole: (pid, uid, role)  => api.put(`/projects/${pid}/members/${uid}`, { role }),
  removeMember: (pid, uid)      => api.delete(`/projects/${pid}/members/${uid}`),
};

// ─── GitHub PR ────────────────────────────────────────────────────────────────
export const githubApi = {
  getPRStatus: (url) => api.get('/github/pr-status', { params: { url } }),
};
