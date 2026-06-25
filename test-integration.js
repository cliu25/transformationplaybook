/**
 * Comprehensive Integration Testing Script for AIFT Playbook v11
 * Tests all three major features and their integration
 */

const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function logTest(name, status, message = '') {
    const result = { name, status, message, timestamp: new Date().toISOString() };
    testResults.tests.push(result);
    
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ PASS: ${name}`);
    } else if (status === 'FAIL') {
        testResults.failed++;
        console.error(`❌ FAIL: ${name} - ${message}`);
    } else if (status === 'WARN') {
        testResults.warnings++;
        console.warn(`⚠️  WARN: ${name} - ${message}`);
    }
    
    if (message) console.log(`   ${message}`);
}

// Wait for DOM and all scripts to load
function waitForLoad() {
    return new Promise((resolve) => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', resolve);
        }
    });
}

// Wait for a condition with timeout
function waitFor(condition, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (condition()) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > timeout) {
                clearInterval(interval);
                reject(new Error('Timeout waiting for condition'));
            }
        }, 100);
    });
}

async function runTests() {
    console.log('🧪 Starting Comprehensive Integration Tests for AIFT Playbook v11\n');
    console.log('=' .repeat(80));
    
    await waitForLoad();
    
    // Give app time to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ========================================================================
    // 1. INITIAL LOAD TESTS
    // ========================================================================
    console.log('\n📦 1. INITIAL LOAD TESTS');
    console.log('-'.repeat(80));
    
    // Test: Content loaded
    if (window.content) {
        logTest('Content JSON loaded', 'PASS', `Content object exists with ${Object.keys(window.content).length} keys`);
    } else {
        logTest('Content JSON loaded', 'FAIL', 'Content object not found');
    }
    
    // Test: CDN Libraries loaded
    if (typeof Fuse !== 'undefined') {
        logTest('Fuse.js library loaded', 'PASS', `Version: ${Fuse.version || 'unknown'}`);
    } else {
        logTest('Fuse.js library loaded', 'FAIL', 'Fuse.js not found');
    }
    
    if (typeof mermaid !== 'undefined') {
        logTest('Mermaid.js library loaded', 'PASS', 'Mermaid object exists');
    } else {
        logTest('Mermaid.js library loaded', 'FAIL', 'Mermaid.js not found');
    }
    
    // Test: Main elements present
    const mainElements = [
        'main-content',
        'search-input',
        'search-results',
        'nav-links',
        'breadcrumb-nav',
        'toc-sidebar',
        'keyboard-shortcuts-hint'
    ];
    
    mainElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            logTest(`Element #${id} exists`, 'PASS');
        } else {
            logTest(`Element #${id} exists`, 'FAIL', 'Element not found in DOM');
        }
    });
    
    // ========================================================================
    // 2. SEARCH FUNCTIONALITY TESTS
    // ========================================================================
    console.log('\n🔍 2. SEARCH FUNCTIONALITY TESTS');
    console.log('-'.repeat(80));
    
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (searchInput && searchResults) {
        // Test: Search index built
        if (window.searchFuse && window.searchData && window.searchData.length > 0) {
            logTest('Search index built', 'PASS', `${window.searchData.length} items indexed`);
        } else {
            logTest('Search index built', 'FAIL', 'Search index not initialized');
        }
        
        // Test: Search input functionality
        searchInput.value = 'transformation';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (searchResults.classList.contains('active')) {
            logTest('Search results display', 'PASS', 'Results panel opens on input');
        } else {
            logTest('Search results display', 'WARN', 'Results panel did not open');
        }
        
        // Test: Filter buttons present
        const filterButtons = searchResults.querySelectorAll('.search-filter-btn');
        if (filterButtons.length > 0) {
            logTest('Search filter buttons', 'PASS', `${filterButtons.length} filter buttons found`);
        } else {
            logTest('Search filter buttons', 'FAIL', 'No filter buttons found');
        }
        
        // Test: Search history
        if (window.searchHistory !== undefined) {
            logTest('Search history feature', 'PASS', `${window.searchHistory.length} items in history`);
        } else {
            logTest('Search history feature', 'FAIL', 'Search history not initialized');
        }
        
        // Clear search
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        logTest('Search elements', 'FAIL', 'Search input or results not found');
    }
    
    // ========================================================================
    // 3. NAVIGATION ENHANCEMENTS TESTS
    // ========================================================================
    console.log('\n🧭 3. NAVIGATION ENHANCEMENTS TESTS');
    console.log('-'.repeat(80));
    
    // Test: Breadcrumbs
    const breadcrumbNav = document.getElementById('breadcrumb-nav');
    const breadcrumbList = document.getElementById('breadcrumb-list');
    
    if (breadcrumbNav && breadcrumbList) {
        const breadcrumbItems = breadcrumbList.querySelectorAll('.breadcrumb-item');
        if (breadcrumbItems.length > 0) {
            logTest('Breadcrumb navigation', 'PASS', `${breadcrumbItems.length} breadcrumb items`);
        } else {
            logTest('Breadcrumb navigation', 'WARN', 'No breadcrumb items found');
        }
    } else {
        logTest('Breadcrumb navigation', 'FAIL', 'Breadcrumb elements not found');
    }
    
    // Test: Table of Contents
    const tocSidebar = document.getElementById('toc-sidebar');
    const tocList = document.getElementById('toc-list');
    
    if (tocSidebar && tocList) {
        logTest('TOC sidebar exists', 'PASS');
        
        const tocItems = tocList.querySelectorAll('.toc-item');
        if (tocItems.length > 0) {
            logTest('TOC items generated', 'PASS', `${tocItems.length} TOC items`);
        } else {
            logTest('TOC items generated', 'WARN', 'No TOC items (may be normal if no headings on page)');
        }
        
        // Test TOC toggle button
        const tocToggleBtn = document.getElementById('toc-toggle-btn');
        if (tocToggleBtn) {
            logTest('TOC toggle button', 'PASS');
        } else {
            logTest('TOC toggle button', 'FAIL', 'Toggle button not found');
        }
    } else {
        logTest('TOC sidebar', 'FAIL', 'TOC elements not found');
    }
    
    // Test: Keyboard shortcuts
    const shortcutsHint = document.getElementById('keyboard-shortcuts-hint');
    if (shortcutsHint) {
        logTest('Keyboard shortcuts help', 'PASS');
        
        // Test keyboard shortcut functionality
        const testShortcut = new KeyboardEvent('keydown', { key: '?' });
        document.dispatchEvent(testShortcut);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (shortcutsHint.classList.contains('keyboard-shortcuts-visible')) {
            logTest('Keyboard shortcuts toggle', 'PASS', '? key toggles help');
        } else {
            logTest('Keyboard shortcuts toggle', 'WARN', 'Help did not toggle');
        }
        
        // Close help
        document.dispatchEvent(testShortcut);
    } else {
        logTest('Keyboard shortcuts help', 'FAIL', 'Shortcuts help element not found');
    }
    
    // ========================================================================
    // 4. MERMAID DIAGRAMS TESTS
    // ========================================================================
    console.log('\n📊 4. MERMAID DIAGRAMS TESTS');
    console.log('-'.repeat(80));
    
    // Test: Mermaid initialized
    if (typeof mermaid !== 'undefined' && mermaid.initialize) {
        logTest('Mermaid initialization', 'PASS');
    } else {
        logTest('Mermaid initialization', 'FAIL', 'Mermaid not properly initialized');
    }
    
    // Test: Diagram rendering functions exist
    const diagramFunctions = [
        'renderWorkflowDiagram',
        'renderModuleDependencyGraph',
        'renderTransformationTimeline',
        'renderGovernanceFlow'
    ];
    
    diagramFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            logTest(`Function ${funcName}`, 'PASS');
        } else {
            logTest(`Function ${funcName}`, 'FAIL', 'Function not found');
        }
    });
    
    // Test: Diagram control functions
    const controlFunctions = [
        'zoomDiagram',
        'resetDiagramZoom',
        'toggleDiagramFullscreen',
        'exportDiagram'
    ];
    
    controlFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            logTest(`Control function ${funcName}`, 'PASS');
        } else {
            logTest(`Control function ${funcName}`, 'FAIL', 'Function not found');
        }
    });
    
    // ========================================================================
    // 5. EXISTING FEATURES TESTS
    // ========================================================================
    console.log('\n🤖 5. EXISTING FEATURES TESTS');
    console.log('-'.repeat(80));
    
    // Test: Chatbot
    const chatbotToggle = document.getElementById('chatbot-toggle-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    
    if (chatbotToggle && chatbotWindow) {
        logTest('Chatbot elements', 'PASS');
    } else {
        logTest('Chatbot elements', 'FAIL', 'Chatbot elements not found');
    }
    
    // Test: Analytics
    if (typeof gtag === 'function') {
        logTest('Google Analytics', 'PASS', 'gtag function exists');
    } else {
        logTest('Google Analytics', 'WARN', 'gtag function not found (may be blocked)');
    }
    
    // Test: Navigation links
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
        const links = navLinks.querySelectorAll('.nav-link');
        if (links.length >= 4) {
            logTest('Navigation links', 'PASS', `${links.length} navigation links`);
        } else {
            logTest('Navigation links', 'FAIL', `Only ${links.length} links found, expected 4+`);
        }
    }
    
    // ========================================================================
    // 6. INTEGRATION TESTS
    // ========================================================================
    console.log('\n🔗 6. INTEGRATION TESTS');
    console.log('-'.repeat(80));
    
    // Test: Search doesn't interfere with navigation
    if (searchInput) {
        searchInput.focus();
        const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        searchInput.dispatchEvent(escEvent);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!searchResults.classList.contains('active')) {
            logTest('Search/Navigation integration', 'PASS', 'Escape closes search');
        } else {
            logTest('Search/Navigation integration', 'WARN', 'Escape did not close search');
        }
    }
    
    // Test: Multiple features can coexist
    const hasSearch = !!searchInput;
    const hasBreadcrumbs = !!breadcrumbNav;
    const hasTOC = !!tocSidebar;
    const hasDiagrams = typeof mermaid !== 'undefined';
    
    if (hasSearch && hasBreadcrumbs && hasTOC && hasDiagrams) {
        logTest('All features present', 'PASS', 'Search, Navigation, TOC, and Diagrams all loaded');
    } else {
        const missing = [];
        if (!hasSearch) missing.push('Search');
        if (!hasBreadcrumbs) missing.push('Breadcrumbs');
        if (!hasTOC) missing.push('TOC');
        if (!hasDiagrams) missing.push('Diagrams');
        logTest('All features present', 'FAIL', `Missing: ${missing.join(', ')}`);
    }
    
    // Test: No JavaScript errors in console
    const errors = window.testErrors || [];
    if (errors.length === 0) {
        logTest('No console errors', 'PASS');
    } else {
        logTest('No console errors', 'FAIL', `${errors.length} errors detected`);
    }
    
    // ========================================================================
    // 7. PERFORMANCE TESTS
    // ========================================================================
    console.log('\n⚡ 7. PERFORMANCE TESTS');
    console.log('-'.repeat(80));
    
    // Test: Page load time
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        if (loadTime < 3000) {
            logTest('Page load time', 'PASS', `${loadTime}ms (< 3s)`);
        } else if (loadTime < 5000) {
            logTest('Page load time', 'WARN', `${loadTime}ms (3-5s)`);
        } else {
            logTest('Page load time', 'FAIL', `${loadTime}ms (> 5s)`);
        }
    }
    
    // Test: Memory usage (if available)
    if (window.performance && window.performance.memory) {
        const usedMemory = (window.performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        logTest('Memory usage', 'PASS', `${usedMemory} MB`);
    }
    
    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed:  ${testResults.passed}`);
    console.log(`❌ Failed:  ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log(`📝 Total:   ${testResults.tests.length}`);
    
    const successRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
    console.log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All critical tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Review the results above.');
    }
    
    // Store results globally for export
    window.testResults = testResults;
    
    return testResults;
}

// Capture console errors
window.testErrors = [];
const originalError = console.error;
console.error = function(...args) {
    window.testErrors.push(args.join(' '));
    originalError.apply(console, args);
};

// Run tests when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runTests, 2000);
    });
} else {
    setTimeout(runTests, 2000);
}

// Made with Bob
