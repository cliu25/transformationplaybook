// ============================================================================
// AIFT PLAYBOOK — FEEDBACK WIDGET
// ============================================================================
// Self-contained floating feedback button that injects itself into any page.
// Submits via window.aiftTrack.feedback() → Power Automate → Excel.
// No dependencies beyond tracking.js being loaded first (or standalone).

(function () {
    'use strict';

    const STYLES = `
        #aift-fb-btn {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 9000;
            background: #0f62fe;
            color: #fff;
            border: none;
            border-radius: 0;
            padding: 0.625rem 1.125rem;
            font-family: 'IBM Plex Sans', -apple-system, sans-serif;
            font-size: 0.8125rem;
            font-weight: 500;
            letter-spacing: 0.02em;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            gap: 0.4rem;
            transition: background 0.15s;
        }
        #aift-fb-btn:hover { background: #0353e9; }
        #aift-fb-btn svg { flex-shrink: 0; }

        #aift-fb-overlay {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9001;
            background: rgba(0,0,0,0.45);
            align-items: center;
            justify-content: center;
        }
        #aift-fb-overlay.open { display: flex; }

        #aift-fb-modal {
            background: #fff;
            width: min(480px, calc(100vw - 2rem));
            padding: 2rem;
            font-family: 'IBM Plex Sans', -apple-system, sans-serif;
            color: #161616;
            position: relative;
        }

        #aift-fb-modal h2 {
            font-size: 1.25rem;
            font-weight: 400;
            margin: 0 0 0.25rem;
            color: #161616;
        }
        #aift-fb-modal .fb-subtitle {
            font-size: 0.8125rem;
            color: #525252;
            margin: 0 0 1.5rem;
        }

        #aift-fb-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            cursor: pointer;
            color: #525252;
            font-size: 1.25rem;
            line-height: 1;
            padding: 0.25rem;
        }
        #aift-fb-close:hover { color: #161616; }

        .fb-label {
            display: block;
            font-size: 0.8125rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #161616;
        }

        /* Star rating */
        .fb-stars {
            display: flex;
            gap: 0.25rem;
            margin-bottom: 1.25rem;
        }
        .fb-star {
            background: none;
            border: 1.5px solid #c6c6c6;
            color: #c6c6c6;
            font-size: 1.375rem;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            border-radius: 0;
            transition: border-color 0.1s, color 0.1s;
            line-height: 1;
            padding: 0;
            font-family: inherit;
        }
        .fb-star.selected, .fb-star:hover {
            border-color: #0f62fe;
            color: #0f62fe;
        }
        .fb-star-label {
            font-size: 0.75rem;
            color: #525252;
            margin-left: 0.5rem;
            align-self: center;
        }

        /* Comment */
        .fb-textarea {
            width: 100%;
            min-height: 90px;
            border: 1px solid #c6c6c6;
            border-radius: 0;
            padding: 0.625rem 0.75rem;
            font-family: 'IBM Plex Sans', -apple-system, sans-serif;
            font-size: 0.875rem;
            color: #161616;
            resize: vertical;
            margin-bottom: 1.25rem;
            box-sizing: border-box;
        }
        .fb-textarea:focus {
            outline: 2px solid #0f62fe;
            outline-offset: 0;
            border-color: #0f62fe;
        }

        /* Category tags */
        .fb-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.375rem;
            margin-bottom: 1.25rem;
        }
        .fb-tag {
            border: 1px solid #c6c6c6;
            background: #fff;
            color: #525252;
            font-size: 0.75rem;
            padding: 0.3rem 0.7rem;
            cursor: pointer;
            border-radius: 1rem;
            font-family: inherit;
            transition: border-color 0.1s, color 0.1s, background 0.1s;
        }
        .fb-tag.selected {
            border-color: #0f62fe;
            color: #0f62fe;
            background: #edf5ff;
        }

        .fb-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
        }
        .fb-submit {
            background: #0f62fe;
            color: #fff;
            border: none;
            padding: 0.625rem 1.5rem;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            border-radius: 0;
            transition: background 0.15s;
        }
        .fb-submit:hover { background: #0353e9; }
        .fb-submit:disabled { background: #8d8d8d; cursor: not-allowed; }
        .fb-cancel {
            background: none;
            border: 1px solid #c6c6c6;
            color: #161616;
            padding: 0.625rem 1.5rem;
            font-family: inherit;
            font-size: 0.875rem;
            cursor: pointer;
            border-radius: 0;
        }
        .fb-cancel:hover { border-color: #8d8d8d; }

        /* Success state */
        #aift-fb-success {
            display: none;
            text-align: center;
            padding: 1rem 0 0.5rem;
        }
        #aift-fb-success.show { display: block; }
        #aift-fb-success .fb-check {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        #aift-fb-success p {
            font-size: 0.9375rem;
            color: #525252;
        }

        /* Error */
        .fb-error {
            color: #da1e28;
            font-size: 0.8125rem;
            margin-bottom: 0.75rem;
            display: none;
        }
        .fb-error.show { display: block; }
    `;

    const STAR_LABELS = ['', 'Not useful', 'Slightly useful', 'Somewhat useful', 'Very useful', 'Essential'];
    const CATEGORIES = ['Content clarity', 'Missing content', 'Navigation', 'Artifact quality', 'Overall value', 'Bug / broken link', 'Other'];

    function inject() {
        // Style tag
        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);

        // Floating button
        const btn = document.createElement('button');
        btn.id = 'aift-fb-btn';
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14 1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l3-3h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/></svg> Feedback`;
        document.body.appendChild(btn);

        // Overlay + modal
        const overlay = document.createElement('div');
        overlay.id = 'aift-fb-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Share feedback');
        overlay.innerHTML = `
            <div id="aift-fb-modal">
                <button id="aift-fb-close" aria-label="Close feedback">&times;</button>
                <h2>Share your feedback</h2>
                <p class="fb-subtitle">Help us improve the AIFT Playbook. Takes 30 seconds.</p>

                <!-- Form -->
                <div id="aift-fb-form">
                    <span class="fb-label">How useful was this page?</span>
                    <div style="display:flex;align-items:center;margin-bottom:1.25rem;">
                        <div class="fb-stars" role="radiogroup" aria-label="Star rating">
                            ${[1,2,3,4,5].map(n => `
                                <button class="fb-star" data-star="${n}" role="radio" aria-checked="false" aria-label="${n} star${n>1?'s':''}">${n}</button>
                            `).join('')}
                        </div>
                        <span class="fb-star-label" id="aift-fb-star-label"></span>
                    </div>

                    <span class="fb-label">What's this about? (optional)</span>
                    <div class="fb-tags">
                        ${CATEGORIES.map(c => `<button class="fb-tag" data-cat="${c}">${c}</button>`).join('')}
                    </div>

                    <span class="fb-label">Comments (optional)</span>
                    <textarea class="fb-textarea" id="aift-fb-comment" placeholder="What's working well, what's missing, what's confusing…" maxlength="2000"></textarea>

                    <div class="fb-error" id="aift-fb-error">Please select a star rating before submitting.</div>

                    <div class="fb-actions">
                        <button class="fb-cancel" id="aift-fb-cancel">Cancel</button>
                        <button class="fb-submit" id="aift-fb-submit">Submit feedback</button>
                    </div>
                </div>

                <!-- Success -->
                <div id="aift-fb-success">
                    <div class="fb-check">✓</div>
                    <h2>Thank you!</h2>
                    <p>Your feedback helps shape the playbook.</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // ── state ─────────────────────────────────────────────────────────────
        let selectedRating = 0;
        let selectedCategory = '';

        // ── helpers ───────────────────────────────────────────────────────────
        function open() {
            overlay.classList.add('open');
            document.getElementById('aift-fb-form').style.display = '';
            document.getElementById('aift-fb-success').classList.remove('show');
            document.getElementById('aift-fb-error').classList.remove('show');
            // reset
            selectedRating = 0;
            selectedCategory = '';
            overlay.querySelectorAll('.fb-star').forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-checked','false'); });
            overlay.querySelectorAll('.fb-tag').forEach(t => t.classList.remove('selected'));
            document.getElementById('aift-fb-comment').value = '';
            document.getElementById('aift-fb-star-label').textContent = '';
            document.getElementById('aift-fb-submit').disabled = false;
        }
        function close() { overlay.classList.remove('open'); }

        // ── event wiring ──────────────────────────────────────────────────────
        btn.addEventListener('click', open);
        document.getElementById('aift-fb-close').addEventListener('click', close);
        document.getElementById('aift-fb-cancel').addEventListener('click', close);

        // Close on backdrop click
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        // Close on Escape
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

        // Stars
        overlay.querySelectorAll('.fb-star').forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.star);
                overlay.querySelectorAll('.fb-star').forEach((s, i) => {
                    const on = (i + 1) <= selectedRating;
                    s.classList.toggle('selected', on);
                    s.setAttribute('aria-checked', on ? 'true' : 'false');
                });
                document.getElementById('aift-fb-star-label').textContent = STAR_LABELS[selectedRating] || '';
                document.getElementById('aift-fb-error').classList.remove('show');
            });
        });

        // Category tags
        overlay.querySelectorAll('.fb-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const already = tag.classList.contains('selected');
                overlay.querySelectorAll('.fb-tag').forEach(t => t.classList.remove('selected'));
                if (!already) { tag.classList.add('selected'); selectedCategory = tag.dataset.cat; }
                else selectedCategory = '';
            });
        });

        // Submit
        document.getElementById('aift-fb-submit').addEventListener('click', async () => {
            if (!selectedRating) {
                document.getElementById('aift-fb-error').classList.add('show');
                return;
            }
            const submitBtn = document.getElementById('aift-fb-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            const comment = [
                selectedCategory ? `[${selectedCategory}] ` : '',
                document.getElementById('aift-fb-comment').value.trim()
            ].join('');

            try {
                if (window.aiftTrack && window.aiftTrack.feedback) {
                    await window.aiftTrack.feedback(selectedRating, comment);
                }
            } catch (e) { /* silent */ }

            // Always show success regardless of API result
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit feedback';
            document.getElementById('aift-fb-form').style.display = 'none';
            document.getElementById('aift-fb-success').classList.add('show');
            setTimeout(close, 2200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

}());
