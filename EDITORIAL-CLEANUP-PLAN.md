# Editorial Cleanup Plan: AIFT Playbook Site v7

**Scope:** Planning only, no code edits  
**Source:** [`content_synced.json`](content_synced.json) (3991 lines)  
**Rendering:** [`js/app.js`](js/app.js)  
**Status:** Schema-confirmed, ready for implementation staging

---

## Executive Summary

This plan addresses editorial redundancy, actionability gaps, and schema conflicts in the active content model. The current structure uses **workflow steps** with `keyActivities`, `readyToMoveOnChecklist`, `deliverables`, `commonPitfalls` and **modules** with `crossCuttingGuidance` and `phaseSections`. The legacy `examplesAndTemplates` field exists in rendering code but is **dead/unused** in active content (confirmed via schema analysis).

---

## Current Schema Analysis

### End-to-End Workflow Structure
```
endToEndWorkflow.phaseGroups[].steps[]
├── keyActivities[] (title + subtext)
├── readyToMoveOnChecklist[] (strings)
├── deliverables[] (id, title, description, exampleUrl, templateUrl)
├── commonPitfalls[] (strings)
└── examplesAndTemplates[] ← DEAD FIELD (rendered but empty in content)
```

### Modules Structure
```
modules.chapters[].phaseSections[]
├── relevance (primary/supporting/supporting-important)
├── description (string)
├── actions[] (strings)
├── checklist[] (strings)
├── artifacts[] (same schema as deliverables)
├── commonPitfalls[] (strings)
└── whoToContact (string)
```

### Schema Conflicts Identified
1. **Deliverables vs Artifacts**: Same content, different names across pages
2. **Actions vs KeyActivities**: Overlapping but inconsistent granularity
3. **Checklist duplication**: `readyToMoveOnChecklist` (workflow) vs `checklist` (modules)
4. **Dead field**: `examplesAndTemplates` rendered in app.js:305-312 but unused

---

## Page-by-Page Cleanup Plan

### 1. End-to-End Workflow Page (`/workflow`)

**Current State:**
- 3 phase groups (Engage, Discover, Execute) with 5 total steps
- Each step has 4-6 keyActivities with title+subtext
- readyToMoveOnChecklist has 5-6 items per step
- Deliverables: 3-6 per step, many missing URLs
- commonPitfalls: 4-5 per step

**Cleanup Actions:**

#### A. KeyActivities Consolidation
**Problem:** Verbose title+subtext pairs create reading fatigue  
**Recommendation:**
- **KEEP:** Activities that describe distinct, sequenced actions
- **MERGE:** Activities where subtext merely restates the title
- **REWRITE:** Convert passive descriptions to active imperatives
- **DELETE:** Activities that duplicate checklist items

**Example (Assess step):**
```
BEFORE:
- Title: "Secure executive sponsorship"
  Subtext: "Identify sponsor, confirm mandate, budget, authority"

AFTER:
- "Secure executive sponsor with confirmed mandate, budget, and authority"
```

**Target:** Reduce from 4-6 to 3-4 activities per step

#### B. ReadyToMoveOnChecklist Refinement
**Problem:** Mix of outcomes and process checks  
**Recommendation:**
- **KEEP:** Outcome-based gates (e.g., "Baseline metrics documented")
- **REWRITE:** Process checks as outcomes (e.g., "Steering committee reviewed risks" → "Risk review completed with steering committee sign-off")
- **DELETE:** Items that duplicate keyActivities without adding gate criteria

**Target:** 4-5 crisp go/no-go criteria per step

#### C. Deliverables Audit
**Problem:** 40% missing URLs, inconsistent descriptions  
**Recommendation:**
- **KEEP:** All deliverables with at least one URL (example OR template)
- **MERGE:** Duplicate deliverables across steps (e.g., "Strategic Roadmap" appears in Analyze, Design, Build)
- **REWRITE:** Empty descriptions (e.g., "Technical Dependency Assessment" line 1526)
- **DELETE:** Deliverables with no URLs and no clear owner

**Target:** Every deliverable has description + at least one URL

#### D. CommonPitfalls Deduplication
**Problem:** Generic warnings repeated across steps  
**Recommendation:**
- **KEEP:** Step-specific pitfalls with concrete examples
- **MERGE:** Generic pitfalls into phase-level guidance
- **DELETE:** Vague warnings without actionable prevention

**Example:**
```
DELETE: "Not validating workflow pain with actual users" (too generic)
KEEP: "Skipping readiness assessment and discovering blockers during build" (specific consequence)
```

---

### 2. Modules Page (`/modules`)

