// ============================================================================
// AIFT PLAYBOOK — TRACKING CONFIGURATION
// ============================================================================
// Non-secret config only. Token + repo details live in tracking-secrets.js
// which is gitignored and never committed.

window.AIFT_CONFIG = {
    // ── Microsoft Clarity (traffic heatmaps + recordings) ──────────────────
    clarityProjectId: 'xn0z79mkef',

    // ── GitHub Issues database ──────────────────────────────────────────────
    // githubOwner, githubRepo, githubToken are set in js/tracking-secrets.js
    githubApiBase: 'https://github.ibm.com/api/v3',

    // ── On-site dashboard password ──────────────────────────────────────────
    dashboardPassword: 'orchestration'
};
