# AIFT Playbook v15 — Tracking Setup

## How it works

| What | Where it goes | How to view it |
|---|---|---|
| Page views, sessions, time on page, heatmaps, recordings | Microsoft Clarity | clarity.microsoft.com (IBM login) |
| Feedback (ratings + comments), artifact clicks, session summaries | IBM GitHub Issues (private repo) | analytics-dashboard.html on the site |

---

## Step 1 — Create the analytics repo on IBM GitHub (2 min)

1. Go to **github.ibm.com** → **New repository**
2. Name it `aift-playbook-analytics` (or anything you like)
3. Set it to **Private**
4. Create two labels in the repo: `aift-session` and `aift-feedback`
   - Go to Issues → Labels → New label for each

---

## Step 2 — Create a Personal Access Token (2 min)

1. **github.ibm.com** → top-right avatar → **Settings**
2. Left sidebar → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Name: `AIFT Playbook Tracker`
5. Expiration: 1 year (or No expiration)
6. Scopes: check **`repo`** (this gives Issues write access to your private repo)
7. Click **Generate token** — copy it immediately (shown only once)

---

## Step 3 — Paste into tracking-config.js

Open `js/tracking-config.js` and fill in:

```js
window.AIFT_CONFIG = {
    clarityProjectId: 'xn0z79mkef',           // already set

    githubApiBase: 'https://github.ibm.com/api/v3',
    githubOwner:   'your-ibm-github-username', // e.g. 'claire-liu'
    githubRepo:    'aift-playbook-analytics',  // repo you created in Step 1
    githubToken:   'ghp_xxxxxxxxxxxxxxxxxxxx', // PAT from Step 2

    dashboardPassword: 'orchestration'
};
```

Commit and push. Tracking is live.

---

## How data flows

**Per session** (on tab close or every 5 minutes):
- One GitHub Issue is created with label `aift-session`
- Contains: pages visited, time on each page, links/artifacts clicked
- Machine-readable JSON embedded in a hidden comment in the Issue body

**Per feedback submission** (immediate):
- One GitHub Issue is created with label `aift-feedback`
- Contains: star rating, comment, page it was submitted from

---

## Viewing the dashboard

Navigate to: `your-github-pages-url/analytics-dashboard.html`

Password: **orchestration**

Once the token is configured, the dashboard reads all Issues from the analytics repo and aggregates across every visitor — page views, time on page, artifact clicks, and all feedback responses with ratings.

Without the token it falls back to showing data from the current browser only.

---

## Clarity (heatmaps + session recordings)

Go to **clarity.microsoft.com** and sign in with your IBM Microsoft account.
Your project ID is `xn0z79mkef` — it's already wired into the site.
