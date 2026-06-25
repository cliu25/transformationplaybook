// AI for Transformation Playbook - Vanilla JS Implementation
// Replicates v4 React functionality exactly

// Global state
let content = null;
let artifactInventory = null;
let currentRoute = '/workflow';
let openAccordions = {};
let activeWorkflowTab = 'engage';
let selectedModule = 'overview';
let selectedCaseStudyPhase = 0; // Track which phase is currently displayed

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
    
    // Handle initial route
    const path = window.location.pathname;
    if (path.includes('/modules')) {
        navigateTo('/modules');
    } else if (path.includes('/library')) {
        navigateTo('/library');
    } else if (path.includes('/case-study')) {
        navigateTo('/case-study');
    } else {
        navigateTo('/workflow');
    }
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.route) {
            navigateTo(e.state.route, false);
        }
    });
}

// ============================================================================
// SEARCH FUNCTIONALITY
// ============================================================================

function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        // Don't close if clicking on a search result item
        if (e.target.closest('.search-result-item')) {
            return;
        }
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
    
    // Handle clicks on search results using event delegation
    searchResults.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const index = parseInt(resultItem.dataset.resultIndex);
            if (window.searchResultsData && window.searchResultsData[index]) {
                window.searchResultsData[index].action();
                searchResults.classList.remove('active');
            }
        }
    });
    
    // Reopen results when clicking on input if there's a query
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            performSearch(searchInput.value.trim());
        }
    });
}

function performSearch(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    // Search in workflow steps (endToEndWorkflow structure)
    if (content.endToEndWorkflow && content.endToEndWorkflow.phaseGroups) {
        content.endToEndWorkflow.phaseGroups.forEach(phaseGroup => {
            phaseGroup.steps.forEach(step => {
                const matches = [];
                
                if (step.name && step.name.toLowerCase().includes(queryLower)) {
                    matches.push({ field: 'title', text: step.name });
                }
                if (step.briefDescription && step.briefDescription.toLowerCase().includes(queryLower)) {
                    matches.push({ field: 'description', text: step.briefDescription });
                }
                if (step.idealTimespan && step.idealTimespan.toLowerCase().includes(queryLower)) {
                    matches.push({ field: 'timespan', text: step.idealTimespan });
                }
                
                // Search in key activities
                if (step.keyActivities) {
                    step.keyActivities.forEach(activity => {
                        if (activity.title && activity.title.toLowerCase().includes(queryLower)) {
                            matches.push({ field: 'activity', text: activity.title });
                        }
                        if (activity.description && activity.description.toLowerCase().includes(queryLower)) {
                            matches.push({ field: 'activity', text: activity.description });
                        }
                    });
                }
                
                if (matches.length > 0) {
                    results.push({
                        type: 'workflow',
                        title: step.name,
                        path: `End-to-End Workflow > ${phaseGroup.name}`,
                        matches: matches,
                        action: () => {
                            currentRoute = '/workflow';
                            activeWorkflowTab = phaseGroup.id.toLowerCase();
                            renderNavigation();
                            renderWorkflowPage();
                            document.getElementById('search-results').classList.remove('active');
                        }
                    });
                }
            });
        });
    }
    
    // Search in modules
    const modulesArray = content.modules && content.modules.chapters ? content.modules.chapters : [];
    modulesArray.forEach(module => {
        module.phaseSections.forEach(section => {
            const matches = [];
            
            if (section.stepTitle && section.stepTitle.toLowerCase().includes(queryLower)) {
                matches.push({ field: 'title', text: section.stepTitle });
            }
            if (section.stepSubtext && section.stepSubtext.toLowerCase().includes(queryLower)) {
                matches.push({ field: 'subtext', text: section.stepSubtext });
            }
            if (section.briefDescription && section.briefDescription.toLowerCase().includes(queryLower)) {
                matches.push({ field: 'description', text: section.briefDescription });
            }
            
            // Search in actions
            if (section.actions) {
                section.actions.forEach(action => {
                    if (typeof action === 'string') {
                        if (action.toLowerCase().includes(queryLower)) {
                            matches.push({ field: 'action', text: action });
                        }
                    } else if (action.description) {
                        if (action.description.toLowerCase().includes(queryLower)) {
                            matches.push({ field: 'action', text: action.description });
                        }
                    }
                });
            }
            
            if (matches.length > 0) {
                results.push({
                    type: 'module',
                    title: section.stepTitle || section.phaseId,
                    path: `Key Challenges > ${module.title}`,
                    matches: matches,
                    action: () => {
                        currentRoute = '/modules';
                        selectedModule = module.id;
                        renderNavigation();
                        renderModulesPage();
                        document.getElementById('search-results').classList.remove('active');
                        
                        // Scroll to the section
                        setTimeout(() => {
                            const sectionElement = document.querySelector(`[data-phase-id="${section.phaseId}"]`);
                            if (sectionElement) {
                                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 100);
                    }
                });
            }
        });
    });
    
    // Search in case study
    content.caseStudy.phases.forEach((phase, index) => {
        const matches = [];
        
        if (phase.phaseName && phase.phaseName.toLowerCase().includes(queryLower)) {
            matches.push({ field: 'title', text: phase.phaseName });
        }
        if (phase.summary && phase.summary.toLowerCase().includes(queryLower)) {
            matches.push({ field: 'summary', text: phase.summary });
        }
        if (phase.mindset && phase.mindset.toLowerCase().includes(queryLower)) {
            matches.push({ field: 'mindset', text: phase.mindset });
        }
        
        if (matches.length > 0) {
            results.push({
                type: 'case-study',
                title: phase.phaseName,
                path: 'Case Study',
                matches: matches,
                action: () => {
                    currentRoute = '/case-study';
                    selectedCaseStudyPhase = index;
                    renderNavigation();
                    renderCaseStudyPage();
                    document.getElementById('search-results').classList.remove('active');
                }
            });
        }
    });
    
    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        searchResults.classList.add('active');
        return;
    }
    
    const html = results.slice(0, 10).map((result, index) => {
        const firstMatch = result.matches[0];
        const contextText = highlightText(firstMatch.text, query);
        
        return `
            <div class="search-result-item" data-result-index="${index}">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-context">${contextText}</div>
                <div class="search-result-path">${result.path}</div>
            </div>
        `;
    }).join('');
    
    searchResults.innerHTML = html;
    searchResults.classList.add('active');
    
    // Store results for click handling (event delegation is set up in initializeSearch)
    window.searchResultsData = results;
}

function highlightText(text, query) {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);
    
    if (index === -1) return text;
    
    // Get context around the match (50 chars before and after)
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    
    let contextText = text.substring(start, end);
    if (start > 0) contextText = '...' + contextText;
    if (end < text.length) contextText = contextText + '...';
    
    // Highlight the query
    const regex = new RegExp(`(${query})`, 'gi');
    return contextText.replace(regex, '<span class="search-highlight">$1</span>');
}

