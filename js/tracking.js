// ============================================================================
// AIFT PLAYBOOK — TRACKING
// ============================================================================
// - Microsoft Clarity: injected automatically (heatmaps, recordings, sessions)
// - GitHub Issues: batches page views + clicks into one Issue per session,
//   written to a private IBM GitHub repo you control. Falls back gracefully
//   if token not yet configured.

(function () {
    'use strict';

    const cfg = window.AIFT_CONFIG || {};

    // ── Microsoft Clarity ─────────────────────────────────────────────────────
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script", cfg.clarityProjectId || 'xn0z79mkef');

    // ── Helpers ───────────────────────────────────────────────────────────────
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    function getSession() {
        let id = sessionStorage.getItem('aift_sid');
        if (!id) { id = generateId(); sessionStorage.setItem('aift_sid', id); }
        return id;
    }

    const SESSION_ID = getSession();
    const LOCAL_KEY  = 'aift_track_local';   // local archive
    const QUEUE_KEY  = 'aift_track_queue';   // unsent session events

    function localGet()  { try { return JSON.parse(localStorage.getItem(LOCAL_KEY)  || '[]'); } catch { return []; } }
    function queueGet()  { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)  || '[]'); } catch { return []; } }
    function localSave(d) { if (d.length > 3000) d = d.slice(-3000); try { localStorage.setItem(LOCAL_KEY,  JSON.stringify(d)); } catch {} }
    function queueSave(d) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(d)); } catch {} }

    function record(ev) {
        // Always save locally
        const local = localGet(); local.push(ev); localSave(local);
        // Add to flush queue
        const q = queueGet(); q.push(ev); queueSave(q);
    }

    // ── GitHub Issues API ─────────────────────────────────────────────────────
    function ghReady() {
        return cfg.githubToken &&
               cfg.githubToken !== 'PASTE_YOUR_PAT_HERE' &&
               cfg.githubOwner !== 'PASTE_YOUR_IBM_GITHUB_USERNAME' &&
               cfg.githubRepo  !== 'PASTE_YOUR_ANALYTICS_REPO_NAME';
    }

    function ghApiUrl(path) {
        const base = (cfg.githubApiBase || 'https://github.ibm.com/api/v3').replace(/\/$/, '');
        return `${base}/repos/${cfg.githubOwner}/${cfg.githubRepo}${path}`;
    }

    async function ghPost(path, body) {
        const res = await fetch(ghApiUrl(path), {
            method: 'POST',
            headers: {
                'Authorization': 'token ' + cfg.githubToken,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('GitHub API error: ' + res.status);
        return res.json();
    }

    async function ghGet(path) {
        const res = await fetch(ghApiUrl(path), {
            headers: {
                'Authorization': 'token ' + cfg.githubToken,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!res.ok) throw new Error('GitHub API error: ' + res.status);
        return res.json();
    }

    // ── Flush session queue to a single GitHub Issue ──────────────────────────
    let flushing = false;
    async function flushToGitHub() {
        if (!ghReady() || flushing) return;
        const q = queueGet();
        if (!q.length) return;
        flushing = true;

        const pageViews  = q.filter(e => e.type === 'page_view');
        const timeEvents = q.filter(e => e.type === 'time_on_page');
        const clicks     = q.filter(e => e.type === 'click');
        const now        = new Date().toISOString();

        // Build a human-readable + machine-parseable issue body
        const pagesVisited = [...new Set(pageViews.map(p => p.pageTitle || p.page))].join(', ') || '—';
        const totalTime    = timeEvents.reduce((s, t) => s + (t.seconds || 0), 0);
        const clickList    = clicks.map(c => `- ${c.category === 'artifact_click' ? '📎' : '🔗'} ${c.label || c.url}`).join('\n') || '— none —';

        const body = [
            `**Session:** \`${SESSION_ID}\``,
            `**Time:** ${now}`,
            `**Screen:** ${window.innerWidth}x${window.innerHeight}`,
            ``,
            `### Pages visited`,
            pageViews.map(p => `- ${p.pageTitle || p.page}`).join('\n') || '— none —',
            ``,
            `### Total time on site`,
            totalTime > 0 ? `${Math.floor(totalTime/60)}m ${totalTime%60}s` : '—',
            ``,
            `### Links & artifacts clicked`,
            clickList,
            ``,
            `<!-- AIFT_DATA`,
            JSON.stringify({ session: SESSION_ID, pageViews, timeEvents, clicks, ts: now }),
            `-->`
        ].join('\n');

        try {
            await ghPost('/issues', {
                title: `[session] ${pagesVisited.slice(0, 80)} — ${now.slice(0,10)}`,
                body,
                labels: ['aift-session']
            });
            queueSave([]); // clear queue on success
        } catch (e) {
            console.warn('AIFT: could not flush to GitHub Issues:', e.message);
        }
        flushing = false;
    }

    // ── Page view + time-on-page ──────────────────────────────────────────────
    let currentPage      = null;
    let currentPageTitle = null;
    let pageStart        = null;

    function recordTimeOnPage() {
        if (!currentPage || !pageStart) return;
        const seconds = Math.round((Date.now() - pageStart) / 1000);
        if (seconds < 2) return;
        record({ id: generateId(), type: 'time_on_page', page: currentPage, pageTitle: currentPageTitle, seconds, session: SESSION_ID, ts: new Date().toISOString() });
    }

    function trackPageView(page, title) {
        recordTimeOnPage();
        currentPage      = page;
        currentPageTitle = title || page;
        pageStart        = Date.now();
        record({ id: generateId(), type: 'page_view', page, pageTitle: title || page, session: SESSION_ID, ts: new Date().toISOString(), screen: window.innerWidth + 'x' + window.innerHeight });
        if (window.clarity) window.clarity('set', 'page', page);
    }

    // ── Click tracking ────────────────────────────────────────────────────────
    function trackClick(label, url, category) {
        record({ id: generateId(), type: 'click', category: category || 'external_link', label: label || '', url: url || '', page: currentPage, session: SESSION_ID, ts: new Date().toISOString() });
        if (window.clarity) window.clarity('event', category || 'external_link');
    }

    // ── Feedback (immediate Issue, separate label) ────────────────────────────
    async function submitFeedback(rating, comment) {
        const ev = { id: generateId(), type: 'feedback', rating, comment: comment || '', page: currentPage, pageTitle: currentPageTitle, session: SESSION_ID, ts: new Date().toISOString() };
        // Always save locally
        const local = localGet(); local.push(ev); localSave(local);

        if (window.clarity) {
            window.clarity('set', 'feedback_rating', String(rating));
            window.clarity('event', 'feedback_submitted');
        }

        if (ghReady()) {
            const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
            try {
                await ghPost('/issues', {
                    title: `[feedback] ${stars} — ${currentPageTitle || currentPage || 'site'} — ${ev.ts.slice(0,10)}`,
                    body: [
                        `**Rating:** ${stars} (${rating}/5)`,
                        `**Page:** ${currentPageTitle || currentPage || '—'}`,
                        `**Time:** ${ev.ts}`,
                        ``,
                        `### Comment`,
                        comment || '_No comment provided_',
                        ``,
                        `<!-- AIFT_DATA`,
                        JSON.stringify(ev),
                        `-->`
                    ].join('\n'),
                    labels: ['aift-feedback']
                });
            } catch (e) {
                console.warn('AIFT: could not post feedback to GitHub:', e.message);
            }
        }
        return true;
    }

    // ── Auto-wire external links ──────────────────────────────────────────────
    function wireExternalLinks(root) {
        (root || document).querySelectorAll('a[target="_blank"], a[href^="http"]').forEach(a => {
            if (a.dataset.aiftTracked) return;
            a.dataset.aiftTracked = '1';
            a.addEventListener('click', () => {
                const label = a.textContent.trim() || a.getAttribute('href');
                const isArtifact = a.classList.contains('deliverable-link') || a.classList.contains('doc-link') || !!a.closest('.deliverable-card') || !!a.closest('.docs');
                trackClick(label, a.getAttribute('href'), isArtifact ? 'artifact_click' : 'external_link');
            });
        });
    }

    // ── Local stats (dashboard fallback) ─────────────────────────────────────
    function getLocalStats() {
        const events    = localGet();
        const pageViews = events.filter(e => e.type === 'page_view');
        const timeEvs   = events.filter(e => e.type === 'time_on_page');
        const clicks    = events.filter(e => e.type === 'click');
        const feedback  = events.filter(e => e.type === 'feedback');

        const pageStats = {};
        pageViews.forEach(pv => {
            if (!pageStats[pv.page]) pageStats[pv.page] = { page: pv.page, title: pv.pageTitle, views: 0, totalTime: 0 };
            pageStats[pv.page].views++;
        });
        timeEvs.forEach(t => { if (pageStats[t.page]) pageStats[t.page].totalTime += t.seconds; });
        Object.values(pageStats).forEach(ps => { ps.avgTime = ps.views > 0 ? Math.round(ps.totalTime / ps.views) : 0; });

        const clickStats = {};
        clicks.forEach(c => {
            const key = c.label || c.url;
            if (!clickStats[key]) clickStats[key] = { label: c.label, url: c.url, category: c.category, count: 0 };
            clickStats[key].count++;
        });

        return {
            totalPageViews:  pageViews.length,
            uniqueSessions:  new Set(pageViews.map(e => e.session)).size,
            totalClicks:     clicks.length,
            feedbackCount:   feedback.length,
            avgRating:       feedback.length ? (feedback.reduce((s,f) => s + (f.rating||0), 0) / feedback.length).toFixed(1) : null,
            pageStats:       Object.values(pageStats).sort((a,b) => b.views - a.views),
            topClicks:       Object.values(clickStats).sort((a,b) => b.count - a.count).slice(0, 20),
            recentFeedback:  feedback.slice(-30).reverse(),
            recentPageViews: pageViews.slice(-30).reverse()
        };
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { recordTimeOnPage(); flushToGitHub(); }
        else pageStart = Date.now();
    });
    window.addEventListener('beforeunload', () => { recordTimeOnPage(); flushToGitHub(); });
    // Periodic flush every 5 minutes for long sessions
    setInterval(flushToGitHub, 5 * 60 * 1000);

    document.addEventListener('DOMContentLoaded', () => wireExternalLinks());
    new MutationObserver(() => wireExternalLinks(document.getElementById('main-content') || document.body))
        .observe(document.body, { childList: true, subtree: true });

    // ── Public API ─────────────────────────────────────────────────────────────
    window.aiftTrack = {
        pageView: trackPageView, click: trackClick, feedback: submitFeedback,
        wireLinks: wireExternalLinks, localStats: getLocalStats,
        flushNow: flushToGitHub,
        // back-compat
        trackPageView, trackEvent: (cat, action, label) => trackClick(label, '', cat+'/'+action)
    };
    window.analytics = window.aiftTrack;

}());