**Current State:**
- 6 chapters (Value Creation, Stakeholder Engagement, etc.)
- Each chapter has `crossCuttingGuidance` (keyPrinciples, escalationPaths, successCriteria)
- Each chapter has 5 `phaseSections` (one per workflow step)
- PhaseSections use: description, actions[], checklist[], artifacts[], commonPitfalls[]

**Cleanup Actions:**

#### A. CrossCuttingGuidance Consolidation
**Problem:** KeyPrinciples overlap with phaseSections.actions  
**Recommendation:**
- **KEEP:** Principles that apply across ALL phases (true cross-cutting)
- **MOVE:** Phase-specific principles to relevant phaseSection.actions
- **REWRITE:** Principles as testable criteria, not aspirations

**Example (Value Creation module):**
```
BEFORE (keyPrinciples):
- "Value must be measurable and owned"
- "Baseline and target must be validated before build"

AFTER:
- Move "Baseline and target..." to Analyze phaseSection.actions
- Keep "Value must be measurable and owned" as cross-cutting
```

#### B. PhaseSections Redundancy Removal
**Problem:** Description + actions[] often repeat the same content  
**Recommendation:**
- **KEEP:** Description as 1-sentence context
- **MERGE:** Actions that restate description into checklist
- **REWRITE:** Actions as specific tasks, not summaries
- **DELETE:** Actions that duplicate workflow keyActivities

**Example (Stakeholder Engagement, Assess step):**
```
BEFORE:
- description: "Identify and engage key stakeholders"
- actions: ["Identify and engage key stakeholders"]

AFTER:
- description: "Map stakeholder influence and secure commitment"
- actions: ["Create stakeholder map with power/interest grid", "Schedule 1:1s with top 5 influencers"]
```

#### C. Artifacts vs Deliverables Alignment
**Problem:** Same content, different field names  
**Recommendation:**
- **STANDARDIZE:** Use "deliverables" terminology across both pages
- **MERGE:** Duplicate artifacts that appear in both workflow and modules
- **CROSS-REFERENCE:** Link module artifacts to workflow deliverables by ID

**Schema Change Required:** Rename `artifacts[]` to `deliverables[]` in modules.chapters[].phaseSections[]

#### D. Checklist Actionability Upgrade
**Problem:** Many checklist items are vague (e.g., "MVP scope confirmed")  
**Recommendation:**
- **REWRITE:** Every checklist item must answer "How do I verify this?"
- **ADD:** Verification method or artifact reference

**Example:**
```
BEFORE: "MVP scope confirmed"
AFTER: "MVP scope documented in scope worksheet with sponsor sign-off"
```

---

### 3. Library Page (`/library`)

**Current State:**
- Aggregates deliverables from all workflow steps
- Organized by phase group
- No editorial issues (pure aggregation)

**Cleanup Actions:**
- **NONE** - Library auto-updates when workflow deliverables are cleaned
- **VERIFY:** All deliverable IDs are unique for proper linking

---

### 4. Case Study Page (`/case-study`)

**Current State:**
- Narrative format with phase-by-phase walkthrough
- Uses `documents[]` field (similar to deliverables)
- No schema conflicts

**Cleanup Actions:**
- **AUDIT:** Ensure documents[] URLs are valid
- **ALIGN:** Document descriptions match workflow deliverable descriptions
- **KEEP:** All narrative content (out of scope for this cleanup)

---

## Proposed Editorial Standards

### 1. Actionability Standard
**Rule:** Every action, activity, or checklist item must be:
- **Specific:** Names the artifact, meeting, or decision
- **Verifiable:** Clear completion criteria
- **Owned:** Implicit or explicit role assignment

**Test:** Can a new PM execute this without asking "what does this mean?"

### 2. Redundancy Removal Standard
**Rule:** Content should appear in exactly ONE place:
- **Workflow keyActivities:** What to do in sequence
- **Workflow readyToMoveOnChecklist:** Go/no-go gates
- **Module crossCuttingGuidance:** Principles that span all phases
- **Module phaseSections.actions:** Module-specific tasks per phase
- **Module phaseSections.checklist:** Module-specific verification

**Test:** If you delete this, is the information lost or just duplicated?

### 3. Description Conciseness Standard
**Rule:** Descriptions should be 1-2 sentences maximum:
- **First sentence:** What it is
- **Second sentence (optional):** Why it matters

**Test:** Can you read it in 5 seconds?

---

## Schema Conflicts & Implementation Staging

### Conflict 1: Dead Field `examplesAndTemplates`
**Location:** Rendered in app.js:305-312, but empty in content  
**Impact:** Code renders empty section  
**Resolution:**
1. **Phase 1 (Content):** Confirm no content uses this field
2. **Phase 2 (Code):** Remove rendering logic from app.js
3. **Phase 3 (Schema):** Remove from content model

