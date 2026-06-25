# AIFT Playbook v9 - Changes from v7

## Overview
Version 9 incorporates insights from the ET framework template and practitioner interviews to better align the playbook with the actual transformation process.

## Changes Made

### 1. Phase Group Indicators on Workflow Flowchart ✅

**What Changed:**
- Added visual indicators above each workflow step showing which high-level phase it belongs to (Engage, Discover, or Execute)
- Phase indicators appear when the phase group changes from the previous step

**Mapping:**
- **Assess** → Engage
- **Analyze** → Discover
- **Design** → Discover
- **Build** → Execute
- **Sustain** → Execute

**Files Modified:**
- `js/app.js` - Updated `renderFlowchart()` function to:
  - Detect phase group changes
  - Add phase indicator badges above workflow cards
  - Wrap card and arrow in `.flow-item-content` for proper layout

- `css/styles.css` - Added styles for:
  - `.phase-group-indicator` - Badge container with rounded corners
  - `.phase-group-indicator.phase-engage` - Blue styling for Engage phase
  - `.phase-group-indicator.phase-discover` - Purple styling for Discover phase
  - `.phase-group-indicator.phase-execute` - Green styling for Execute phase
  - `.phase-group-label` - Text styling for phase labels
  - `.flow-item-content` - Wrapper for card and arrow to maintain horizontal layout
  - Updated `.flow-item` to use flexbox column layout

**Visual Result:**
```
┌─────────────┐
│   ENGAGE    │  ← Phase indicator badge
└─────────────┘
┌─────────────┐
│   Assess    │  ← Workflow card
│  Assess...  │
└─────────────┘
      →

┌─────────────┐
│  DISCOVER   │  ← Phase indicator badge (appears when phase changes)
└─────────────┘
┌─────────────┐
│   Analyze   │
│  Analyze... │
└─────────────┘
      →
```

**Why This Matters:**
Based on the synthesis document, practitioners need to understand that the 5 workflow steps map to 3 high-level phases (Engage/Discover/Execute). This visual grouping helps users:
- Understand the transformation flow at a glance
- See which steps belong to which strategic phase
- Navigate more intuitively through the process

---

## Pending Changes

### 2. Value Module Enhancement
**Status:** Not started
**Goal:** Add lightweight metrics approach based on Noah's insights
- Baseline/target/actual template
- Backend instrumentation guidance
- Finance/EBM validation path
- Distinguish productivity vs. cost savings vs. risk reduction

### 3. Adoption & Change Module Reframing
**Status:** Not started
**Goal:** Reframe as Technology + People + Process
- Show change management throughout project (not just at end)
- Add "start small, drive real usage" technique
- Include change-impact assessment, leadership alignment, communications, learning & enablement

### 4. Systems Integration Module Technical Depth
**Status:** Not started
**Goal:** Add technical practitioner guidance
- SDLC framing for the build
- Tech-stack decision artifact
- Data pipeline & readiness depth
- Technical handoff package
- Prototype-first technique

### 5. Day 0 Readiness Checklist
**Status:** Not started
**Goal:** Add pre-execution readiness gate
- Sponsor confirmed, roles assigned, capacity validated
- Address "debt" warning from Sandy

### 6. Requirements Intake Pack
**Status:** Not started
**Goal:** Create business-to-tech translation template
- Use case, workflow, persona, MVP scope, data sources, systems

### 7. Steering Committee Kit
**Status:** Not started
**Goal:** Add operational guidance
- Weekly agenda, red/yellow/green norms, decision log, escalation rules

### 8. Expand Engage Phase
**Status:** Not started
**Goal:** Add pre-execution setup content (steps 1-11 of 27-step workflow)
- Business case, staffing plan, steering committee, requirements, technical spec

### 9. Clear Graduation Definition
**Status:** Not started
**Goal:** Define what "done" means
- MVP accepted, owners confirmed, support model, telemetry, adoption plan

### 10. Prototype-First Technique
**Status:** Not started
**Goal:** Document technique for unblocking vague requirements

### 11. Executive Air Cover Guidance
**Status:** Not started
**Goal:** Add guidance on creating air cover without AIFT driving

### 12. Phase Timing Updates
**Status:** Not started
**Goal:** Update phase timing to match ET framework
- Phase 1-2: Discover (4 weeks total)
- Phase 3: Execute - Build (12 weeks)
- Phase 4: Execute - Scale (12 weeks)
- Phase 5: Sustain (ongoing)

---

## Testing

To test the changes:
1. Open `index.html` in a browser or run a local server
2. Navigate to the "End-to-End Workflow" page
3. Verify that phase indicators appear above the first card of each phase group:
   - "ENGAGE" above Assess
   - "DISCOVER" above Analyze
   - "EXECUTE" above Build
4. Verify the styling matches the phase colors (blue, purple, green)

---

## Next Steps

1. Review and approve the phase indicator changes
2. Proceed with Value Module enhancement
3. Continue through remaining changes one by one
4. Test each change before moving to the next
5. Create comprehensive documentation when all changes are complete