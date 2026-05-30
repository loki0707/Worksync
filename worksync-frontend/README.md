# WorkSync Frontend

React 18 frontend for WorkSync — a collaborative workflow and task management system.

## Tech Stack

- **React 18** with React Router v6
- **Axios** for API calls with JWT interceptor
- **Socket.IO client** for real-time updates
- **Recharts** for analytics charts
- **React Hot Toast** for notifications
- **Lucide React** for icons
- Custom CSS design system (dark theme, no Tailwind needed)

---

## Folder Structure

```
src/
├── App.js                          # Router setup, protected/public routes
├── index.js                        # React entry point
├── index.css                       # Full design system (tokens, components)
├── context/
│   └── AuthContext.js              # Global auth state + JWT management
├── services/
│   ├── api.js                      # Axios instance + all API modules
│   └── socket.js                   # Socket.IO client setup
├── hooks/
│   └── useNotifications.js         # Notification state + real-time listener
├── utils/
│   └── helpers.js                  # Date formatting, badge classes, etc.
├── components/
│   └── layout/
│       └── AppLayout.js            # Sidebar + Header shell (Outlet)
└── pages/
    ├── LoginPage.js
    ├── RegisterPage.js
    ├── DashboardPage.js
    ├── ProjectsPage.js             # Project list + create modal
    ├── ProjectDetailPage.js        # Kanban board + list + members tabs
    ├── TaskDetailPage.js           # Comments, reviews, attachments, history
    ├── NotificationsPage.js
    ├── AnalyticsPage.js            # Charts: status, priority, velocity, productivity
    └── ProfilePage.js
```

---

## Setup & Run

### 1. Install dependencies
```bash
cd worksync-frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Start the frontend
```bash
npm start
```

Opens at `http://localhost:3000`

> The `"proxy": "http://localhost:5000"` in `package.json` handles CORS in development.

---

## Running Both Together

### Terminal 1 — Backend
```bash
cd worksync-backend
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

### Terminal 2 — Frontend
```bash
cd worksync-frontend
cp .env.example .env
npm install
npm start
```

---

## Features Implemented

| Feature                     | Location                         |
|-----------------------------|----------------------------------|
| Register / Login            | LoginPage, RegisterPage          |
| JWT auth with auto-refresh  | AuthContext + api.js interceptor |
| Dashboard overview          | DashboardPage                    |
| Project list + create       | ProjectsPage                     |
| Kanban board                | ProjectDetailPage (board tab)    |
| Task list + table view      | ProjectDetailPage (list tab)     |
| Team members view           | ProjectDetailPage (members tab)  |
| Task detail — full view     | TaskDetailPage                   |
| Comments                    | TaskDetailPage (comments tab)    |
| Code review workflow        | TaskDetailPage (reviews tab)     |
| File attachments            | TaskDetailPage (attachments tab) |
| Status history              | TaskDetailPage (history tab)     |
| Real-time task updates      | Socket.IO in ProjectDetailPage   |
| Real-time notifications     | useNotifications hook + header   |
| Notifications inbox         | NotificationsPage                |
| Analytics + charts          | AnalyticsPage                    |
| AI health score             | AnalyticsPage                    |
| Profile + password change   | ProfilePage                      |

---

## Production Build

```bash
npm run build
```

Outputs to `build/` — serve with any static host (Vercel, Netlify, Nginx, etc.)

For Nginx, point root to `build/` and add:
```nginx
location / {
  try_files $uri /index.html;
}
```