function handleSearchResultClick(index) {
    if (window.searchResultsData && window.searchResultsData[index]) {
        window.searchResultsData[index].action();
    }
}

// Render navigation
function renderNavigation() {
    const navLinks = document.getElementById('nav-links');
    navLinks.innerHTML = content.navigation.map(item => `
        <a href="${item.route}" class="nav-link ${currentRoute === item.route ? 'active' : ''}" data-route="${item.route}">
            ${item.label}
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
        link.classList.toggle('active', link.dataset.route === route || (route === '/' && link.dataset.route === '/workflow'));
    });
    
    // Update browser history
    if (pushState) {
        window.history.pushState({ route }, '', route);
    }
    
    // Render the appropriate page
    if (route === '/' || route === '/workflow') {
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

function renderWorkflowPage() {
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <!-- Hero -->
        <section class="hero">
            <h1>${content.meta.title}</h1>
            <p style="line-height: 1.6; margin: 1.5rem 0 0 0; font-size: 1.125rem; word-wrap: break-word; overflow-wrap: break-word;">
                You've been asked to transform a workflow with AI — everything you need is here.
                Follow the <strong>End-to-End Workflow</strong> as your step-by-step guide from start to finish.
                Use the <strong>Key Challenges</strong> for focused how-to guidance on the five hardest parts — proving value, choosing what to build, integrating systems, driving adoption, and governance.
                See the <strong>Case Study</strong> for the whole journey on a real example, and pull ready-to-use templates from the <strong>Library</strong>.
            </p>
        </section>

        <!-- Flowchart -->
        <section class="flow-panel">
            <h2 class="flow-title">${content.endToEndWorkflow.flowchart.title}</h2>
            <div class="flow-row" id="flowchart-nodes">
                ${renderFlowchart()}
            </div>
        </section>

        <!-- Tabs -->
        <div class="section-tabs">
            <button class="section-tab ${activeWorkflowTab === 'engage' ? 'active' : ''}" data-tab="engage">
                Engage
            </button>
            <button class="section-tab ${activeWorkflowTab === 'discover' ? 'active' : ''}" data-tab="discover">
                Discover
            </button>
            <button class="section-tab ${activeWorkflowTab === 'execute' ? 'active' : ''}" data-tab="execute">
                Execute
            </button>
        </div>

        <!-- Tab Content -->
        <div id="workflow-tab-content"></div>
    `;
    
    // Add flowchart click handlers
    document.querySelectorAll('.flow-card').forEach(card => {
        card.addEventListener('click', () => {
            scrollToAnchor(card.dataset.anchor);
        });
    });
    
    // Add tab click handlers
    document.querySelectorAll('.section-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeWorkflowTab = tab.dataset.tab;
            renderWorkflowTabContent();
            // Update tab active state
            document.querySelectorAll('.section-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === activeWorkflowTab);
            });
        });
    });
    
    // Render initial tab content
    renderWorkflowTabContent();
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
    }
}

