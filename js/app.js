// AI for Transformation Playbook - Vanilla JS Implementation
// Replicates v4 React functionality exactly

// Calculate base path for GitHub Pages
const basePath = window.location.pathname.split('/').slice(0, -1).join('/') || '';
const hashRouteMap = {
    '/overview': '/overview',
    '/deepdives': '/modules',
    '/casestudy': '/case-study',
    '/library': '/library',
    '/workflow': '/workflow'
};
const canonicalHashByRoute = Object.fromEntries(
    Object.entries(hashRouteMap).map(([hashRoute, appRoute]) => [appRoute, hashRoute])
);

// Global state
let content = null;
let artifactInventory = null;
let currentRoute = '/overview';
let openAccordions = {};
let activeWorkflowTab = 'engage';
let selectedModule = 'modules-overview';
let selectedCaseStudyPhase = -1; // -1 = overview, 0-5 = step index
let selectedLibraryStep = 'assess'; // default to Step 1

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeApp();
});

// Load content and artifact inventory
async function loadData() {
    try {
        const contentResponse = await fetch('content_synced.json');
        content = await contentResponse.json();
        console.log('Content loaded:', content);

        // artifact-inventory.json is optional — deliverable cards now link via exampleUrl/templateUrl
        try {
            const artifactResponse = await fetch('artifact-inventory.json');
            if (artifactResponse.ok) {
                artifactInventory = await artifactResponse.json();
                console.log('Artifact inventory loaded:', artifactInventory);
            }
        } catch (e) {
            artifactInventory = null;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load content. Please ensure content_synced.json is present.');
    }
}

// Initialize the application
function initializeApp() {
    if (!content) return;
    
    // Set brand title
    document.getElementById('brand-title').textContent = content.brand.title;
    
    // Set footer
    document.getElementById('footer-text').textContent = content.meta.footerText;
    document.getElementById('footer-subtext').textContent = content.meta.footerSubtext;
    
    // Render navigation
    renderNavigation();
    
    // Initialize search functionality
    console.log('Initializing search...');
    initializeSearch();
    
    // Handle initial route from hash for GitHub Pages compatibility
    const hashRoute = window.location.hash.replace(/^#/, '') || '/overview';
    navigateTo(hashRouteMap[hashRoute] || '/overview', false);
    
    // Handle browser back/forward and hash changes
    window.addEventListener('hashchange', () => {
        const nextHashRoute = window.location.hash.replace(/^#/, '') || '/overview';
        navigateTo(hashRouteMap[nextHashRoute] || '/overview', false);
    });
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

// Search state
let searchKeyboardIndex = -1;
let searchQueryHistory = [];

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) return;

    // Load history from localStorage
    try {
        searchQueryHistory = JSON.parse(localStorage.getItem('aift-search-history') || '[]');
    } catch(e) { searchQueryHistory = []; }

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.classList.remove('active');
            searchKeyboardIndex = -1;
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        const list = document.getElementById('search-results-list');
        const items = list ? list.querySelectorAll('.search-result-item') : [];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                searchKeyboardIndex = Math.min(searchKeyboardIndex + 1, items.length - 1);
                updateKeyboardSelection(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                searchKeyboardIndex = Math.max(searchKeyboardIndex - 1, 0);
                updateKeyboardSelection(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (searchKeyboardIndex >= 0 && window.searchResultsData && window.searchResultsData[searchKeyboardIndex]) {
                    saveSearchQuery(searchInput.value.trim());
                    window.searchResultsData[searchKeyboardIndex].action();
                    searchResults.classList.remove('active');
                    searchKeyboardIndex = -1;
                }
                break;
            case 'Escape':
                e.preventDefault();
                searchResults.classList.remove('active');
                searchKeyboardIndex = -1;
                break;
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
            searchKeyboardIndex = -1;
        }
    });

    // Clicks inside results panel — filters, result items, history items
    searchResults.addEventListener('click', (e) => {
        // Filter button
        const filterBtn = e.target.closest('.search-filter-btn');
        if (filterBtn) {
            const group = filterBtn.closest('.search-filter-group');
            group.querySelectorAll('.search-filter-btn').forEach(b => b.classList.remove('active'));
            filterBtn.classList.add('active');
            const query = searchInput.value.trim();
            if (query.length >= 2) performSearch(query);
            return;
        }

        // Result item
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const index = parseInt(resultItem.dataset.resultIndex);
            if (window.searchResultsData && window.searchResultsData[index]) {
                saveSearchQuery(searchInput.value.trim());
                window.searchResultsData[index].action();
                searchResults.classList.remove('active');
                searchKeyboardIndex = -1;
            }
            return;
        }

        // History item
        const historyItem = e.target.closest('.search-history-item');
        if (historyItem) {
            const q = historyItem.dataset.query;
            searchInput.value = q;
            performSearch(q);
        }
    });

    // Show history on focus when input is empty
    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            performSearch(query);
        } else if (query.length === 0 && searchQueryHistory.length > 0) {
            showSearchHistory();
        }
    });
}

function getActiveFilters() {
    const phaseBtn = document.querySelector('.search-filter-btn.active[data-filter-type="phase"]');
    const contentBtn = document.querySelector('.search-filter-btn.active[data-filter-type="content"]');
    return {
        phase: phaseBtn ? phaseBtn.dataset.filterValue : 'all',
        content: contentBtn ? contentBtn.dataset.filterValue : 'all'
    };
}

function performSearch(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    const filters = getActiveFilters();

    // Search in modules only (no End-to-End Workflow)
    const modulesArray = content.modules && content.modules.chapters ? content.modules.chapters : [];
    modulesArray.forEach(module => {
        module.phaseSections.forEach(section => {
            // Real field names in v14 content: stepName, description, stepSubtext, phaseGroup, stepId
            const title = section.stepName || null;
            if (!title) return;

            const phaseGroup = (section.phaseGroup || '').toLowerCase();
            if (filters.phase !== 'all' && phaseGroup !== filters.phase) return;
            if (filters.content !== 'all' && filters.content !== 'module') return;

            const matches = [];

            const searchableFields = [
                { field: 'title',    text: section.stepName },
                { field: 'subtext',  text: section.stepSubtext },
                { field: 'description', text: section.description },
                { field: 'relevance', text: section.relevance },
            ];

            searchableFields.forEach(({ field, text }) => {
                if (text && text.toLowerCase().includes(queryLower)) {
                    matches.push({ field, text });
                }
            });

            // Search inside actions
            if (section.actions) {
                section.actions.forEach(action => {
                    const actionText = typeof action === 'string' ? action : ((action.title ? action.title + ' ' : '') + (action.description || ''));
                    if (actionText && actionText.toLowerCase().includes(queryLower)) {
                        matches.push({ field: 'action', text: actionText });
                    }
                });
            }

            // Search inside artifact titles and descriptions
            if (section.artifacts) {
                section.artifacts.forEach(artifact => {
                    const artText = (artifact.title || '') + ' ' + (artifact.description || '');
                    if (artText.toLowerCase().includes(queryLower)) {
                        matches.push({ field: 'artifact', text: artifact.title });
                    }
                });
            }

            // Search inside checklist items
            if (section.checklist) {
                section.checklist.forEach(item => {
                    if (typeof item === 'string' && item.toLowerCase().includes(queryLower)) {
                        matches.push({ field: 'checklist', text: item });
                    }
                });
            }

            if (matches.length > 0) {
                results.push({
                    contentType: 'module',
                    phase: phaseGroup || null,
                    title: title,
                    description: section.description || section.stepSubtext || matches[0].text,
                    path: `Deep Dives › ${module.title}`,
                    matches: matches,
                    action: () => {
                        currentRoute = '/modules';
                        selectedModule = module.id;
                        renderNavigation();
                        document.getElementById('search-results').classList.remove('active');
                        renderModulesPage().then(() => {
                            // renderModulesPage is async — wait for content to paint
                            requestAnimationFrame(() => {
                                const sectionEl = document.getElementById(`section-${section.stepId}`);
                                if (sectionEl) {
                                    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                                highlightPageText(query);
                            });
                        });
                    }
                });
            }
        });
    });

    // Search in case study
    content.caseStudy.phases.forEach((phase, index) => {
        if (!phase.phaseName) return;

        if (filters.content !== 'all' && filters.content !== 'case-study') return;

        const phaseGroup = (phase.phaseGroupId || phase.phaseGroup || '').toLowerCase();
        if (filters.phase !== 'all' && phaseGroup !== filters.phase) return;

        const matches = [];

        const searchableFields = [
            { field: 'title',   text: phase.phaseName },
            { field: 'summary', text: phase.summary },
            { field: 'mindset', text: phase.mindset },
        ];

        searchableFields.forEach(({ field, text }) => {
            if (text && text.toLowerCase().includes(queryLower)) {
                matches.push({ field, text });
            }
        });

        if (phase.keyActions) {
            phase.keyActions.forEach(action => {
                if (typeof action === 'string' && action.toLowerCase().includes(queryLower)) {
                    matches.push({ field: 'keyAction', text: action });
                }
            });
        }

        if (matches.length > 0) {
            results.push({
                contentType: 'case-study',
                phase: phaseGroup || null,
                title: phase.phaseName,
                description: phase.summary || matches[0].text,
                path: 'Case Study',
                matches: matches,
                action: () => {
                    currentRoute = '/case-study';
                    // Map case study phase index to new 6-step order (insert stub at index 1)
                    selectedCaseStudyPhase = index >= 1 ? index + 1 : index;
                    renderNavigation();
                    renderCaseStudyPage();
                    document.getElementById('search-results').classList.remove('active');
                    setTimeout(() => { highlightPageText(query); }, 150);
                }
            });
        }
    });

    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    const searchResultsList = document.getElementById('search-results-list');
    const searchResults = document.getElementById('search-results');
    const historyEl = document.getElementById('search-history');

    if (!searchResultsList) return;
    if (historyEl) historyEl.style.display = 'none';

    if (results.length === 0) {
        searchResultsList.innerHTML = '<div class="search-no-results">No results found</div>';
        searchResults.classList.add('active');
        searchKeyboardIndex = -1;
        window.searchResultsData = [];
        return;
    }

    const shown = results.slice(0, 10);
    const html = shown.map((result, index) => {
        const desc = result.description || result.matches[0].text || '';
        const contextText = highlightText(desc, query);
        const typeLabels = { 'module': 'Deep Dive', 'case-study': 'Case Study' };
        const typeLabel = typeLabels[result.contentType] || result.contentType;
        const typeBadge = `<span class="search-badge type-${result.contentType}">${typeLabel}</span>`;
        const phaseBadge = result.phase ? `<span class="search-badge phase-${result.phase}">${result.phase}</span>` : '';

        return `
            <div class="search-result-item" data-result-index="${index}">
                <div class="search-result-header">
                    <div class="search-result-title">${result.title}</div>
                </div>
                <div class="search-result-context">${contextText}</div>
                <div class="search-result-path">${typeBadge}${phaseBadge} ${result.path}</div>
            </div>
        `;
    }).join('');

    searchResultsList.innerHTML = html;
    searchResults.classList.add('active');
    searchKeyboardIndex = -1;
    window.searchResultsData = shown;
}

function highlightText(text, query) {
    if (!text) return '';
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const idx = textLower.indexOf(queryLower);

    if (idx === -1) {
        return text.length > 120 ? text.substring(0, 120) + '...' : text;
    }

    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + query.length + 50);
    let ctx = text.substring(start, end);
    if (start > 0) ctx = '...' + ctx;
    if (end < text.length) ctx += '...';

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return ctx.replace(regex, '<span class="search-highlight">$1</span>');
}

