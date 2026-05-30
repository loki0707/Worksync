# WorkSync Upgrade Guide — Team Management + Code Review + GitHub PR

## What Was Changed

### Backend

| File | Change |
|------|--------|
| `models/ProjectMember.js` | Added `DEVELOPER` and `REVIEWER` roles (was `MEMBER` only). Added `invitedBy` field. |
| `middleware/authorization.js` | Added `requireDeveloper` and `requireReviewer` guards alongside existing ones. |
| `controllers/projectController.js` | Invite by **email** (`/members` accepts `{ email }` or `{ userId }`). New `getReviewers` endpoint. Role validation updated. |
| `controllers/reviewController.js` | Role guards: only DEVELOPER/ADMIN can submit; only REVIEWER/ADMIN can approve/reject. |
| `controllers/githubController.js` | **NEW** — fetches live PR status from GitHub API (`state`, `merged`, `additions`, `deletions`, etc.) |
| `routes/taskRoutes.js` | All write operations now require `requireDeveloper` — REVIEWERs can only read. |
| `routes/projectRoutes.js` | Added `GET /reviewers` route. |
| `routes/githubRoutes.js` | **NEW** — `GET /api/github/pr-status?url=<pr_url>` |

### Frontend

| File | Change |
|------|--------|
| `components/project/TeamPanel.js` | **NEW** — Full team management UI. Invite by email, assign roles with dropdown, remove members. |
| `components/project/PRStatusWidget.js` | **NEW** — Shows live GitHub PR status (Open/Merged/Closed), branch names, +/- stats. |
| `components/project/ReviewPanel.js` | **NEW** — Role-aware review UI. Developers see "Submit for Review", Reviewers see approve/reject with star ratings. |
| `pages/ProjectDetailPage.js` | Added **Team tab**, role badge on header, role-aware task creation (REVIEWERs cannot create tasks). |
| `pages/TaskDetailPage.js` | Integrated ReviewPanel, auto-save description, role-aware status dropdown. |
| `services/api.js` | Added `projectExtApi` (email invite, role update) and `githubApi` (PR status). |

---

## Role Permission Matrix

| Action | ADMIN | DEVELOPER | REVIEWER |
|--------|-------|-----------|----------|
| View tasks | ✅ | ✅ | ✅ |
| Create / edit tasks | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ |
| Change task status | ✅ | ✅ | ❌ |
| Submit for review | ✅ | ✅ | ❌ |
| Approve / reject review | ✅ | ❌ | ✅ |
| Add review score | ✅ | ❌ | ✅ |
| Manage members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Override review | ✅ | ❌ | ❌ |

---

## Migration Steps

### 1. Existing members get DEVELOPER role
Your existing `ProjectMember` records use `role: 'MEMBER'`. Run this one-time migration:

```js
// In MongoDB shell or a migration script
db.projectmembers.updateMany(
  { role: 'MEMBER' },
  { $set: { role: 'DEVELOPER' } }
);
```

### 2. Add GITHUB_TOKEN to .env (optional but recommended)
```env
# Optional — increases GitHub API rate limit from 60 to 5000 req/hr
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

Generate at: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained or classic (read-only public repos is sufficient).

### 3. Assign Reviewers to your project
Go to the **Team tab** on any project → Change a member's role to `Reviewer`.

### 4. Run the project
```bash
# Backend
cd worksync && npm run dev

# Frontend  
cd worksync-frontend && npm start
```

---

## New API Endpoints

### Add member by email
```http
POST /api/projects/:projectId/members
Authorization: Bearer <token>
Content-Type: application/json

{ "email": "reviewer@company.com", "role": "REVIEWER" }
```

### Get project reviewers
```http
GET /api/projects/:projectId/reviewers
Authorization: Bearer <token>
```

### Submit task for review
```http
POST /api/projects/:projectId/tasks/:taskId/reviews/submit
Authorization: Bearer <token>

{
  "githubPR": "https://github.com/org/repo/pull/42",
  "reviewerIds": ["userId1", "userId2"],
  "minApprovals": 2
}
```

### Approve / Request changes
```http
POST /api/projects/:projectId/tasks/:taskId/reviews/:reviewId/action
Authorization: Bearer <token>

{
  "action": "APPROVED",
  "comment": "Clean implementation, well tested",
  "codeQuality": 5,
  "readability": 4
}
```

### Check GitHub PR status
```http
GET /api/github/pr-status?url=https://github.com/org/repo/pull/42
Authorization: Bearer <token>
```

---

## Workflow

```
Developer creates task
        ↓
Developer works on task (IN_PROGRESS)
        ↓
Developer links GitHub PR + assigns reviewers
        ↓
Developer clicks "Submit for Review" → status = REVIEW
        ↓
Reviewer opens task → Review tab
        ↓
Reviewer checks PR status widget (live from GitHub)
        ↓
Reviewer rates (code quality + readability) + comments
        ↓
  APPROVE → task = DONE
  REQUEST CHANGES → task = IN_PROGRESS (developer fixes and re-submits)
```
