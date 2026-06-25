# Navigation System Enhancements

## Overview
This document describes the enhanced navigation system implemented for the AIFT Playbook site, including breadcrumbs, table of contents (TOC) sidebar, and keyboard shortcuts.

## Features Implemented

### 1. Breadcrumb Navigation
**Location:** Below the header, sticky positioned
**Features:**
- Shows current navigation path (e.g., "Home > Workflow > Engage Phase")
- Clickable breadcrumb items to navigate back
- Updates dynamically based on current route
- Follows IBM Carbon Design System patterns
- Accessible with ARIA labels

**Implementation:**
- HTML: `<nav class="breadcrumb-nav">` in `index.html`
- JavaScript: `updateBreadcrumbs(route, additionalContext)` in `app.js`
- CSS: `.breadcrumb-nav` styles in `styles.css`

### 2. Sticky Table of Contents (TOC) Sidebar
**Location:** Left side of the page (fixed position)
**Features:**
- Automatically generated from page headings (h2, h3)
- Sticky positioning - stays visible while scrolling
- Highlights current section as user scrolls (using IntersectionObserver)
- Collapsible on mobile with toggle button
- Smooth scroll to sections on click
- Shows/hides based on content availability

**Implementation:**
- HTML: `<aside class="toc-sidebar">` in `index.html`
- JavaScript: 
  - `generateTOC()` - Creates TOC from page headings
  - `updateTOCHighlight(activeId)` - Updates active section
  - `initializeTOCHighlighting()` - Sets up scroll observer
  - `toggleTOC()` - Mobile toggle functionality
- CSS: `.toc-sidebar` styles with responsive breakpoints

### 3. Keyboard Shortcuts
**Available Shortcuts:**
- `/` - Focus search input
- `g` + `w` - Go to Workflow page
- `g` + `m` - Go to Modules page
- `g` + `c` - Go to Case Study page
- `g` + `l` - Go to Library page
- `Esc` - Close TOC on mobile / Close help dialog
- `?` - Toggle keyboard shortcuts help

**Implementation:**
- JavaScript: `initializeKeyboardShortcuts()` in `app.js`
- HTML: `<div class="keyboard-shortcuts-hint">` in `index.html`
- CSS: `.keyboard-shortcuts-hint` styles with animation

## Design Guidelines Followed

### IBM Carbon Design System
- Color palette using CSS variables (--ibm-blue-60, --text-primary, etc.)
- Typography using IBM Plex Sans font family
- Spacing and sizing following Carbon grid system
- Interactive states (hover, focus, active) with proper transitions
- Accessibility features (ARIA labels, keyboard navigation, focus indicators)

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Desktop: > 1024px (TOC visible by default)
  - Tablet: 672px - 1024px (TOC collapsible)
  - Mobile: < 672px (TOC hidden by default, toggle button visible)
- Touch-friendly tap targets on mobile
- Optimized layout for different screen sizes

### Accessibility
- Semantic HTML (nav, aside, kbd elements)
- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators on all interactive elements
- Proper heading hierarchy
- Color contrast meeting WCAG AA standards

## Integration with Existing Features

### Search Functionality
- Keyboard shortcut `/` focuses search without interfering with existing search
- Search remains fully functional with all filters and history
- No modifications to existing search implementation

### Navigation System
- Breadcrumbs update automatically on route changes
- TOC regenerates when page content changes
- Works seamlessly with existing top navigation
- Browser back/forward buttons work correctly
- URL hash updates when clicking TOC links

### Content Rendering
- TOC generates after content is rendered (100ms delay)
- Observes all h2 and h3 headings in main content
- Automatically assigns IDs to headings without them
- Updates highlight as user scrolls through content

## Testing Checklist

### Breadcrumbs
- [x] Breadcrumbs appear below header
- [x] Shows correct path for each route
- [x] Clicking breadcrumb items navigates correctly
- [x] Updates when navigating between pages
- [x] Responsive on mobile devices

### Table of Contents
- [x] TOC generates from page headings
- [x] Sticky positioning works while scrolling
- [x] Current section highlights as user scrolls
- [x] Clicking TOC items scrolls to section
- [x] Toggle button works on mobile
- [x] Hides when no headings present

### Keyboard Shortcuts
- [x] `/` focuses search input
- [x] `g + w` navigates to Workflow
- [x] `g + m` navigates to Modules
- [x] `g + c` navigates to Case Study
- [x] `g + l` navigates to Library
- [x] `Esc` closes TOC on mobile
- [x] `?` toggles help dialog
- [x] Shortcuts don't interfere with typing in inputs

### Responsive Design
- [x] Desktop layout (> 1024px) - TOC visible, content adjusted
- [x] Tablet layout (672-1024px) - TOC collapsible
- [x] Mobile layout (< 672px) - TOC hidden by default
- [x] Breadcrumbs adapt to screen size
- [x] Touch interactions work on mobile

### Accessibility
- [x] Screen reader compatible
- [x] Keyboard navigation works
- [x] Focus indicators visible
- [x] ARIA labels present
- [x] Color contrast sufficient

## Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations
- IntersectionObserver for efficient scroll detection
- Debounced scroll events
- CSS transitions using GPU-accelerated properties
- Minimal DOM manipulation
- Lazy initialization of features

## Future Enhancements
- Add breadcrumb schema markup for SEO
- Implement TOC collapse/expand for subsections
- Add more keyboard shortcuts (arrow keys for navigation)
- Persist TOC open/closed state in localStorage
- Add print-friendly styles
- Implement breadcrumb overflow handling for deep navigation

## Files Modified
1. `index.html` - Added breadcrumb nav, TOC sidebar, keyboard shortcuts help
2. `js/app.js` - Added navigation functions and keyboard shortcuts
3. `css/styles.css` - Added styles for all new components

## Testing the Implementation
1. Open http://localhost:8015 in your browser
2. Navigate between different pages (Workflow, Modules, Library, Case Study)
3. Verify breadcrumbs update correctly
4. Scroll through pages with headings to see TOC highlighting
5. Try keyboard shortcuts (press `?` to see help)
6. Test on mobile by resizing browser window
7. Test accessibility with keyboard-only navigation

## Support
For issues or questions, contact the AIFT Domain Orchestration Team.

---
**Created by:** Bob (AI Assistant)
**Date:** June 25, 2026
**Version:** 1.0