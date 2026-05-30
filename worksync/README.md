# WorkSync Backend — Setup Guide

## Step 1 — Get your MongoDB Atlas connection string

1. Go to **https://cloud.mongodb.com** and sign in
2. Click your cluster name (e.g. **Cluster0**)
3. Click the **Connect** button
4. Choose **Drivers**
5. Set Driver = **Node.js**, Version = **5.5 or later**
6. Copy the connection string — it looks like this:

```
mongodb+srv://nanthini:<db_password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

7. Replace `<db_password>` with your real password
8. Add `/worksync` before the `?` to name your database:

```
mongodb+srv://nanthini:mypassword@cluster0.abc123.mongodb.net/worksync?retryWrites=true&w=majority&appName=Cluster0
```

---

## Step 2 — Whitelist your IP address

1. In Atlas → left sidebar → **Network Access**
2. Click **Add IP Address**
3. Click **Allow access from anywhere** → fills in `0.0.0.0/0`
4. Click **Confirm**

> Without this step you will get a connection timeout error.

---

## Step 3 — Create your .env file

```bash
cd worksync
copy .env.example .env        # Windows
# OR
cp .env.example .env          # Mac / Linux
```

Open `.env` and fill in:

```env
MONGODB_URI=mongodb+srv://nanthini:mypassword@cluster0.abc123.mongodb.net/worksync?retryWrites=true&w=majority&appName=Cluster0

JWT_SECRET=paste_a_long_random_string_here
```

Need a JWT secret? Run:
```bash
npm run secret
```

---

## Step 4 — Test your connection

```bash
npm install
npm run test:connection
```

You should see:
```
✅  Connection SUCCESSFUL
    Host : cluster0.abc123.mongodb.net
    DB   : worksync
Collections: (none yet - will be created on first write)

All good! Run: npm run dev
```

---

## Step 5 — Seed sample data (optional)

Creates 3 users, 1 project, 6 tasks, and 3 comments:

```bash
npm run seed
```

Login credentials after seeding:
| Role      | Email                    | Password    |
|-----------|--------------------------|-------------|
| ADMIN     | admin@worksync.dev       | password123 |
| DEVELOPER | dev@worksync.dev         | password123 |
| REVIEWER  | reviewer@worksync.dev    | password123 |

---

## Step 6 — Start the server

```bash
npm run dev          # development (auto-restart)
# or
npm start            # production
```

Visit: **http://localhost:5000/health** — should return `{"success":true,...}`

---

## Troubleshooting

### "ENOTFOUND" or wrong hostname
- Copy the URI directly from Atlas → Connect dialog
- Do not type it manually

### "Authentication failed"
- Check your password in Atlas → Database Access
- If password has special characters (`@`, `#`, `!`), URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `!` → `%21`

### "Connection timed out"
- Your IP is not whitelisted
- Go to Atlas → Network Access → Add IP Address → Allow from anywhere

### "Cluster is paused"
- Free tier clusters auto-pause after 60 days of inactivity
- Go to Atlas → your cluster → click **Resume**

### Still not working?
Run the detailed diagnostics:
```bash
npm run test:connection
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Quick endpoints
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/auth/me | Get own profile |
| GET | /api/projects | List your projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Project details + members |
| POST | /api/projects/:id/members | Add member by email |
| GET | /api/projects/:id/reviewers | List reviewers in project |
| GET | /api/projects/:id/tasks | List tasks |
| POST | /api/projects/:id/tasks | Create task |
| PATCH | /api/projects/:pid/tasks/:tid/status | Change task status |
| POST | /api/projects/:pid/tasks/:tid/reviews/submit | Submit for code review |
| POST | /api/projects/:pid/tasks/:tid/reviews/:rid/action | Approve / request changes |
| GET | /api/github/pr-status?url=<PR_URL> | Fetch live GitHub PR status |
| GET | /health | Server health check |

---

## Role Permissions

| Action | ADMIN | DEVELOPER | REVIEWER |
|--------|:-----:|:---------:|:--------:|
| View tasks | ✅ | ✅ | ✅ |
| Create / edit tasks | ✅ | ✅ | ❌ |
| Submit for review | ✅ | ✅ | ❌ |
| Approve / reject | ✅ | ❌ | ✅ |
| Manage team members | ✅ | ❌ | ❌ |

---

## Running Both Frontend and Backend

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd worksync
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd worksync-frontend
npm start
# Runs on http://localhost:3000
```