function highlightPageText(query) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent || !query) return;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    function walkNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (regex.test(text)) {
                regex.lastIndex = 0;
                const wrapper = document.createElement('span');
                wrapper.innerHTML = text.replace(regex, '<mark class="search-highlight">$1</mark>');
                node.parentNode.replaceChild(wrapper, node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)) {
            Array.from(node.childNodes).forEach(walkNode);
        }
    }

    walkNode(mainContent);

    const firstMark = mainContent.querySelector('mark.search-highlight');
    if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function updateKeyboardSelection(items) {
    items.forEach((item, i) => {
        if (i === searchKeyboardIndex) {
            item.classList.add('keyboard-selected');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('keyboard-selected');
        }
    });
}

function saveSearchQuery(query) {
    if (!query || query.length < 2) return;
    searchQueryHistory = [query, ...searchQueryHistory.filter(q => q !== query)].slice(0, 5);
    try { localStorage.setItem('aift-search-history', JSON.stringify(searchQueryHistory)); } catch(e) {}
}

function showSearchHistory() {
    const searchResults = document.getElementById('search-results');
    const searchResultsList = document.getElementById('search-results-list');
    const historyEl = document.getElementById('search-history');
    const historyList = document.getElementById('search-history-list');

    if (!historyEl || !historyList || searchQueryHistory.length === 0) return;

    if (searchResultsList) searchResultsList.innerHTML = '';
    historyList.innerHTML = searchQueryHistory
        .map(q => `<div class="search-history-item" data-query="${q}">${q}</div>`)
        .join('');
    historyEl.style.display = 'block';
    searchResults.classList.add('active');
}

function handleSearchResultClick(index) {
    if (window.searchResultsData && window.searchResultsData[index]) {
        window.searchResultsData[index].action();
    }
}

// Render navigation
function renderNavigation() {
    const navLinks = document.getElementById('nav-links');
    const homeIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 0.25rem; vertical-align: text-bottom;"><path d="M8 1L1 8h2v7h4V9h2v6h4V8h2L8 1z"/></svg>`;
    navLinks.innerHTML = content.navigation.map(item => `
        <a href="${item.route}" class="nav-link ${currentRoute === item.route ? 'active' : ''}" data-route="${item.route}">
            ${item.id === 'overview' ? homeIcon : ''}${item.label}
        </a>
    `).join('');
    
    // Add click handlers
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.route);
        });
    });
}

// Navigate to a route
function navigateTo(route, pushState = true) {
    currentRoute = route;
    
    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.route === route || (route === '/' && link.dataset.route === '/overview'));
    });
    
    // Update hash-based URL for GitHub Pages-safe deep linking
    if (pushState) {
        const canonicalHashRoute = canonicalHashByRoute[route] || '/overview';
        window.location.hash = canonicalHashRoute;
        return;
    }
    
    // Track page view (works with both old analytics.js shim and new tracking.js)
    if (window.aiftTrack || window.analytics) {
        const pageTitle = route === '/overview' ? 'Overview' :
                         route === '/workflow' ? 'End-to-End Workflow' :
                         route === '/modules' ? 'How-to Deep Dives' :
                         route === '/library' ? 'Deliverables Library' :
                         route === '/case-study' ? 'Case Study' : route;
        const tracker = window.aiftTrack || window.analytics;
        tracker.trackPageView(route, pageTitle);
    }
    
    // Render the appropriate page
    if (route === '/overview') {
        renderOverviewPage();
    } else if (route === '/' || route === '/workflow') {
        renderWorkflowPage();
    } else if (route === '/modules') {
        renderModulesPage();
    } else if (route === '/library') {
        renderLibraryPage();
    } else if (route === '/case-study') {
        renderCaseStudyPage();
    }
}

// ============================================================================
// WORKFLOW PAGE
// ============================================================================

function renderFlowchart() {
    const nodes = content.endToEndWorkflow.flowchart.nodes || [];
    const edges = content.endToEndWorkflow.flowchart.edges || [];
    const edgeSet = new Set(edges.map(([fromId, toId]) => `${fromId}->${toId}`));

    // Build phase indicators row - only show pill at first occurrence of each phase
    const phaseIndicatorsRow = nodes.map((node, index) => {
        const prevNode = nodes[index - 1];
        const nextNode = nodes[index + 1];
        const hasConnector = nextNode && edgeSet.has(`${node.id}->${nextNode.id}`);
        const phaseClass = `phase-${node.phaseGroup.toLowerCase()}`;
        
        // Show phase group indicator when it changes from previous node
        const showPhaseIndicator = !prevNode || prevNode.phaseGroup !== node.phaseGroup;
        
        return `
            <div class="flow-indicator-cell">
                ${showPhaseIndicator ? `
                    <div class="phase-group-indicator ${phaseClass}">
                        <span class="phase-group-label">${node.phaseGroup}</span>
                    </div>
                ` : ''}
            </div>
            ${hasConnector ? '<div class="flow-indicator-arrow"></div>' : ''}
        `;
    }).join('');

    // Build cards row
    const cardsRow = nodes.map((node, index) => {
        const nextNode = nodes[index + 1];
        const hasConnector = nextNode && edgeSet.has(`${node.id}->${nextNode.id}`);
        const phaseClass = `phase-${node.phaseGroup.toLowerCase()}`;

        return `
            <div class="flow-card-cell">
                <button class="flow-card ${phaseClass}" data-anchor="${node.anchor}">
                    <h3>${node.label}</h3>
                </button>
            </div>
            ${hasConnector ? '<div class="flow-arrow" aria-hidden="true">→</div>' : ''}
        `;
    }).join('');

    return `
        <div class="flow-indicators-row">
            ${phaseIndicatorsRow}
        </div>
        <div class="flow-cards-row">
            ${cardsRow}
        </div>
    `;
}

async function renderOverviewPage() {
    const main = document.getElementById('main-content');
    // Use explicit relative path
    const response = await fetch('./overview.html');
    const html = await response.text();
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract and inject the inline styles from overview.html if not already present
    const styleTag = doc.querySelector('style');
    if (styleTag && !document.getElementById('overview-styles')) {
        const newStyle = document.createElement('style');
        newStyle.id = 'overview-styles';
        newStyle.textContent = styleTag.textContent;
        document.head.appendChild(newStyle);
    }
    
    // Get all sections except header and footer
    const sections = Array.from(doc.body.children).filter(el =>
        el.tagName !== 'HEADER' && el.tagName !== 'FOOTER'
    );
    
    // Build content from sections
    const bodyContent = sections.map(el => el.outerHTML).join('\n');
    main.innerHTML = bodyContent;
    
    // Wire all internal navigation links to the site router
    main.querySelectorAll('a[href^="/"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href === '/workflow' || href === '/modules' || href === '/case-study' || href === '/library') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(href);
            });
        }
    });
}
// Blueprint SVG loader functions
async function loadBlueprintSVG(viewNumber) {
    const svgFiles = {
        1: 'components/blueprints/view1-master-blueprint.svg',
        2: 'components/blueprints/view2-roadmap.svg',
        3: 'components/blueprints/view3-before.svg',
        4: 'components/blueprints/view4-after.svg'
    };
    
    try {
        const response = await fetch(svgFiles[viewNumber]);
        if (!response.ok) throw new Error(`Failed to load blueprint view ${viewNumber}`);
        return await response.text();
    } catch (error) {
        console.error(`Error loading blueprint SVG view ${viewNumber}:`, error);
        return `<p>Error loading blueprint diagram</p>`;
    }
}


async function renderWorkflowPage() {
    const main = document.getElementById('main-content');

    try {
        const response = await fetch('e2e_workflow_all_steps.html');
        if (!response.ok) throw new Error('Failed to load workflow narrative');

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const bodyChildren = Array.from(doc.body.children);
        main.innerHTML = `
            <section class="panel" style="margin-bottom: 2rem;">
                <h1 style="font-size: 2.5rem; font-weight: 300; margin-bottom: 1rem;">End-to-End Workflow</h1>
                <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.6; max-width: 52rem;">
                    Six steps. Three phases. One repeatable method.
                </p>
            </section>
            <div class="workflow-embed">
                ${bodyChildren
                    .filter(el => el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE')
                    .map(el => el.outerHTML)
                    .join('\n')}
            </div>
        `;

        main.querySelectorAll('.acc-trigger').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', () => {
                const body = btn.nextElementSibling;
                const chev = btn.querySelector('.acc-chevron');
                if (!body) return;
                const open = body.classList.toggle('open');
                if (chev) chev.classList.toggle('open', open);
            });
        });

        main.querySelectorAll('a[href^="/"]').forEach(link => {
            const href = link.getAttribute('href');
            if (href === '/workflow' || href === '/modules' || href === '/case-study' || href === '/library' || href === '/overview') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateTo(href);
                });
            }
        });

        const firstBody = main.querySelector('.acc-body');
        if (firstBody && !firstBody.classList.contains('open')) {
            firstBody.classList.add('open');
            const firstBtn = firstBody.previousElementSibling;
            const chev = firstBtn ? firstBtn.querySelector('.acc-chevron') : null;
            if (chev) chev.classList.add('open');
        }
    } catch (error) {
        console.error('Error rendering workflow page:', error);
        main.innerHTML = `
            <section class="hero">
                <h1>${content.endToEndWorkflow.title}</h1>
                <p>Unable to load workflow content.</p>
            </section>
        `;
    }
}

