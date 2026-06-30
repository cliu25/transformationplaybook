# Andy Bryant Feedback Implementation Plan

## Status: IN PROGRESS
**Date**: June 30, 2026  
**Updated Files**: prioritization_narrative.html, js/app.js

---

## Overview

This document tracks the implementation of Andy Bryant's comprehensive feedback on the Prioritization & Roadmap module and outlines the structural improvements to be applied across all narrative chapters (Systems Integration, Value Measurement & ROI).

---

## ✅ Completed Changes

### 1. Prioritization & Roadmap Module - COMPLETE
- **File**: `prioritization_narrative.html` (formerly `prioritization_narrative (3).html`)
- **Status**: ✅ Replaced with updated version (5) incorporating all Andy's feedback
- **Updated**: `js/app.js` to reference new filename

#### Key Improvements in Version 5:
1. **New Phase Strip Design** (lines 28-35)
   - Consistent color-coded phase pips: Engage (blue), Discover (purple), Execute (green)
   - Improved visual hierarchy with `phase-pip` class
   - Better spacing and typography

2. **Challenge Context Pills** (lines 37-40, 143, 273)
   - Added `challenge-pip` to show module name alongside phase
   - Format: `[Phase Tag] [Step Context] [Challenge Name]`
   - Example: "Engage · Step 2 · Business Process Mapping · Prioritization & Roadmap"

3. **New Artifact Card Design** (lines 67-77, 197-207, 232-242, 397-407)
   ```html
   <div class="artifact-card">
     <div class="a-type">PPT · Medium priority</div>
     <div class="a-title">Artifact Name</div>
     <div class="a-desc">Description text...</div>
     <div class="a-links">
       <a class="a-link" href="#">↗ Open template</a>
     </div>
   </div>
   ```
   - Replaces old chip-style artifact links
   - Consistent with site's deliverable-card pattern
   - Shows file type, priority, description, and links

4. **Enhanced Content Structure**
   - **Engage Phase**: Added explicit roles/skillsets needed (lines 150-151)
   - **Discover Phase**: Added sponsor commitment clarity (line 280)
   - **Step Labels**: Explicit "Step 3" and "Step 4" callouts (lines 285, 419)
   - **Sub-phase structure**: Clear hierarchy with numbered steps