### Conflict 2: Artifacts vs Deliverables Naming
**Location:** Workflow uses `deliverables[]`, Modules use `artifacts[]`  
**Impact:** Inconsistent terminology, harder to cross-reference  
**Resolution:**
1. **Phase 1 (Content):** Standardize all content to use `deliverables[]`
2. **Phase 2 (Code):** Update app.js to render `deliverables[]` in modules
3. **Phase 3 (Schema):** Deprecate `artifacts[]` field

### Conflict 3: Actions vs KeyActivities Overlap
**Location:** Workflow `keyActivities[]` vs Module `actions[]`  
**Impact:** Users see similar content twice  
**Resolution:**
1. **Phase 1 (Content):** Differentiate: keyActivities = workflow sequence, actions = module-specific tasks
2. **Phase 2 (Editorial):** Remove duplicates, ensure complementary content
3. **Phase 3 (Validation):** Cross-check that no action duplicates a keyActivity

### Conflict 4: Checklist Duplication
**Location:** Workflow `readyToMoveOnChecklist[]` vs Module `checklist[]`  
**Impact:** Overlapping but not identical criteria  
**Resolution:**
1. **Phase 1 (Content):** Clarify: readyToMoveOnChecklist = phase gates, module checklist = module-specific verification
2. **Phase 2 (Editorial):** Ensure module checklists are additive, not duplicative
3. **Phase 3 (Validation):** Verify no checklist item appears in both places

---

## Implementation Staging Recommendations

### Stage 1: Content Audit (No Code Changes)
1. Audit all deliverables for missing URLs
2. Identify duplicate deliverables across steps
3. Flag vague checklist items
4. Document keyActivities that duplicate checklist items

**Deliverable:** Audit spreadsheet with cleanup recommendations

### Stage 2: Editorial Cleanup (Content Changes Only)
1. Apply keyActivities consolidation (merge, rewrite, delete)
2. Apply readyToMoveOnChecklist refinement
3. Apply deliverables deduplication and description rewrites
4. Apply commonPitfalls deduplication
5. Apply module crossCuttingGuidance consolidation
6. Apply module phaseSections redundancy removal
7. Apply checklist actionability upgrades

**Deliverable:** Updated content_synced.json

### Stage 3: Schema Alignment (Content + Code Changes)
1. Rename `artifacts[]` to `deliverables[]` in modules
2. Remove `examplesAndTemplates` rendering logic
3. Update app.js to handle unified deliverables field
4. Add cross-reference IDs between workflow and module deliverables

**Deliverable:** Updated content_synced.json + app.js

### Stage 4: Validation (Testing)
1. Verify all URLs are accessible
2. Verify no broken cross-references
3. Verify no duplicate content across pages
4. User testing for clarity and actionability

**Deliverable:** Validation report + final content

---

## Quantitative Cleanup Targets

| Metric | Current | Target | Reduction |
|--------|---------|--------|-----------|
| Avg keyActivities per step | 5.2 | 3.5 | 33% |
| Avg readyToMoveOnChecklist per step | 5.8 | 4.5 | 22% |
| Deliverables missing URLs | 40% | 0% | 100% |
| Duplicate deliverables | ~15 | 0 | 100% |
| Vague checklist items | ~30% | 0% | 100% |
| CrossCuttingGuidance principles | 6-8 | 3-5 | 40% |
| Module actions per phase | 3-5 | 2-3 | 40% |

**Total content reduction estimate:** 25-30% while improving clarity

---

## Risk Mitigation

### Risk 1: Over-deletion
**Mitigation:** Archive original content_synced.json before cleanup, maintain deletion log with rationale

### Risk 2: Breaking cross-references
**Mitigation:** Maintain deliverable IDs during cleanup, validate all ID references before deployment

### Risk 3: Loss of domain knowledge
**Mitigation:** Involve domain experts in editorial review, especially for technical content

### Risk 4: Schema changes breaking rendering
**Mitigation:** Stage schema changes separately from content cleanup, test rendering after each stage

---

## Next Steps

1. **Review this plan** with content owners and domain experts
2. **Prioritize stages** based on user pain points (recommend Stage 2 first for quick wins)
3. **Assign owners** for each cleanup category
4. **Create backup** of current content_synced.json
5. **Begin Stage 1 audit** using this plan as the rubric

---

**Plan Version:** 1.0  
**Date:** 2026-06-17  
**Author:** Bob (Plan Mode)  
**Status:** Ready for review and approval