function renderWorkflowStep(step) {
    // Get team guidance from the Adoption & Change module
    const modulesArray = content.modules && content.modules.chapters ? content.modules.chapters : [];
    const adoptionModule = modulesArray.find(m => m.id === 'adoption-change');
    const teamGuidance = adoptionModule && adoptionModule.teamGuidance;
    
    return `
        <!-- Step Heading Panel -->
        <div class="panel">
            <h3>${step.name}</h3>
            ${step.idealTimespan ? `<p class="step-timespan"><strong>Ideal Timespan:</strong> ${step.idealTimespan}</p>` : ''}
            ${step.briefDescription ? `<p class="step-description">${step.briefDescription}</p>` : ''}
        </div>

        ${step.name === 'Assess' && teamGuidance ? `
            <!-- Team Guidance Panel -->
            <div class="panel">
                <h4>${teamGuidance.title}</h4>
                <p style="color: var(--text-secondary); margin: 0 0 1.5rem 0;">${teamGuidance.description}</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-subtle);">
                            <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">Role</th>
                            <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">What They Do</th>
                            <th style="text-align: left; padding: 0.75rem 1rem; font-weight: 600;">Where to Source</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${teamGuidance.roles.map(role => `
                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                <td style="padding: 0.75rem 1rem; font-weight: 600;">${role.role}</td>
                                <td style="padding: 0.75rem 1rem;">${role.whatTheyDo}</td>
                                <td style="padding: 0.75rem 1rem;">${role.whereToSource}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <p style="color: var(--text-secondary); margin: 1.5rem 0 0 0; font-style: italic;">${teamGuidance.upwardPitch}</p>
            </div>
        ` : ''}

        <!-- Key Activities Panel -->
        <div class="panel">
            <h4>Key Activities & Outcomes</h4>
            <div class="activities-table">
                <div class="activities-header">
                    <div class="activities-col-header">Key Activity</div>
                    <div class="outcomes-col-header">Description</div>
                </div>
                ${step.keyActivities.map(activity => `
                    <div class="activity-row">
                        <div class="activity-col">
                            <div class="activity-title">${activity.title}</div>
                        </div>
                        <div class="outcome-col">
                            ${activity.description ? `<p>${activity.description}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${step.readyToMoveOnChecklist && step.readyToMoveOnChecklist.length > 0 ? `
            <!-- Ready to Move On Panel -->
            <div class="panel">
                <h4>Ready to Move On?</h4>
                <ul class="checklist">
                    ${step.readyToMoveOnChecklist.map(item => `
                        <li class="check-item">☐ ${item}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        ${step.deliverables && step.deliverables.length > 0 ? `
            <div class="panel">
                <h4>Deliverables</h4>
                <div class="deliverable-grid">
                    ${step.deliverables.map(deliverable => renderDeliverableCard(deliverable)).join('')}
                </div>
            </div>
        ` : ''}

        ${step.commonPitfalls && step.commonPitfalls.length > 0 ? `
            <div class="panel">
                <h4>Common Pitfalls</h4>
                <ul class="pitfall-grid">
                    ${step.commonPitfalls.map(pitfall => `
                        <li class="card">⚠️ ${pitfall}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        ${step.examplesAndTemplates && step.examplesAndTemplates.length > 0 ? `
            <div class="panel">
                <h4>Examples & Templates</h4>
                <div class="deliverable-grid">
                    ${step.examplesAndTemplates.map(item => renderDeliverableCard(item)).join('')}
                </div>
            </div>
        ` : ''}

        ${step.readyToAdvance ? `
            <div class="ready-to-advance-banner">
                <div class="ready-to-advance-icon">✓</div>
                <div class="ready-to-advance-content">
                    <h4>Moving to the next phase</h4>
                    <p>${step.readyToAdvance}</p>
                </div>
            </div>
        ` : ''}
    `;
}

function renderDeliverableCard(deliverable) {
    // Two-link model: a deliverable can have an example link and/or a template link.
    // Back-compat: fall back to legacy boxUrl/url for either if present.
    const exampleUrl = (deliverable.exampleUrl && deliverable.exampleUrl.trim()) || '';
    const templateUrl = (deliverable.templateUrl && deliverable.templateUrl.trim())
        || (deliverable.boxUrl && deliverable.boxUrl.trim())
        || (deliverable.url && deliverable.url.trim()) || '';
    const hasExample = exampleUrl !== '';
    const hasTemplate = templateUrl !== '';

    // Small IBM-blue external-link icon
    const linkIcon = '<svg class="external-link-icon" width="14" height="14" viewBox="0 0 16 16" fill="#0f62fe" aria-hidden="true"><path d="M13 3v6h-1V4.707L6.854 9.854l-.708-.708L11.293 4H7V3h6zM4 5v8h8v-3h1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3v1H4z"/></svg>';

    // Build link buttons — only render the ones that exist
    const links = [];
    if (hasExample) {
        links.push(`<a class="deliverable-link" href="${exampleUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Example ${linkIcon}</a>`);
    }
    if (hasTemplate) {
        links.push(`<a class="deliverable-link" href="${templateUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Template ${linkIcon}</a>`);
    }
    const linkRow = links.length ? `<div class="deliverable-links">${links.join('')}</div>` : '';

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
                    <strong>Key Challenges:</strong>
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

function renderModulesPage() {
    const main = document.getElementById('main-content');
    
    main.innerHTML = `
        <section class="hero">
            <h1>${content.modules.title}</h1>
            <p>${content.modules.description}</p>
        </section>

        <!-- Module Navigation -->
        <div class="section-tabs">
            ${content.modules.chapters.map((chapter, index) => `
                <button class="section-tab ${index === 0 ? 'active' : ''}" data-module="${chapter.id}">
                    ${chapter.title}
                </button>
            `).join('')}
        </div>

        <!-- Module Content -->
        <div class="module-content" id="module-content"></div>
    `;
    
    // Add tab click handlers
    document.querySelectorAll('.section-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            selectedModule = tab.dataset.module;
            renderModuleContent();
            // Update tab active state
            document.querySelectorAll('.section-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.module === selectedModule);
            });
        });
    });
    
    // Set initial module to first chapter
    if (content.modules.chapters.length > 0) {
        selectedModule = content.modules.chapters[0].id;
    }
    
    // Render initial module content
    renderModuleContent();
}