5. **Improved Color Consistency**
   - All Engage elements: `--blue` (#0f62fe)
   - All Discover elements: `--purple` (#8a3ffc)
   - All Execute elements: `--green` (#24a148)
   - Removed inconsistent teal colors

---

## 🔄 In Progress: Structural Improvements for Other Narratives

### Pattern to Apply to All Narrative Chapters

Based on the prioritization_narrative (5).html improvements, the following patterns must be applied to:
- `systems-integration-narrative.html`
- `value-measurement-roi-narrative.html`

#### 1. Phase Strip Update
**Current** (systems-integration line 30-34):
```html
<div class="where-strip">
  <span class="where-label">Active across</span>
  <span class="step-pip active-pip">Engage</span>
  <span class="pip-sep">→</span>
  <span class="step-pip active-pip">Discover</span>
  ...
</div>
```

**Should be**:
```html
<div class="where-strip">
  <span class="where-label">Active at</span>
  <span class="phase-pip pip-engage">Engage</span>
  <span class="pip-sep">→</span>
  <span class="phase-pip pip-discover">Discover</span>
  ...
</div>
```

**CSS to add**:
```css
.phase-pip{padding:.3rem .875rem;border-radius:3px;font-size:.8rem;font-weight:600;border:1.5px solid var(--border);color:var(--text-3);background:#fff;}
.phase-pip.pip-engage{background:var(--blue-fill);border-color:var(--blue);color:var(--blue-dk);}
.phase-pip.pip-discover{background:var(--purple-fill);border-color:var(--purple);color:var(--purple-dk);}
.phase-pip.pip-execute{background:var(--green-fill);border-color:var(--green);color:var(--green-dk);}
```

#### 2. Add Challenge Context Pills
**Add after phase tag** (in each phase-label div):
```html
<div class="phase-label">
  <span class="phase-tag tag-engage">Engage</span>
  <span class="phase-step-context">Step 1 · Tech & Data Assessment</span>
  <span class="challenge-pip">Systems Integration</span>
</div>
```

**CSS to add**:
```css
.challenge-pip{padding:.3rem .875rem;border-radius:3px;font-size:.8rem;font-weight:600;background:#fff;border:1.5px solid var(--purple);color:var(--purple-dk);}
```

#### 3. Replace Artifact Chips with Artifact Cards

**Current pattern** (artifact-chip-row):
```html
<div class="artifact-chip-row">
  <span class="chip-label">Artifacts</span>
  <a class="artifact-chip" href="#"><span class="chip-icon">📊</span>Template Name<span class="chip-arrow">↗</span></a>
</div>
```

**New pattern** (artifact-section):
```html
<div class="artifact-section">
  <div class="artifact-section-label">Artifact</div>
  <div class="artifact-grid">
    <div class="artifact-card">
      <div class="a-type">Excel · High priority</div>
      <div class="a-title">Technology & Data Readiness Checklist</div>
      <div class="a-desc">Confirms systems, data sources, owners, quality, access, architecture, and security constraints.</div>
      <div class="a-links"><a class="a-link" href="#">↗ Open template</a></div>
    </div>
  </div>
</div>
```

**CSS to add**:
```css
.artifact-section{margin:1.75rem 0;}
.artifact-section-label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:.75rem;}
.artifact-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.875rem;}
.artifact-card{border:1px solid var(--border);border-radius:4px;padding:1rem;background:#fff;}
.artifact-card .a-type{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:.375rem;}
.artifact-card .a-title{font-size:.9rem;font-weight:600;color:var(--text);margin-bottom:.375rem;}
.artifact-card .a-desc{font-size:.8rem;color:var(--text-2);line-height:1.5;margin-bottom:.75rem;}
.artifact-card .a-links{display:flex;gap:.625rem;flex-wrap:wrap;}
.a-link{font-size:.78rem;color:var(--purple);text-decoration:none;font-weight:500;}
.a-link:hover{text-decoration:underline;}
```

#### 4. Add Explicit Step Numbers
For each sub-phase, add step number:
```html
<div class="sub-phase">
  <div class="sub-phase-label">
    <span class="sub-phase-number">Step 1</span>
    <h3>Phase Name — What it does</h3>
  </div>
</div>
```

#### 5. Color Consistency Check
- Remove any teal colors (`--teal`, `--teal-dk`, `--teal-fill`)
- Ensure all phase-specific elements use correct colors:
  - Engage: blue (#0f62fe)
  - Discover: purple (#8a3ffc)
  - Execute: green (#24a148)

---

## 📋 Artifact Mapping from Deliverable Library

### Systems Integration Artifacts (from Deliverable Library(Sheet1).csv)

**Assess Phase**:
- Technology & Data Readiness Checklist (Excel, Medium priority)
- Current State Assessment (PPT, High priority)

**Analyze Phase**:
- EIW Assessment and Automation Level (Visio, Medium priority)

**Design Phase**:
- Business Requirements Log (Excel, High priority)
- Solution Architecture (PPT, Medium priority)
- Technical Specification (PPT, Medium priority)

**Build Phase**:
- Defect Tracker (Excel, High priority)

**Sustain Phase**:
- Operational Health Dashboard (PPT, Medium priority)

### Value Measurement & ROI Artifacts

**Analyze Phase**:
- Measurement Strategy (PPT, Medium priority)

**Design Phase**:
- Reporting Model (Excel, Medium priority)

**Build Phase**:
- ROI Analysis (Excel, Medium priority)
- KPI Dashboard (PPT, High priority)
- Usage Analytics (Excel, Low priority)

**Sustain Phase**:
- Value Realization Reporting (PPT, Medium priority)
- Operational Health Dashboard (PPT, Medium priority)

---

## 🎯 Next Steps

### 1. Systems Integration Narrative
- [ ] Update phase strip with new pip design
- [ ] Add challenge context pills to each phase
- [ ] Replace all artifact chips with artifact cards
- [ ] Add explicit step numbers (Steps 1, 3, 4, 5, 6)
- [ ] Remove teal colors, ensure blue/purple/green consistency
- [ ] Map artifacts to Deliverable Library

### 2. Value Measurement & ROI Narrative
- [ ] Update phase strip with new pip design
- [ ] Add challenge context pills to each phase
- [ ] Replace all artifact chips with artifact cards
- [ ] Add explicit step numbers (Steps 2, 3, 4, 5, 6)
- [ ] Ensure color consistency
- [ ] Map artifacts to Deliverable Library

### 3. Site-Wide Color Audit
- [ ] Verify all Engage elements use blue
- [ ] Verify all Discover elements use purple
- [ ] Verify all Execute elements use green
- [ ] Check Key Challenges page matrix colors
- [ ] Update any remaining inconsistencies

### 4. Testing
- [ ] Test Prioritization & Roadmap module loads correctly
- [ ] Test Systems Integration module after updates
- [ ] Test Value Measurement & ROI module after updates
- [ ] Verify all artifact links work
- [ ] Check responsive design on mobile

### 5. Documentation
- [ ] Update CHANGELOG-V11.md with changes
- [ ] Document new artifact card pattern
- [ ] Create style guide for future narrative modules

---

## 📝 Key Design Decisions

### Why Artifact Cards vs Chips?
- **Better information density**: Shows type, priority, and description
- **Consistent with site pattern**: Matches deliverable-card design elsewhere
- **More actionable**: Clear call-to-action with links
- **Scalable**: Easy to add multiple links (example + template)

### Why Challenge Context Pills?
- **Prevents confusion**: Users always know which module they're in
- **Better navigation**: Clear breadcrumb-style context
- **Consistent hierarchy**: Phase → Step → Challenge

### Why Explicit Step Numbers?
- **Clearer structure**: Matches E2E workflow step numbering
- **Better scanning**: Users can quickly find specific steps
- **Improved navigation**: Easier to reference in discussions

---

## 🔍 Testing Checklist

- [x] Prioritization narrative loads at http://localhost:8015
- [x] App.js references correct filename
- [ ] All three narrative modules render correctly
- [ ] Artifact cards display properly
- [ ] Phase colors are consistent
- [ ] Challenge pills appear in correct locations
- [ ] Step numbers are visible and correct
- [ ] Mobile responsive design works
- [ ] All links are functional

---

## 📚 References

- **Source File**: `prioritization_narrative (5).html` (Desktop root)
- **Deliverable Library**: `Deliverable Library(Sheet1).csv`
- **Original Feedback**: Andy Bryant's comprehensive review
- **Implementation Date**: June 30, 2026

---

## Notes

- The prioritization narrative (5) serves as the **canonical pattern** for all narrative modules
- All structural improvements should match this pattern exactly
- Color consistency is critical: Engage=blue, Discover=purple, Execute=green
- Artifact information must match Deliverable Library.csv exactly