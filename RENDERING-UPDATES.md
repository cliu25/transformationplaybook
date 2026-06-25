# V7 Rendering Updates - Applied

## Summary
Updated v7 rendering to match content_synced.json structure and fixed Case Study styling. **Content was NOT regenerated** - only rendering logic was updated.

## Changes Applied

### 1. Phase Restructure with Duration Badges (app.js)
**File:** `js/app.js` - `renderWorkflowTabContent()` function

**Changes:**
- Added `officialDuration` and `officialSteps` badges to each phase group header
- Badges display inline with phase name using flexbox layout
- Shows duration info like "Upfront · run rapidly", "~2 weeks per workflow", "90 days (Experimentation) · then Scale & Adopt (Beyond)"

**Phase Structure Now Renders:**
1. **Engage** (2 steps):
   - Assess (8 artifacts)
   - Analyze (3 artifacts) ← moved from Discover in v7 content
   - Duration: "Upfront · run rapidly"
   - Steps: "Step 1 Tech & Data Foundations · Step 2 Business Process Mapping"

2. **Discover** (1 step):
   - Design (5 artifacts) ← ONLY step now
   - Duration: "~2 weeks per workflow"
   - Steps: "Step 3 Workflow Analysis · Step 4 Solution Design"

3. **Execute** (2 steps):
   - Build — Experimentation (7 artifacts) ← shows subtext about stress-testing
   - Sustain — Scale & Adopt (6 artifacts)
   - Duration: "90 days (Experimentation) · then Scale & Adopt (Beyond)"
   - Steps: "Step 5 Experimentation · Step 6 Scale & Adopt"

### 2. Artifact Card External Links (app.js)
**File:** `js/app.js` - `renderDeliverableCard()` function

**Changes:**
- Added external link icon to EVERY artifact card (both clickable and muted)
- Icon opacity varies: full opacity for clickable cards, reduced for muted cards
- When `boxUrl` is empty: shows "Link coming soon" muted state
- When `boxUrl` is set: opens with `target="_blank" rel="noopener,noreferrer"`
- Badge styling differentiates "example" vs "template" types

### 3. Case Study Cast Pills Fix (app.js)
**File:** `js/app.js` - `renderCaseStudyPage()` function

**Changes:**
- Fixed cast pills to show SINGLE outline style (removed double borders)
- Shows ONLY role names from `keyPlayers` array (simple string array)
- Removed complex `keyPlayersDetailed` logic that was causing nested containers
- Simplified rendering: `${caseStudy.keyPlayers.map(name => `<span>${name}</span>`).join('')}`

### 4. CSS Styling Fixes (styles.css)
**File:** `css/styles.css`

**Changes Made:**

#### Timeline Spacing (lines 1323-1335)
- Reduced `.week` padding-bottom from 26px to 20px (tighter spacing)
- Reduced `.wk-label` margin-bottom from 11px to 8px and padding-top from 11px to 8px
- Reduced `.wk-did` gap from 7px to 5px and margin-bottom from 14px to 10px
- Adjusted `.wk-did li` line-height from 1.5 to 1.45 for tighter text
- Adjusted bullet position from `top: 8px` to `top: 7px`

#### Grey Box Removal (line 1224)
- Removed `.panel.soft` class definition that added grey background
- Overview panel now uses standard white background like Cast panel
- Removed `border-color: #f0f0f0` override

#### External Link Icon Styling (lines 838-850)
- Base icon opacity: 0.7
- Clickable card icon: opacity 1 (full visibility)
- Muted card icon: opacity 0.3 (very subtle)

#### Cast Pills (line 1228)
- Pills maintain single border: `border: 1px solid var(--border-subtle)`
- Clean rounded style: `border-radius: 99px`
- Consistent padding: `padding: 5px 11px`

## Testing Checklist

✅ End-to-End Workflow page:
- Phase groups show duration and steps badges
- Engage shows 2 steps (Assess, Analyze)
- Discover shows 1 step (Design)
- Execute shows 2 steps (Build, Sustain)
- All artifact cards show external link icons
- "Link coming soon" appears for empty boxUrl

✅ Case Study page:
- Overview panel has white background (no grey)
- Cast pills show single outline with role names only
- Timeline bubbles have tighter spacing
- Week content has reduced line-height and gaps
- No redundant nested containers

## Files Modified
1. `aift-playbook-site-v7/js/app.js` - 3 functions updated
2. `aift-playbook-site-v7/css/styles.css` - 4 sections updated

## Notes
- Content structure in `content_synced.json` was NOT modified
- All changes are rendering-only updates
- Site running at http://localhost:8080 (Terminal 3)
- Changes are backward compatible with existing content structure