function renderModuleContent() {
    const container = document.getElementById('module-content');
    const module = content.modules.chapters.find(ch => ch.id === selectedModule);
    
    if (module) {
        container.innerHTML = renderModuleDetail(module);
        
        // Add accordion click handlers
        container.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordionId = header.dataset.accordionId;
                openAccordions[accordionId] = !openAccordions[accordionId];
                renderModuleContent();
            });
        });
    }
}

function renderModuleDetail(module) {
    if (!module) return '';

    // Define all workflow steps
    const allSteps = [
        { id: 'assess', name: 'Assess', phaseGroup: 'Engage' },
        { id: 'analyze', name: 'Analyze', phaseGroup: 'Discover' },
        { id: 'design', name: 'Design', phaseGroup: 'Discover' },
        { id: 'build', name: 'Build', phaseGroup: 'Execute' },
        { id: 'sustain', name: 'Sustain', phaseGroup: 'Execute' }
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
                                            <div class="panel">
                                                <h3>${section.stepName || section.title || ''}</h3>
                                                ${section.stepSubtext ? `<p class="step-subtext">${section.stepSubtext}</p>` : ''}
                                                ${section.description ? `<p class="step-description">${section.description}</p>` : ''}
                                            </div>

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
                                                            } else {
                                                                actionText = action.description || action.title || '';
                                                                description = action.description || '';
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
    
    main.innerHTML = `
        <section class="hero">
            <h1>${content.library.title}</h1>
            <p>${content.library.description}</p>
        </section>

        <div class="library-content">
            ${content.library.sections.map(section => `
                <div class="library-section">
                    <h2 style="padding: 2rem 2rem 1rem; margin: 0; border-bottom: 1px solid var(--border-subtle); font-size: 2rem; font-weight: 400;">
                        ${section.phaseGroup}
                    </h2>
                    
                    ${section.steps.map(step => `
                        <div class="step-section">
                            <div class="step-heading">
                                <h3 style="font-size: 1.25rem; font-weight: 400; margin: 0;">${step.stepName}</h3>
                                <p class="step-subtext">${step.stepSubtext}</p>
                            </div>

                            ${step.deliverables && step.deliverables.length > 0 ? `
                                <div class="deliverable-grid">
                                    ${step.deliverables.map(deliverable => renderDeliverableCard(deliverable)).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// CASE STUDY PAGE
// ============================================================================

function renderCaseStudyPage() {
    const main = document.getElementById('main-content');
    const caseStudy = content.caseStudy;
    
    if (!caseStudy) {
        main.innerHTML = `
            <section class="hero">
                <h1>Case Study Not Found</h1>
                <p>The case study data is not available.</p>
            </section>
        `;
        return;
    }
    
    // Reset to first phase when navigating to case study
    selectedCaseStudyPhase = 0;
    
    const COLORS = { engage: '#0f62fe', discover: '#8a3ffc', execute: '#24a148' };
    const fileIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';
    
    main.innerHTML = `
        <div class="wrap">
            <div class="eyebrow">Case Study · Worked Example</div>
            <h1 class="case-title">${caseStudy.title}</h1>
            <p class="case-sub">${caseStudy.subtitle}</p>
            
            <div class="intro-grid">
                <div class="panel">
                    <h3>Overview</h3>
                    <p>${caseStudy.overview}</p>
                </div>
                <div class="panel">
                    <h3>Cast of Characters</h3>
                    <div class="cast">
                        ${caseStudy.keyPlayers.map(name => `<span>${name}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="panel" style="background:#f0f7ff;border-color:#d6e6ff">
                <h3 style="color:#0f62fe">Starting Context</h3>
                <p style="color:var(--text-primary)">${caseStudy.startingContext}</p>
            </div>

            <div class="nav-instruction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
                ${caseStudy.navInstruction || 'Click through each phase below to follow the team\'s journey from mandate to scaled MVP.'}
            </div>
            
            <div class="phase-nav">
                ${caseStudy.phases.map((ph, i) => {
                    const pc = COLORS[ph.phaseGroupId];
                    return `<button class="phase-tab phase-${ph.phaseGroupId} ${i === selectedCaseStudyPhase ? 'active' : ''}" style="--c:${pc}" data-phase-index="${i}">
                        <div class="pt-top">
                            <span class="pt-num">${ph.number}</span>
                            <span class="pt-group">${ph.phaseGroup}</span>
                        </div>
                        <div class="pt-name">${(ph.phaseName.split(' / ')[1] || ph.phaseName).replace(' & ', '<br>& ')}</div>
                        <span class="pt-bar"></span>
                    </button>`;
                }).join('')}
            </div>

            <div id="case-study-phase-content"></div>
        </div>
    `;
    
    // Add tab click handlers
    if (caseStudy.phases && caseStudy.phases.length > 0) {
        document.querySelectorAll('.phase-tab[data-phase-index]').forEach(tab => {
            tab.addEventListener('click', () => {
                selectedCaseStudyPhase = parseInt(tab.dataset.phaseIndex);
                renderCaseStudyPhaseContent();
                // Update tab active state
                document.querySelectorAll('.phase-tab[data-phase-index]').forEach(t => {
                    t.classList.toggle('active', parseInt(t.dataset.phaseIndex) === selectedCaseStudyPhase);
                });
                // Smooth scroll to phase panel
                const phasePanel = document.querySelector('.phase-panel');
                if (phasePanel) {
                    window.scrollTo({
                        top: document.querySelector('.phase-nav').offsetTop - 24,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Render initial phase content
        renderCaseStudyPhaseContent();
    }
}

function renderCaseStudyPhaseContent() {
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