function renderWorkflowTabContent() {
    const container = document.getElementById('workflow-tab-content');
    
    // Find the phase group that matches the active tab
    const phaseGroup = content.endToEndWorkflow.phaseGroups.find(pg =>
        pg.id.toLowerCase() === activeWorkflowTab.toLowerCase()
    );
    
    if (phaseGroup) {
        container.innerHTML = `
            <div class="tab-content">
                <div class="phase-content">
                    <div class="phase-header">
                        <h2>${phaseGroup.name}</h2>
                        <p>${phaseGroup.description}</p>
                    </div>
                    <div class="phase-steps">
                        ${phaseGroup.steps.map(step => renderWorkflowStep(step)).join('')}
                    </div>
                </div>
            </div>
        `;

        const firstBody = container.querySelector('.step-acc-body');
        const firstBtn  = container.querySelector('.step-acc-trigger');
        if (firstBody && firstBtn) {
            firstBody.classList.add('open');
            const chev = firstBtn.querySelector('.step-acc-chevron');
            if (chev) chev.classList.add('open');
            firstBtn.setAttribute('aria-expanded', 'true');
        }
    }
}

function renderWorkflowStep(step) {
    const narrativePanel = step.narrativeHtml ? `
        <div class="panel">
            ${step.narrativeHtml}
        </div>
    ` : '';

    const deliverablesPanel = step.deliverables && step.deliverables.length > 0 ? `
        <div class="panel">
            <h4>Deliverables</h4>
            <div class="deliverable-grid">
                ${step.deliverables.map(d => renderDeliverableCard(d)).join('')}
            </div>
        </div>
    ` : '';

    const readyPanel = step.readyToMoveOnChecklist && step.readyToMoveOnChecklist.length > 0 ? `
        <div class="panel">
            <h4>Ready to Move On?</h4>
            <ul class="checklist">
                ${step.readyToMoveOnChecklist.map(item => `<li class="check-item">☐ ${item}</li>`).join('')}
            </ul>
        </div>
    ` : '';

    const advanceBanner = step.readyToAdvance ? `
        <div class="ready-to-advance-banner">
            <div class="ready-to-advance-icon">✓</div>
            <div class="ready-to-advance-content">
                <h4>Moving to the next phase</h4>
                <p>${step.readyToAdvance}</p>
            </div>
        </div>
    ` : '';

    const phaseClass = step.phaseGroup
        ? `step-phase-${step.phaseGroup.toLowerCase()}`
        : 'step-phase-engage';

    const accId = `step-acc-${step.id}`;

    return `
        <div class="step-acc" id="${step.anchor ? step.anchor.replace('#','') : step.id}">
            <button class="step-acc-trigger" onclick="toggleStepAcc('${accId}', this)" aria-expanded="false">
                <div class="step-acc-left">
                    <span class="step-phase-tag ${phaseClass}">${step.phaseGroup || 'Engage'}</span>
                    <span class="step-acc-name">${step.name}</span>
                    ${step.idealTimespan ? `<span class="step-acc-timing">${step.idealTimespan}</span>` : ''}
                </div>
                <span class="step-acc-chevron">▾</span>
            </button>
            <div class="step-acc-body" id="${accId}">
                ${step.briefDescription ? `<p class="step-description" style="margin-bottom:1.25rem;">${step.briefDescription}</p>` : ''}
                ${narrativePanel}
                ${readyPanel}
                ${deliverablesPanel}
                ${advanceBanner}
            </div>
        </div>
    `;
}

function toggleStepAcc(bodyId, btn) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    const isOpen = body.classList.toggle('open');
    const chev = btn.querySelector('.step-acc-chevron');
    if (chev) chev.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function renderDeliverableCard(deliverable) {
    // Two-link model: a deliverable can have an example link and/or a template link.
    // Back-compat: fall back to legacy boxUrl/url for either if present.
    const exampleUrl = (deliverable.exampleUrl && deliverable.exampleUrl.trim()) || '';
    const templateUrl = (deliverable.templateUrl && deliverable.templateUrl.trim())
        || (deliverable.boxUrl && deliverable.boxUrl.trim())
        || (deliverable.url && deliverable.url.trim()) || '';
    
    // If there's any text, treat it as a link (could be URL or filename)
    const hasExample = exampleUrl !== '';
    const hasTemplate = templateUrl !== '';

    // Small IBM-blue external-link icon
    const linkIcon = '<svg class="external-link-icon" width="14" height="14" viewBox="0 0 16 16" fill="#0f62fe" aria-hidden="true"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';
    const disabledIcon = '<svg class="external-link-icon" width="14" height="14" viewBox="0 0 16 16" fill="#8d8d8d" aria-hidden="true"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';

    // Build link buttons — show both, with disabled state if no URL
    const links = [];
    if (hasExample) {
        links.push(`<a class="deliverable-link" href="${exampleUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();if(window.aiftTrack)window.aiftTrack.click('Example: ${deliverable.title.replace(/'/g,"\\'")}','${exampleUrl}','artifact_click')">Example ${linkIcon}</a>`);
    } else {
        links.push(`<span class="deliverable-link disabled" title="Example not yet available">Example ${disabledIcon}</span>`);
    }
    if (hasTemplate) {
        links.push(`<a class="deliverable-link" href="${templateUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();if(window.aiftTrack)window.aiftTrack.click('Template: ${deliverable.title.replace(/'/g,"\\'")}','${templateUrl}','artifact_click')">Template ${linkIcon}</a>`);
    } else {
        links.push(`<span class="deliverable-link disabled" title="Template not yet available">Template ${disabledIcon}</span>`);
    }
    const linkRow = `<div class="deliverable-links">${links.join('')}</div>`;

    return `
        <div class="card deliverable-card">
            <div class="deliverable-content">
                <h5>${deliverable.title}</h5>
                <p>${deliverable.description}</p>
            </div>
            ${linkRow}
        </div>
    `;
}

