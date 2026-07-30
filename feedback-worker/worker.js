// AIFT Playbook — Feedback proxy (Cloudflare Worker)
// Stores feedback to IBM GitHub Issues.
// Secrets (set via wrangler secret put):
//   GITHUB_TOKEN  — IBM GitHub PAT with `repo` scope
//   GITHUB_OWNER  — IBM GitHub username
//   GITHUB_REPO   — analytics repo name
//   GITHUB_API_BASE — defaults to https://github.ibm.com/api/v3

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // ── POST /feedback  → store one feedback entry ────────────────────────────
    if (request.method === 'POST' && url.pathname === '/feedback') {
      try {
        const body = await request.json();
        const { rating, comment, page, pageTitle, session, ts } = body;

        if (!rating || rating < 1 || rating > 5) {
          return json({ error: 'rating required (1–5)' }, 400);
        }

        const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const date  = (ts || new Date().toISOString()).slice(0, 10);
        const title = `[feedback] ${stars} — ${pageTitle || page || 'site'} — ${date}`;

        const issueBody = [
          `**Rating:** ${stars} (${rating}/5)`,
          `**Page:** ${pageTitle || page || '—'}`,
          `**Time:** ${ts || new Date().toISOString()}`,
          ``,
          `### Comment`,
          comment || '_No comment provided_',
          ``,
          `<!-- AIFT_DATA`,
          JSON.stringify({ rating, comment: comment || '', page, pageTitle, session, ts }),
          `-->`
        ].join('\n');

        await ghPost(env, '/issues', { title, body: issueBody, labels: ['aift-feedback'] });

        return json({ ok: true });
      } catch (e) {
        console.error('feedback error:', e.message);
        return json({ error: e.message }, 500);
      }
    }

    // ── GET /feedback  → read all feedback for dashboard ─────────────────────
    if (request.method === 'GET' && url.pathname === '/feedback') {
      try {
        const issues = await ghGet(env, '/issues?labels=aift-feedback&state=open&per_page=100');

        const feedback = issues.map(issue => {
          const match = issue.body && issue.body.match(/<!-- AIFT_DATA\n([\s\S]*?)\n-->/);
          if (match) {
            try { return JSON.parse(match[1]); } catch {}
          }
          // fallback parsing
          const ratingMatch = issue.title.match(/\[feedback\] (★+)/);
          const commentMatch = issue.body && issue.body.match(/### Comment\n([\s\S]*?)(?:\n\n|$)/);
          const pageMatch    = issue.body && issue.body.match(/\*\*Page:\*\* (.+)/);
          return {
            rating:    ratingMatch    ? ratingMatch[1].length              : 0,
            comment:   commentMatch   ? commentMatch[1].trim()             : '',
            page:      pageMatch      ? pageMatch[1].trim()                : '—',
            pageTitle: pageMatch      ? pageMatch[1].trim()                : '—',
            ts:        issue.created_at
          };
        }).filter(Boolean);

        const avgRating = feedback.length
          ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1)
          : null;

        return json({ feedback, avgRating, count: feedback.length });
      } catch (e) {
        console.error('read feedback error:', e.message);
        return json({ error: e.message }, 500);
      }
    }

    return new Response('Not found', { status: 404, headers: CORS });
  }
};

// ── GitHub helpers ─────────────────────────────────────────────────────────────
function apiBase(env) {
  return (env.GITHUB_API_BASE || 'https://github.ibm.com/api/v3').replace(/\/$/, '');
}
function ghUrl(env, path) {
  return `${apiBase(env)}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`;
}
async function ghPost(env, path, body) {
  const res = await fetch(ghUrl(env, path), {
    method: 'POST',
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}
async function ghGet(env, path) {
  const res = await fetch(ghUrl(env, path), {
    headers: {
      'Authorization': `token ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}