function renderModuleCard(module) {
    const relevanceColors = {
        primary: '#0f62fe',
        supporting: '#8a3ffc',
        'supporting-important': '#009d9a'
    };
    
    return `
        <div class="card module-card" style="--module-color: ${relevanceColors[module.relevance] || '#0f62fe'}">
            <div class="card-type">${module.relevance}</div>
            <h5>${module.title}</h5>
            <p>${module.summary}</p>
            ${module.checklist && module.checklist.length > 0 ? `
                <ul style="font-size: 0.875rem; margin-top: 0.5rem; padding-left: 1.25rem;">
                    ${module.checklist.slice(0, 3).map(item => `<li>☐ ${item}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `;
}

function renderCriticalMomentCard(moment) {
    return `
        <div class="card critical-card">
            <h4>${moment.title}</h4>
            <p>${moment.description}</p>
            
            ${moment.keyQuestions && moment.keyQuestions.length > 0 ? `
                <div class="key-questions">
                    <h5>Key Questions</h5>
                    <ul>
                        ${moment.keyQuestions.map(question => `<li>${question}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${moment.goTo && moment.goTo.length > 0 ? `
                <div class="tag-row">
                    <strong>Go to:</strong>
                    ${moment.goTo.map(step => `<span class="tag">${step}</span>`).join('')}
                </div>
            ` : ''}
            
            ${moment.relatedModules && moment.relatedModules.length > 0 ? `
                <div class="tag-row">
                    <strong>Deep Dives:</strong>
                    ${moment.relatedModules.map(module => `<span class="tag">${module}</span>`).join('')}
                </div>
            ` : ''}

            ${moment.relatedDeliverables && moment.relatedDeliverables.length > 0 ? `
                <div style="margin-top: 1rem;">
                    <strong>Key Deliverables:</strong>
                    <div class="deliverable-grid" style="margin-top: 0.5rem;">
                        ${moment.relatedDeliverables.map(deliverable => renderDeliverableCard(deliverable)).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function scrollToAnchor(anchor) {
    const element = document.querySelector(anchor);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================================================
// MODULES PAGE
// ============================================================================

async function renderModulesPage() {
    const main = document.getElementById('main-content');
    const visibleChapterIds = ['prioritization-roadmap', 'systems-integration', 'value-measurement-roi', 'adoption-change', 'governance-risk'];
    const hiddenChapterIds = content.modules.chapters
        .filter(chapter => !visibleChapterIds.includes(chapter.id))
        .map(chapter => chapter.id);
    const blueprintSVG = await loadBlueprintSVG(2);

    const moduleSections = [
        {
            id: 'modules-overview',
            navLabel: 'Overview',
            title: 'How-to deep dives overview',
            meta: 'Service design map · Five challenge areas',
            description: '',
            contentHtml: `
                <div class="workflow-overview-panel">
                    <div class="workflow-overview-copy">
                        <p>The How-to Deep Dives section is where teams go when they need focused guidance on the hardest parts of AI-first transformation. Each chapter translates a recurring challenge area into practical decisions, artifacts, and execution guidance.</p>
                        <p>The service design map shows how the challenge areas show up across Engage, Discover, and Execute. Use it to orient yourself, understand where each challenge becomes primary, and decide which deep dive to open next.</p>
                    </div>
                    <div class="workflow-overview-blueprint" aria-label="How-to deep dives service design map">
                        ${blueprintSVG}
                    </div>
                </div>
            `
        },
        ...content.modules.chapters.map(chapter => ({
            id: chapter.id,
            navLabel: chapter.title,
            title: chapter.title,
            meta: hiddenChapterIds.includes(chapter.id)
                ? 'In progress'
                : 'Deep Dive',
            description: hiddenChapterIds.includes(chapter.id)
                ? '<p class="workflow-step-description">This chapter is still being developed.</p>'
                : chapter.definition
                    ? `<p class="workflow-step-description">${chapter.definition}</p>`
                    : '',
            hidden: hiddenChapterIds.includes(chapter.id)
        }))
    ];

    const activeSection = moduleSections.find(section => section.id === selectedModule) || moduleSections[0];
    selectedModule = activeSection.id;

    main.innerHTML = `
        <section class="workflow-layout workflow-layout--with-top-offset" aria-label="How-to deep dives content">
            <nav class="workflow-side-nav" aria-label="How-to deep dives chapter navigation">
                <ul class="workflow-side-nav__list">
                    ${moduleSections.map(section => `
                        <li class="workflow-side-nav__item">
                            <button
                                class="workflow-side-nav__button${section.id === activeSection.id ? ' is-active' : ''}"
                                data-module="${section.id}"
                                aria-current="${section.id === activeSection.id ? 'page' : 'false'}">
                                ${section.navLabel}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </nav>
            <div class="workflow-detail-panel">
                <div class="workflow-detail-panel__header">
                    <p class="workflow-detail-panel__meta">${activeSection.meta}</p>
                    <h2>${activeSection.title}</h2>
                    ${activeSection.description || ''}
                </div>
                <div class="workflow-detail-panel__body module-content" id="module-content">
                    ${activeSection.id === 'modules-overview' ? activeSection.contentHtml : ''}
                </div>
            </div>
        </section>
    `;

    document.querySelectorAll('[data-module]').forEach(button => {
        button.addEventListener('click', async () => {
            selectedModule = button.dataset.module;
            await renderModulesPage();
        });
    });

    if (activeSection.id !== 'modules-overview') {
        await renderModuleContent();
    }
}

async function renderModuleContent() {
    const container = document.getElementById('module-content');
    const module = content.modules.chapters.find(ch => ch.id === selectedModule);
    const visibleChapterIds = ['prioritization-roadmap', 'systems-integration', 'value-measurement-roi', 'adoption-change', 'governance-risk'];

    if (!container || !module) return;

    if (!visibleChapterIds.includes(module.id)) {
        container.innerHTML = `
            <section class="hero" style="margin: 0; max-width: none; padding: 0;">
                <p style="margin: 0; text-align: left;">Coming soon</p>
            </section>
        `;
        return;
    }

    container.innerHTML = await renderModuleDetail(module);

    // Add event listeners for anchor links (navigation pills)
    container.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    container.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const accordionId = header.dataset.accordionId;
            openAccordions[accordionId] = !openAccordions[accordionId];
            renderModuleContent();
        });
    });
}
async function renderNarrativeModule(module) {

    // Original JSON-based rendering for other narrative modules
    let html = `
        <div class="module-detail">
            <div class="module-header">
                <h2>${module.title}</h2>
                <p class="module-definition">${module.definition}</p>
            </div>
    `;

    // Render each section
    module.sections.forEach(section => {
        html += `
            <div class="narrative-section">
                <div class="phase-header">
                    <span class="phase-label">${section.phaseGroup}</span>
                    <h3>${section.phaseTitle}</h3>
                </div>
        `;

        // Add visual if present
        if (section.visualHtml) {
            html += `<div class="visual-container panel">${section.visualHtml}</div>`;
        }

        // Handle parts (for Discover phase split)
        if (section.parts && section.parts.length > 0) {
            section.parts.forEach(part => {
                html += `<div class="narrative-part"><h4>${part.partTitle}</h4>`;
                
                // Add visual for part if present
                if (part.visualHtml) {
                    html += `<div class="visual-container panel">${part.visualHtml}</div>`;
                }
                
                part.narrativeSections.forEach(narSection => {
                    html += `
                        <div class="narrative-subsection">
                            <h5>${narSection.heading}</h5>
                            <div class="narrative-content">${narSection.content}</div>
                    `;
                    
                    // Render artifacts if present in this narrative section
                    if (narSection.artifacts && narSection.artifacts.length > 0) {
                        html += `
                            <div class="deliverable-grid" style="margin-top: 1rem;">
                                ${narSection.artifacts.map(artifact => renderDeliverableCard(artifact)).join('')}
                            </div>
                        `;
                    }
                    
                    html += `</div>`; // Close narrative-subsection
                });

                html += `</div>`; // Close narrative-part
            });
        } else {
            // Regular narrative sections (no parts)
            section.narrativeSections.forEach(narSection => {
                html += `
                    <div class="narrative-subsection">
                        <h5>${narSection.heading}</h5>
                        <div class="narrative-content">${narSection.content}</div>
                `;
                
                // Render artifacts if present in this narrative section
                if (narSection.artifacts && narSection.artifacts.length > 0) {
                    html += `
                        <div class="deliverable-grid" style="margin-top: 1rem;">
                            ${narSection.artifacts.map(artifact => renderDeliverableCard(artifact)).join('')}
                        </div>
                    `;
                }
                
                html += `</div>`; // Close narrative-subsection
            });
        }

        html += `</div>`; // Close narrative-section
    });

    // Render design principles if present
    if (module.designPrinciples && module.designPrinciples.length > 0) {
        html += `
            <div class="design-principles">
                <h3>Design Principles</h3>
                <div class="principles-grid">
        `;
        
        module.designPrinciples.forEach(principle => {
            html += `
                <div class="principle-card">
                    <h4>${principle.title}</h4>
                    <p>${principle.description}</p>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    html += `</div>`; // Close module-detail

    return html;
}


async function renderModuleDetail(module) {
    if (!module) return '';

    // Check if this is the Prioritization & Roadmap, Value Measurement & ROI, Systems Integration, or Adoption & Change module - load standalone HTML
    if (module.id === 'prioritization-roadmap' || module.id === 'value-measurement-roi' || module.id === 'systems-integration' || module.id === 'adoption-change' || module.id === 'governance-risk') {
        try {
            // Determine which HTML file to load
            const htmlFile = module.id === 'prioritization-roadmap'
                ? 'prioritization_narrative.html'
                : module.id === 'value-measurement-roi'
                ? 'value-measurement-roi-narrative.html'
                : module.id === 'systems-integration'
                ? 'systems-integration-narrative.html'
                : module.id === 'governance-risk'
                ? 'governance-risk-narrative.html'
                : 'adoption-change-narrative.html';
            const response = await fetch(htmlFile + '?v=' + Date.now());
            if (!response.ok) throw new Error(`Failed to load ${htmlFile}`);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const styles = doc.querySelectorAll('style');
            let styleContent = Array.from(styles).map(s => s.textContent).join('\n');

            styleContent += `
                .workflow-detail-panel__body .page {
                    max-width: none !important;
                    padding: 0 0 4rem !important;
                    margin: 0 !important;
                }
                .workflow-detail-panel__body .hero {
                    padding-top: 0 !important;
                }
                .workflow-detail-panel__body .visual-wrap svg {
                    min-width: 420px !important;
                    max-width: 800px !important;
                    width: 100% !important;
                }
                .workflow-detail-panel__body .pip-sep {
                    color: #525252 !important;
                    font-weight: 600 !important;
                }
                #module-content {
                    overflow: visible !important;
                }
                .workflow-detail-panel__body {
                    overflow: visible !important;
                }
                .phase-nav {
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 1000 !important;
                    background: #ffffff !important;
                    margin-left: -2rem !important;
                    margin-right: -2rem !important;
                    padding-left: 2rem !important;
                    padding-right: 2rem !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
                }
            `;

            const narrativeStyleId = 'narrative-module-styles';
            let existingStyle = document.getElementById(narrativeStyleId);
            if (existingStyle) {
                existingStyle.textContent = styleContent;
            } else {
                const styleEl = document.createElement('style');
                styleEl.id = narrativeStyleId;
                styleEl.textContent = styleContent;
                document.head.appendChild(styleEl);
            }

            const moduleHeader = doc.querySelector('.module-header');
            if (moduleHeader) {
                moduleHeader.remove();
            }

            return doc.body.innerHTML;
        } catch (error) {
            console.error(`Error loading ${module.title} HTML:`, error);
            // Fall through to JSON rendering if file not found
        }
    }

    // Check if this module uses narrative rendering (for other narrative modules)
    if (module.renderType === 'narrative') {
        await renderNarrativeModule(module);
        return; // renderNarrativeModule handles DOM directly for HTML files
    }

    // Define all workflow steps (6 steps)
    const allSteps = [
        { id: 'assess', name: 'Technology & Data Foundations Assessment', phaseGroup: 'Engage' },
        { id: 'map', name: 'Business Process Mapping', phaseGroup: 'Engage' },
        { id: 'analyze', name: 'Workflow Analysis', phaseGroup: 'Discover' },
        { id: 'design', name: 'Solution Design', phaseGroup: 'Discover' },
        { id: 'build', name: 'Experimentation', phaseGroup: 'Execute' },
        { id: 'sustain', name: 'Scale & Adopt', phaseGroup: 'Execute' }
    ];

    // Get relevant step IDs from phaseSections (only primary and supporting-important)
    const relevantStepIds = new Set();
    if (module.phaseSections) {
        module.phaseSections.forEach(section => {
            if (section.stepId && (section.relevance === 'primary' || section.relevance === 'supporting-important')) {
                relevantStepIds.add(section.stepId);
            }
        });
    }

    // Group phaseSections by phaseGroup for accordion rendering
    // Only include phases that have at least one primary or supporting-important section
    const phaseGroups = {};
    if (module.phaseSections) {
        module.phaseSections.forEach(section => {
            const phaseGroup = section.phaseGroup || section.phase || 'Other';
            const relevance = section.relevance || '';
            
            // Only include this phase if it has primary or supporting-important sections
            if (relevance === 'primary' || relevance === 'supporting-important') {
                if (!phaseGroups[phaseGroup]) {
                    phaseGroups[phaseGroup] = [];
                }
                phaseGroups[phaseGroup].push(section);
            }
        });
    }

    // Open all accordions by default for this module
    Object.keys(phaseGroups).forEach(phaseGroup => {
        const accordionId = `${module.id}-${phaseGroup.toLowerCase().replace(/\s+/g, '-')}`;
        if (!(accordionId in openAccordions)) {
            openAccordions[accordionId] = true;
        }
    });

    return `
        <div class="module-detail">
            <!-- Module Header -->
            <div class="panel" style="padding: 2rem; border-bottom: 1px solid var(--border-subtle);">
                <h2>${module.title}</h2>
                <p style="font-size: 1.125rem; color: var(--text-secondary);">${module.definition || module.description || ''}</p>
            </div>

            <!-- Workflow Bubbles - Highlight relevant steps in BLUE -->
            ${relevantStepIds.size > 0 ? `
                <div class="flow-panel" style="background: #fff; padding: 2rem; border-bottom: 1px solid var(--border-subtle);">
                    <h3 class="flow-title">Relevant Workflow Steps</h3>
                    <div class="simple-flow-row">
                        ${allSteps.map((step, index) => {
                            const isRelevant = relevantStepIds.has(step.id);
                            return `
                                <div class="simple-flow-bubble ${isRelevant ? 'relevant-step' : ''}">${step.name}</div>
                                ${index < allSteps.length - 1 ? '<div class="simple-flow-arrow">→</div>' : ''}
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Phase Group Accordions -->
            ${Object.keys(phaseGroups).length > 0 ? `
                <div class="tab-content module-phase-accordions">
                    ${Object.entries(phaseGroups).map(([phaseGroup, sections]) => {
                        const accordionId = `${module.id}-${phaseGroup.toLowerCase().replace(/\s+/g, '-')}`;
                        const isOpen = openAccordions[accordionId];
                        
                        return `
                            <div class="accordion-group">
                                <button class="accordion-header" data-accordion-id="${accordionId}">
                                    <div class="phase-header">
                                        <h2>${phaseGroup}</h2>
                                    </div>
                                    <span class="accordion-icon">${isOpen ? '−' : '+'}</span>
                                </button>
                                
                                ${isOpen ? `
                                    <div class="accordion-content">
                                        ${sections.map(section => {
                                            const examples = [];
                                            if (section.example) {
                                                // Handle both string and object formats
                                                if (typeof section.example === 'string') {
                                                    examples.push({
                                                        title: 'Example',
                                                        description: section.example
                                                    });
                                                } else {
                                                    examples.push(section.example);
                                                }
                                            }
                                            if (section.examples && section.examples.length > 0) {
                                                examples.push(...section.examples);
                                            }
                                            if (section.examplesAndTemplates && section.examplesAndTemplates.length > 0) {
                                                examples.push(...section.examplesAndTemplates);
                                            }
                                            if (section.exampleWhatGoodLooksLike) {
                                                examples.push({
                                                    title: 'What Good Looks Like',
                                                    description: section.exampleWhatGoodLooksLike,
                                                    type: 'example'
                                                });
                                            }

                                            return `
                                            <!-- Step Heading Panel -->
                                            <div class="panel" id="section-${section.stepId}">
                                                <h3>${section.stepName || section.title || ''}</h3>
                                                ${section.stepSubtext ? `<p class="step-subtext">${section.stepSubtext}</p>` : ''}
                                                ${section.description ? `<p class="step-description">${section.description}</p>` : ''}
                                            </div>

                                            ${section.visualHtml ? `
                                                <div class="panel visual-panel">
                                                    ${section.visualHtml}
                                                </div>
                                            ` : ''}

                                            ${section.actions && section.actions.length > 0 ? `
                                                <div class="panel">
                                                    <h4>Key Actions & Outcomes</h4>
                                                    <div class="activities-table">
                                                        <div class="activities-header">
                                                            <div class="activities-col-header">Key Action</div>
                                                            <div class="outcomes-col-header">Description</div>
                                                        </div>
                                                        ${section.actions.map(action => {
                                                            // Handle different action formats
                                                            let actionText = '';
                                                            let description = '';
                                                            
                                                            if (typeof action === 'string') {
                                                                actionText = action;
                                                                description = '';
                                                            } else if (action.title && action.description) {
                                                                // New format: title goes in left column, description in right
                                                                actionText = action.title;
                                                                description = action.description;
                                                            } else {
                                                                // Old format: description goes in left column
                                                                actionText = action.description || action.title || '';
                                                                description = '';
                                                            }
                                                            
                                                            return `
                                                                <div class="activity-row">
                                                                    <div class="activity-col">
                                                                        <div class="activity-title">${actionText}</div>
                                                                    </div>
                                                                    <div class="outcome-col">
                                                                        ${description ? `<p>${description}</p>` : '<p>Supports overall workflow objectives</p>'}
                                                                    </div>
                                                                </div>
                                                            `;
                                                        }).join('')}
                                                    </div>
                                                </div>
                                            ` : ''}

                                            ${section.checklist && section.checklist.length > 0 ? `
                                                <div class="panel">
                                                    <h4>Checklist</h4>
                                                    <ul class="checklist">
                                                        ${section.checklist.map(item => `
                                                            <li class="check-item">☐ ${item}</li>
                                                        `).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}

                                            ${section.artifacts && section.artifacts.length > 0 ? `
                                                <div class="panel">
                                                    <h4>Artifacts & Templates</h4>
                                                    <div class="deliverable-grid">
                                                        ${section.artifacts.map(artifact => renderDeliverableCard(artifact)).join('')}
                                                    </div>
                                                </div>
                                            ` : ''}

                                            ${examples.length > 0 ? `
                                                <div class="panel">
                                                    <h4>Examples</h4>
                                                    ${examples.map(example => {
                                                        const exampleUrl = example.exampleUrl || example.boxUrl || example.url || '';
                                                        const linkIcon = '<svg class="external-link-icon" width="14" height="14" viewBox="0 0 16 16" fill="#0f62fe" aria-hidden="true"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';
                                                        return `
                                                            <div style="margin-bottom: 1rem;">
                                                                <h5 style="margin: 0 0 0.5rem 0;">${example.title || 'Example'}</h5>
                                                                <p style="margin: 0 0 0.5rem 0;">${example.description || ''}</p>
                                                                ${exampleUrl ? `<a class="deliverable-link" href="${exampleUrl}" target="_blank" rel="noopener noreferrer">View Example ${linkIcon}</a>` : ''}
                                                            </div>
                                                        `;
                                                    }).join('')}
                                                </div>
                                            ` : ''}

                                            ${section.commonPitfalls && section.commonPitfalls.length > 0 ? `
                                                <div class="panel">
                                                    <h4>Common Pitfalls</h4>
                                                    <ul class="checklist">
                                                        ${section.commonPitfalls.map(pitfall => `
                                                            <li class="check-item">⚠️ ${pitfall}</li>
                                                        `).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}

                                            ${section.whoToContact ? `
                                                <div class="panel">
                                                    <h4>Who to Contact</h4>
                                                    <p>${section.whoToContact}</p>
                                                </div>
                                            ` : ''}

                                            ${section.readyToAdvance ? `
                                                <div class="ready-to-advance-banner">
                                                    <div class="ready-to-advance-icon">✓</div>
                                                    <div class="ready-to-advance-content">
                                                        <h4>Moving to the next phase</h4>
                                                        <p>${section.readyToAdvance}</p>
                                                    </div>
                                                </div>
                                            ` : ''}
                                        `;
                                        }).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Helper function to get workflow steps related to a module
function getModuleRelatedSteps(moduleId) {
    const relatedSteps = [];
    
    // Map module IDs to their related workflow steps
    const moduleStepMapping = {
        'value-measurement-roi': [
            { stepId: 'assess', relevance: 'supporting' },
            { stepId: 'analyze', relevance: 'primary' },
            { stepId: 'design', relevance: 'supporting' },
            { stepId: 'build', relevance: 'supporting' },
            { stepId: 'sustain', relevance: 'primary' }
        ],
        'prioritization-roadmap': [
            { stepId: 'assess', relevance: 'primary' },
            { stepId: 'analyze', relevance: 'primary' },
            { stepId: 'design', relevance: 'supporting' },
            { stepId: 'build', relevance: 'supporting' },
            { stepId: 'sustain', relevance: 'supporting' }
        ],
        'systems-integration': [
            { stepId: 'assess', relevance: 'supporting' },
            { stepId: 'analyze', relevance: 'primary' },
            { stepId: 'design', relevance: 'primary' },
            { stepId: 'build', relevance: 'primary' },
            { stepId: 'sustain', relevance: 'supporting' }
        ],
        'adoption-change': [
            { stepId: 'assess', relevance: 'supporting' },
            { stepId: 'analyze', relevance: 'supporting' },
            { stepId: 'design', relevance: 'primary' },
            { stepId: 'build', relevance: 'supporting-important' },
            { stepId: 'sustain', relevance: 'primary' }
        ],
        'governance-risk': [
            { stepId: 'assess', relevance: 'primary' },
            { stepId: 'analyze', relevance: 'supporting' },
            { stepId: 'design', relevance: 'primary' },
            { stepId: 'build', relevance: 'supporting' },
            { stepId: 'sustain', relevance: 'supporting-important' }
        ]
    };
    
    const mapping = moduleStepMapping[moduleId];
    if (!mapping) return relatedSteps;
    
    // Get all workflow steps from phaseGroups
    content.endToEndWorkflow.phaseGroups.forEach(phaseGroup => {
        phaseGroup.steps.forEach(step => {
            const relevanceInfo = mapping.find(m => m.stepId === step.id);
            if (relevanceInfo) {
                relatedSteps.push({
                    ...step,
                    relevance: relevanceInfo.relevance
                });
            }
        });
    });
    
    return relatedSteps;
}

// ============================================================================
// LIBRARY PAGE
// ============================================================================

function renderLibraryPage() {
    const main = document.getElementById('main-content');

    // Canonical 6-step model
    const steps = [
        { id: 'assess',  num: 1, label: 'Tech & Data Foundations Assessment', phaseGroup: 'Engage',   color: '#0f62fe' },
        { id: 'map',     num: 2, label: 'Business Process Mapping',            phaseGroup: 'Engage',   color: '#0f62fe' },
        { id: 'design',  num: 3, label: 'Solution Design',                     phaseGroup: 'Discover', color: '#8a3ffc' },
        { id: 'analyze', num: 4, label: 'Solution Design',                     phaseGroup: 'Discover', color: '#8a3ffc' },
        { id: 'build',   num: 5, label: 'Build',                               phaseGroup: 'Execute',  color: '#24a148' },
        { id: 'sustain', num: 6, label: 'Scale & Sustain',                     phaseGroup: 'Execute',  color: '#24a148' },
    ];

    // Artifact list from Deliverable Library(MASTER) CSV
    const libraryArtifacts = {
        assess: [
            { title: 'Current State Processes',               description: 'Captures the domain\'s people (personas), process/workflows, technology (current tools), data, operating model, and readiness baseline. The honest "where we are today" snapshot.', exampleUrl: 'https://ibm.ent.box.com/file/2181697907530?s=p0abbfft3jumintcy8aw5hewshs2y7fc', templateUrl: 'https://app.mural.co/t/ibm14/template/5ec28fbf-bf8a-45d2-ba44-2deece7f57aa' },
            { title: 'Technology & Data Readiness Checklist', description: 'Confirms systems, data sources, owners, quality, access, architecture, and security constraints. Functions as a mechanism to determine foundational challenges to address before or during solution planning and execution.', exampleUrl: 'https://ibm.ent.box.com/file/2181697907530?s=p0abbfft3jumintcy8aw5hewshs2y7fc', templateUrl: 'https://app.mural.co/t/ibm14/m/ibm14/1775762796754/5e602df33f7af263fd214eeac33feb07e743b699' },
            { title: 'Opportunity Sizing',                    description: 'Quantifies the value case tied to the balance sheet or G&A: baseline, target, investment, and ROI.', exampleUrl: 'https://ibm.sharepoint.com/:p:/s/AI-FirstTransformation_DEPT/IQBDcXuPEIIgRrgHXWaysiztASt6kB0eXgGOrx21FImrQ3s?e=6op8fO', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQD0dcK64H2TRLWnnkJ-mauPAZM_N3RX7ggd3h9W-O40gjg?e=dEu7nm' },
        ],
        map: [
            { title: 'Business Process Map(s)',               description: 'Documents the current-state workflow: handoffs, systems, users, bottlenecks, and automation opportunities.', exampleUrl: 'https://app.mural.co/template/a3fd5e2a-cfdf-4ad6-9887-066521fc6ab1/abc1ccf2-0482-4aa0-8a6c-0cede7949984', templateUrl: 'https://ibm.box.com/s/5c43ream7jq8ezi0boiobmhslhpachwk' },
            { title: 'RACI Matrix',                           description: 'Aligns who owns what throughout the scope of a project.', exampleUrl: '', templateUrl: 'https://ibm.box.com/s/tlmaok691csupb2w7543u44rdv5gg42u' },
            { title: 'RAID Log',                              description: 'Tracks risks, assumptions, issues, and dependencies throughout the transformation. Reviewed at every steering committee.', exampleUrl: '', templateUrl: '' },
            { title: 'Project Plan',                          description: 'A one-page agreement that scopes the transformation before kickoff: the mandate, value target, sponsor, team, timeline, and sign-off. If you can\'t complete it, you\'re not ready to start.', exampleUrl: 'https://ibm.box.com/s/2ryvfmucrpobe9rd6hjvbklts39nxvfp', templateUrl: 'https://ibm.box.com/s/0saqdnp1643lu8eb9ko73kqdzj4xaxr8' },
            { title: 'Prioritization Matrix',                 description: 'Ranks opportunities by value, feasibility, data readiness, urgency, user impact, and scale to select the MVP.', exampleUrl: 'https://ibm.box.com/s/39ul2emcnloib0optj35z02ubgoldddj', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQDADuvng2XWRJoCXBNsY7GJATPoUKpijjuaCWjNzqNXIts?e=552rrQ' },
        ],
        design: [
            { title: 'Business Requirements Log',             description: 'The build-ready package covering persona, workflow, actions, systems, data, acceptance criteria, technical specification, and solution architecture.', exampleUrl: 'https://ibm.ent.box.com/file/2147631391114?s=307v7h8kgdvk2x34wlltbhnoy3md8r5g', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQDADuvng2XWRJoCXBNsY7GJATPoUKpijjuaCWjNzqNXIts?e=rBkhCW' },
            { title: 'Business Case Template',                description: 'Quantifies the value case tied to the balance sheet or G&A: baseline, target, investment, and ROI. Supports build vs. make decision.', exampleUrl: 'https://ibm.sharepoint.com/:p:/s/AI-FirstTransformation_DEPT/IQBDcXuPEIIgRrgHXWaysiztASt6kB0eXgGOrx21FImrQ3s?e=6op8fO', templateUrl: 'https://ibm.box.com/s/l95797tw7rhiudkipa261ofa2yw2v6tv' },
            { title: 'Future State Workflow Process Map',     description: 'A user-perspective future-state journey: how the person\'s work changes, where AI enters, and where the human stays in the loop.', exampleUrl: '', templateUrl: 'https://ibm.box.com/s/5c43ream7jq8ezi0boiobmhslhpachwk' },
        ],
        analyze: [
            { title: 'Strategic Roadmap',                     description: 'The roadmap for MVP, pilot, production, scale, backlog, dependencies, cadence, and next releases. Includes UAT strategy and planning.', exampleUrl: 'https://ibm.box.com/s/gs5ep0mshvtic6nl4k8wljdcy7d6bqm8', templateUrl: 'https://ibm.box.com/s/z3lzjel4frfrhyi6bnmroci062gotuej' },
            { title: 'Build vs. Buy',                         description: 'Documents the decision framework and rationale for whether to build a custom solution or procure an existing product.', exampleUrl: 'https://ibm.sharepoint.com/:p:/s/AI-FirstTransformation_DEPT/IQA1wQK4UT2nRa8c4zqc_5ReAa-YQ5NS8XDaBFTeYhUIp00?e=HaSObe', templateUrl: 'https://ibm.sharepoint.com/:p:/s/AI-FirstTransformation_DEPT/IQD23K6rqBsZRIrXdDZLRilHAZ-ZCREA8DlKaTrpTFNYFyY?e=eA88xg' },
            { title: 'Change Management Plan',                description: 'Plans users, UAT, communications, training, feedback loops, and resistance handling — started early, not at the end. Includes support and maintenance, scaling recs, and governance.', exampleUrl: 'https://ibm-my.sharepoint.com/:p:/r/personal/claireliu_ibm_com/Documents/Documents/AIFT/03%20Enterprise%20Transformation%20%26%20AI%20Value%20Creation/03%20Domain%20Transformation/04%20Procurement%20Domain/02%20Lesseps%202.0%20S2P%20and%20AP%20Transformation/Key%20Documents%20-%20S2P%20Sprint/SteerCo/13%20-%20(Apr%2028,%202026)/S2P%20-%20Change%20Management%20Update%20v3%20(1).pptx?d=w99c87ece3bfe48a5a88f099c6f4cb5f2&csf=1&web=1&e=3jUkH0', templateUrl: '' },
        ],
        build: [
            { title: 'SteerCo Charter',                       description: 'Agenda, attendance, red/yellow/green norms, decision log, escalation rules, and governance structure for running the steering committee.', exampleUrl: '', templateUrl: 'https://ibm-my.sharepoint.com/:p:/r/personal/claireliu_ibm_com/Documents/Documents/AIFT/03%20Enterprise%20Transformation%20%26%20AI%20Value%20Creation/03%20Domain%20Transformation/04%20Procurement%20Domain/02%20Lesseps%202.0%20S2P%20and%20AP%20Transformation/Key%20Documents%20-%20S2P%20Sprint/SteerCo/4%20-%20(Feb%2025,%202026)%20SteerCo/Archive/S2P%20SteerCo%203%20(Feb%2024,%202026).pptx?d=w6d708fe51bb441fe9d062635d26de1ce&csf=1&web=1&e=8345u8' },
            { title: 'Defect Tracker',                        description: 'Tracks defects by sprint, severity, owner, status, and resolution. Reviewed at every steering meeting.', exampleUrl: 'https://ibm.box.com/s/4u01cvbmd8ymve7yuq6n5gkaubowpman', templateUrl: '' },
            { title: 'ROI Analysis',                          description: 'A reference comparing ROI assumptions against pilot evidence, usage analytics, workflow impact, and validated value.', exampleUrl: 'https://ibm.ent.box.com/file/2181697907530?s=p0abbfft3jumintcy8aw5hewshs2y7fc', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQB58b_27SAtT4nGAUm8FzZUAYvipHEopduep5tAqT3z6rQ?e=hFAHLT' },
            { title: 'KPI Dashboard',                         description: 'Post-launch reporting for realized value, Finance/EBM validation, KPI review, and leadership updates. Created during MVP.', exampleUrl: 'https://ibm.ent.box.com/file/2146417828092?s=66k01mp14dwbukj073me2rzmjpjfbgfr', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQCQ3Rmw9q_jRLQMZ6IdmN6NAZQTz9-DN2B362yrpREMLD4?e=UZJJbz' },
        ],
        sustain: [
            { title: 'Operational Health Dashboard',          description: 'A reference dashboard for adoption, usage, value realization, operational performance, and support health.', exampleUrl: 'https://ibm.ent.box.com/file/2146417828092?s=66k01mp14dwbukj073me2rzmjpjfbgfr', templateUrl: 'https://ibm.sharepoint.com/:x:/s/AI-FirstTransformation_DEPT/IQCQ3Rmw9q_jRLQMZ6IdmN6NAZQTz9-DN2B362yrpREMLD4?e=UZJJbz' },
        ],
    };

    const activeStep = steps.find(s => s.id === selectedLibraryStep) || steps[0];
    selectedLibraryStep = activeStep.id;
    const items = libraryArtifacts[activeStep.id] || [];

    // Build detail content for active step
    const cardsHtml = items.length
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.875rem;">
            ${items.map(a => {
                const exampleUrl = (a.exampleUrl || '').trim();
                const templateUrl = (a.templateUrl || '').trim();
                const exampleLink = exampleUrl
                    ? `<a class="a-link" href="${exampleUrl}" target="_blank" rel="noopener noreferrer">↗ Example</a>`
                    : `<span class="a-link off">↗ Example</span>`;
                const templateLink = templateUrl
                    ? `<a class="a-link" href="${templateUrl}" target="_blank" rel="noopener noreferrer">↗ Template</a>`
                    : `<span class="a-link off">↗ Template</span>`;
                return `<div class="artifact-card" style="display:flex;flex-direction:column;">
                    <div class="a-title">${a.title}</div>
                    <div class="a-desc" style="flex:1;">${a.description || ''}</div>
                    <div class="a-links">${exampleLink}${templateLink}</div>
                </div>`;
            }).join('')}
           </div>`
        : `<p style="color:var(--text-secondary);">No artifacts defined for this step yet.</p>`;

    main.innerHTML = `
        <section class="workflow-layout workflow-layout--with-top-offset" aria-label="Deliverables library">
            <nav class="workflow-side-nav" aria-label="Library step navigation">
                <ul class="workflow-side-nav__list">
                    ${steps.map(s => `
                        <li class="workflow-side-nav__item">
                            <button class="workflow-side-nav__button${s.id === activeStep.id ? ' is-active' : ''}"
                                data-lib-step="${s.id}">
                                <span style="font-size:0.7rem;font-weight:600;color:${s.color};display:block;margin-bottom:0.1rem;text-transform:uppercase;letter-spacing:.06em;">Step ${s.num} · ${s.phaseGroup}</span>
                                ${s.label}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </nav>
            <div class="workflow-detail-panel">
                <div class="workflow-detail-panel__header">
                    <p class="workflow-detail-panel__meta">${activeStep.phaseGroup} · Step ${activeStep.num}</p>
                    <h2>${activeStep.label}</h2>
                    <p class="workflow-step-description">${items.length} artifact${items.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="workflow-detail-panel__body">
                    ${cardsHtml}
                </div>
            </div>
        </section>
    `;

    document.querySelectorAll('[data-lib-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedLibraryStep = btn.dataset.libStep;
            renderLibraryPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ============================================================================
// CASE STUDY PAGE
// ============================================================================

async function renderCaseStudyPage() {
    const main = document.getElementById('main-content');

    // The 6 canonical workflow steps — labels match the nav and the new HTML file
    const WORKFLOW_STEPS = [
        { id: 'assess',  num: 1, label: 'Step 1 · Tech & Data Assessment',   phaseGroup: 'Engage',   phaseTag: 'tag-e', timing: 'Upfront · 1–2 weeks'         },
        { id: 'map',     num: 2, label: 'Step 2 · Business Process Mapping', phaseGroup: 'Engage',   phaseTag: 'tag-e', timing: 'Upfront · 1–2 weeks'         },
        { id: 'analyze', num: 3, label: 'Step 3 · Workflow Analysis',        phaseGroup: 'Discover', phaseTag: 'tag-d', timing: '~2 weeks per workflow'        },
        { id: 'design',  num: 4, label: 'Step 4 · Solution Design',          phaseGroup: 'Discover', phaseTag: 'tag-d', timing: '~2 weeks per workflow'        },
        { id: 'build',   num: 5, label: 'Step 5 · Experimentation',          phaseGroup: 'Execute',  phaseTag: 'tag-x', timing: '90 days'                      },
        { id: 'sustain', num: 6, label: 'Step 6 · Scale & Adopt',            phaseGroup: 'Execute',  phaseTag: 'tag-x', timing: '30–180 days post-launch'      },
    ];

    const navSections = [
        { id: 'cs-overview', label: 'Overview' },
        ...WORKFLOW_STEPS.map(s => ({ id: `cs-${s.id}`, label: s.label }))
    ];

    const activeSectionId = selectedCaseStudyPhase === -1
        ? 'cs-overview'
        : `cs-${WORKFLOW_STEPS[Math.min(selectedCaseStudyPhase, 5)].id}`;

    // Render the shell immediately so the sidebar is visible
    main.innerHTML = `
        <section class="workflow-layout workflow-layout--with-top-offset" aria-label="Case study content">
            <nav class="workflow-side-nav" aria-label="Case study step navigation">
                <ul class="workflow-side-nav__list">
                    ${navSections.map(s => `
                        <li class="workflow-side-nav__item">
                            <button class="workflow-side-nav__button${s.id === activeSectionId ? ' is-active' : ''}"
                                data-cs-section="${s.id}">
                                ${s.label}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </nav>
            <div class="workflow-detail-panel">
                <div id="cs-detail-content" style="min-height:200px;"></div>
            </div>
        </section>
    `;

    // Wire up nav buttons
    document.querySelectorAll('[data-cs-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.csSection;
            selectedCaseStudyPhase = id === 'cs-overview'
                ? -1
                : WORKFLOW_STEPS.findIndex(s => `cs-${s.id}` === id);
            renderCaseStudyPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Fetch and parse the standalone HTML file
    let doc;
    try {
        const res = await fetch('case-study-standalone_jul30.html?v=' + Date.now());
        if (!res.ok) throw new Error('fetch failed');
        const html = await res.text();
        const parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');

        // Inject the standalone file's styles once.
        // The standalone CSS uses only literal hex values — no :root/:body/* rules —
        // so it is safe to inject directly with no transformation needed.
        const styleId = 'cs-standalone-styles';
        if (!document.getElementById(styleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.textContent = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n');
            document.head.appendChild(styleEl);
        }
    } catch (e) {
        document.getElementById('cs-detail-content').innerHTML =
            `<p style="color:#da1e28;padding:2rem;">Could not load case study content.</p>`;
        return;
    }

    const container = document.getElementById('cs-detail-content');

    if (selectedCaseStudyPhase === -1) {
        // Overview: render the cs-header section from the standalone file
        const header = doc.querySelector('.cs-header');
        container.innerHTML = header ? header.outerHTML : '<p>Overview not found.</p>';
    } else {
        const step = WORKFLOW_STEPS[selectedCaseStudyPhase];
        const panel = doc.getElementById(`step${step.num}-panel`);
        const panelContent = panel ? panel.innerHTML : '<p>Content not found.</p>';

        container.innerHTML = `
            <div class="workflow-detail-panel__header" style="margin-bottom:1.5rem;">
                <p class="workflow-detail-panel__meta" style="margin:0 0 .25rem;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-secondary);">${step.phaseGroup}</p>
                <h2 style="margin:0 0 .375rem;font-size:clamp(1.25rem,2.5vw,1.75rem);font-weight:600;line-height:1.2;">${step.label}</h2>
                <p style="margin:0;font-size:.875rem;color:var(--text-secondary);">${step.timing}</p>
            </div>
            ${panelContent}
        `;
    }
}

function renderCaseStudyPhaseHtml(phase, COLORS) {
    const c = COLORS[phase.phaseGroupId] || '#0f62fe';
    const fileIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
    const checkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';

    let html = `
        <div class="workflow-detail-panel__header" style="margin-bottom:1.5rem;">
            <p class="workflow-detail-panel__meta">${phase.phaseGroup} · ${phase._label || phase.phaseName}</p>
            <h2 style="margin:0 0 0.5rem;font-size:clamp(1.5rem,3vw,2.25rem);font-weight:400;">${phase.phaseName}</h2>
            ${phase._stub ? `<p style="color:#da1e28;font-size:0.8125rem;font-weight:600;">⚠ Content placeholder — this step will be filled out as the case study is developed.</p>` : ''}
            <p style="margin:0;font-size:0.9375rem;color:var(--text-secondary);line-height:1.6;font-style:italic;">"${phase.mindset}"</p>
        </div>
        <div class="panel" style="margin-bottom:1rem;">
            <p>${phase.summary}</p>
        </div>
    `;

    if (phase.keyActions && phase.keyActions.length) {
        html += `
            <div class="block">
                <div class="sec-label">Key Actions</div>
                <ol class="actions">${phase.keyActions.map(a => `<li>${a}</li>`).join('')}</ol>
            </div>`;
    }

    if (phase.comparison) {
        html += `<div class="block"><div class="sec-label">Comparing the candidates</div><div class="chips">`;
        html += phase.comparison.map(w => `<span class="chip">${w.workflow} · ${w.pain}</span>`).join('');
        html += `</div>`;
        if (phase.mvpDecision) html += `<div style="margin-top:14px;padding:14px 16px;border:1px solid ${c};background:#faf7ff;border-radius:9px"><strong style="color:${c}">Decision:</strong> ${phase.mvpDecision}. <span style="color:var(--text-secondary)">${phase.mvpRationale}</span></div>`;
        html += `</div>`;
    }

    if (phase.metrics) {
        const keys = Object.keys(phase.metrics.baseline);
        html += `<div class="block"><div class="sec-label">Baseline → Target</div><div class="metrics">
            <div class="metric-row head"><div>Measure</div><div>Baseline</div><div>Target</div></div>
            ${keys.map(k => `<div class="metric-row"><div>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div><div class="b4">${phase.metrics.baseline[k]}</div><div class="af">${phase.metrics.target[k]}</div></div>`).join('')}
        </div></div>`;
    }

    if (phase.documents && phase.documents.length) {
        const linkIcon = '<svg width="13" height="13" viewBox="0 0 16 16" fill="#0f62fe"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';
        html += `<div class="block"><div class="sec-label">Documents created this step</div><div class="docs">
            ${phase.documents.map(d => {
                const ex = (d.exampleUrl && d.exampleUrl.trim()) || '';
                const tm = (d.templateUrl && d.templateUrl.trim()) || (d.file && d.file.trim()) || '';
                const links = [];
                if (ex) links.push(`<a class="doc-link" href="${ex}" target="_blank" rel="noopener">Example ${linkIcon}</a>`);
                if (tm) links.push(`<a class="doc-link" href="${tm}" target="_blank" rel="noopener">Template ${linkIcon}</a>`);
                return `<div class="doc"><span class="doc-ic">${fileIcon}</span><span class="doc-body"><span class="doc-name">${d.name}</span>${links.length ? `<span class="doc-links">${links.join('')}</span>` : ''}</span></div>`;
            }).join('')}
        </div></div>`;
    }

    if (phase.operatingRhythm) {
        html += `<div class="block"><div class="sec-label">Operating rhythm</div><div class="rhythm">${phase.operatingRhythm.map(r => `<div class="r"><span class="dot"></span>${r}</div>`).join('')}</div></div>`;
    }

    if (phase.sideways && phase.sideways.length) {
        html += `<div class="block"><div class="sec-label">What went sideways</div>`;
        html += phase.sideways.map(s => `<div class="sideways">
            <div class="sw-head"><span class="sw-ic">⚠️</span><span class="sw-t">Real friction the team hit</span></div>
            <div class="sw-body">
                <div class="sw-cell"><h5>What happened</h5><p>${s.issue}</p></div>
                <div class="sw-cell"><h5>How they handled it</h5><p>${s.howHandled}</p></div>
            </div>
        </div>`).join('');
        html += `</div>`;
    }

    if (phase.evidence && phase.evidence.length) {
        html += `<div class="block"><div class="sec-label">Evidence it worked</div><div class="evidence">${phase.evidence.map(e => `<div class="ev">${checkIcon}<span>${e}</span></div>`).join('')}</div></div>`;
    }

    if (phase.takeaways && phase.takeaways.length) {
        html += `<div class="block" style="margin-bottom:0"><div class="sec-label">What to take away</div><ul class="takeaways">${phase.takeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
    }

    return html;
}

async function renderCaseStudyPhaseContent() {
    const container = document.getElementById('case-study-phase-content');
    const caseStudy = content.caseStudy;
    
    if (!container || !caseStudy.phases || !caseStudy.phases[selectedCaseStudyPhase]) {
        return;
    }
    
    const phase = caseStudy.phases[selectedCaseStudyPhase];
    const COLORS = { engage: '#0f62fe', discover: '#8a3ffc', execute: '#24a148' };
    const c = COLORS[phase.phaseGroupId] || '#0f62fe';
    const fileIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
    const checkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
    
    let html = `
        <div class="phase-panel phase-${phase.phaseGroupId}" style="--c:${c}">
            <div class="pp-head">
                <span class="pp-group-badge">${phase.phaseGroup}</span>
                <span class="pp-num">${phase.number} of ${caseStudy.phases.length}</span>
            </div>
            <div class="pp-name">${phase.phaseName}</div>
            <div class="pp-mindset">"${phase.mindset}"</div>
            <p class="pp-summary">${phase.summary}</p>
    `;
    
    // Add blueprint for Analyze phase (View 3 - Before/Current State)
    if (phase.phaseName && phase.phaseName.includes('Analyze')) {
        const blueprintSVG = await loadBlueprintSVG(3);
        html += `
            <div class="block">
                <div class="sec-label">Current State Process Map</div>
                <div class="blueprint-container">
                    ${blueprintSVG}
                </div>
            </div>
        `;
    }
    
    // Add blueprint for Design phase (View 4 - After/Future State)
    if (phase.phaseName && phase.phaseName.includes('Design')) {
        const blueprintSVG = await loadBlueprintSVG(4);
        html += `
            <div class="block">
                <div class="sec-label">Future State Process Map (MVP)</div>
                <div class="blueprint-container">
                    ${blueprintSVG}
                </div>
            </div>
        `;
    }
    
    // ---- STEP-BY-STEP KEY ACTIONS ----
    if (phase.keyActions && phase.keyActions.length) {
        html += `
            <div class="block">
                <div class="sec-label">Key Actions (Step-by-Step)</div>
                <ol class="actions">${phase.keyActions.map(action => `<li>${action}</li>`).join('')}</ol>
            </div>`;
    }
    
    // comparison (analyze phase)
    if (phase.comparison) {
        html += `<div class="block"><div class="sec-label">Comparing the candidates</div><div class="chips">`;
        html += phase.comparison.map(w => `<span class="chip">${w.workflow} · ${w.pain}</span>`).join('');
        html += `</div>`;
        if (phase.mvpDecision) html += `<div style="margin-top:14px;padding:14px 16px;border:1px solid ${c};background:#faf7ff;border-radius:9px"><strong style="color:${c}">Decision:</strong> ${phase.mvpDecision}. <span style="color:var(--text-secondary)">${phase.mvpRationale}</span></div>`;
        html += `</div>`;
    }
    
    // metrics (analyze)
    if (phase.metrics) {
        const keys = Object.keys(phase.metrics.baseline);
        html += `<div class="block"><div class="sec-label">Baseline → Target</div><div class="metrics">
            <div class="metric-row head"><div>Measure</div><div>Baseline</div><div>Target</div></div>
            ${keys.map(k => `<div class="metric-row"><div>${k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</div><div class="b4">${phase.metrics.baseline[k]}</div><div class="af">${phase.metrics.target[k]}</div></div>`).join('')}
        </div></div>`;
    }
    
    // documents created this phase
    if (phase.documents && phase.documents.length) {
        const linkIcon = '<svg width="13" height="13" viewBox="0 0 16 16" fill="#0f62fe" aria-hidden="true"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';
        html += `<div class="block"><div class="sec-label">Documents created this phase</div><div class="docs">
            ${phase.documents.map(d => {
                const ex = (d.exampleUrl && d.exampleUrl.trim()) || '';
                const tm = (d.templateUrl && d.templateUrl.trim()) || (d.file && d.file.trim()) || '';
                const links = [];
                if (ex) links.push(`<a class="doc-link" href="${ex}" target="_blank" rel="noopener noreferrer">Example ${linkIcon}</a>`);
                if (tm) links.push(`<a class="doc-link" href="${tm}" target="_blank" rel="noopener noreferrer">Template ${linkIcon}</a>`);
                return `<div class="doc">
                    <span class="doc-ic">${fileIcon}</span>
                    <span class="doc-body"><span class="doc-name">${d.name}</span>${links.length ? `<span class="doc-links">${links.join('')}</span>` : ''}</span>
                </div>`;
            }).join('')}
        </div></div>`;
    }
    
    // operating rhythm (build)
    if (phase.operatingRhythm) {
        html += `<div class="block"><div class="sec-label">Operating rhythm</div><div class="rhythm">${phase.operatingRhythm.map(r => `<div class="r"><span class="dot"></span>${r}</div>`).join('')}</div></div>`;
    }
    
    // sideways - what went wrong and how it was handled
    if (phase.sideways && phase.sideways.length) {
        html += `<div class="block"><div class="sec-label">What went sideways</div>`;
        html += phase.sideways.map(s => `<div class="sideways">
            <div class="sw-head"><span class="sw-ic">⚠️</span><span class="sw-t">Real friction the team hit</span></div>
            <div class="sw-body">
                <div class="sw-cell"><h5>What happened</h5><p>${s.issue}</p></div>
                <div class="sw-cell"><h5>How they handled it</h5><p>${s.howHandled}</p></div>
            </div>
        </div>`).join('');
        html += `</div>`;
    }
    
    // evidence (build / sustain)
    if (phase.evidence && phase.evidence.length) {
        html += `<div class="block"><div class="sec-label">Evidence it worked</div><div class="evidence">${phase.evidence.map(e => `<div class="ev">${checkIcon}<span>${e}</span></div>`).join('')}</div></div>`;
    }
    
    // takeaways
    if (phase.takeaways && phase.takeaways.length) {
        html += `<div class="block" style="margin-bottom:0"><div class="sec-label">What to take away</div><ul class="takeaways">${phase.takeaways.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// Navigation functions for phase buttons
function navigateToPreviousPhase() {
    if (selectedCaseStudyPhase > 0) {
        selectedCaseStudyPhase--;
        renderCaseStudyPhaseContent();
        // Update tab active state
        document.querySelectorAll('.section-tab[data-phase-index]').forEach(t => {
            t.classList.toggle('active', parseInt(t.dataset.phaseIndex) === selectedCaseStudyPhase);
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function navigateToNextPhase() {
    if (selectedCaseStudyPhase < content.caseStudy.phases.length - 1) {
        selectedCaseStudyPhase++;
        renderCaseStudyPhaseContent();
        // Update tab active state
        document.querySelectorAll('.section-tab[data-phase-index]').forEach(t => {
            t.classList.toggle('active', parseInt(t.dataset.phaseIndex) === selectedCaseStudyPhase);
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderCaseStudyPhase(phase) {
    return `
        <div class="case-study-phase" style="margin-bottom: 3rem;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <span class="phase-pill phase-${phase.phaseGroupId}">${phase.phaseGroup}</span>
                <h2 style="margin: 0;">${phase.phaseName}</h2>
            </div>
            
            <p style="font-style: italic; color: var(--text-secondary); margin-bottom: 1rem;">"${phase.mindset}"</p>
            <p style="margin-bottom: 1.5rem;">${phase.summary}</p>
            
            ${phase.keyActions && phase.keyActions.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h4>Key Actions</h4>
                    <ul class="activity-list">
                        ${phase.keyActions.map(action => `
                            <li class="activity-item">${action}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${phase.timeline ? `
                <div style="margin-bottom: 1.5rem;">
                    <h4>Timeline: ${phase.timeline.duration}</h4>
                    ${phase.timeline.weeks && phase.timeline.weeks.length > 0 ? `
                        <div class="timeline-container">
                            ${phase.timeline.weeks.map(week => `
                                <div class="timeline-week">
                                    <div class="timeline-bubble">
                                        <div class="timeline-week-num">Week ${week.num}</div>
                                        <div class="timeline-week-label">${week.label}</div>
                                    </div>
                                    <div class="timeline-content">
                                        ${week.did && week.did.length > 0 ? `
                                            <ul style="margin: 0; padding-left: 1.25rem;">
                                                ${week.did.map(item => `<li>${item}</li>`).join('')}
                                            </ul>
                                        ` : ''}
                                        ${week.docs && week.docs.length > 0 ? `
                                            <div style="margin-top: 0.5rem;">
                                                <strong>Documents:</strong> ${week.docs.join(', ')}
                                            </div>
                                        ` : ''}
                                        ${week.blocker ? `
                                            <div class="blocker-box">
                                                <strong>⚠️ Blocker:</strong> ${week.blocker.issue}<br>
                                                <strong>How handled:</strong> ${week.blocker.handled}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${phase.takeaways && phase.takeaways.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h4>Key Takeaways</h4>
                    <ul class="activity-list">
                        ${phase.takeaways.map(takeaway => `
                            <li class="activity-item">💡 ${takeaway}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
}

// Made with Bob
