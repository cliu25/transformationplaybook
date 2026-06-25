import json
import re

# Load the content file
with open('content_synced.json', 'r', encoding='utf-8') as f:
    content = json.load(f)

# Define the ready to advance text for each module and phase
ready_to_advance_map = {
    "value-measurement-roi": {
        "assess": "You're ready to advance when you have a directional value hypothesis tied to a hard benefit, and you've confirmed it can actually be measured.",
        "analyze": "You're ready to advance when 3–5 metrics, their baselines, their capture method, and a payback threshold are all agreed and signed off by finance.",
        "design": "You're ready to advance when every metric has its tracking specified in the requirements and a named source of record.",
        "build": "You're ready to advance when you have measured value from real usage and a numbers-backed scaling recommendation against the payback target.",
        "sustain": "You're ready to advance when realized value is finance-confirmed against baseline and reporting runs on a standing executive cadence."
    },
    "prioritization-roadmap": {
        "assess": "You're ready to advance when you have a short, screened list of candidate workflows — each with a clear problem, a rough sense of its value, and a real sponsor.",
        "analyze": "You're ready to advance when one workflow is chosen to build first, with a written reason it won, and the rest are parked or dropped.",
        "design": "You're ready to advance when the first version is clearly scoped, the riskiest assumptions are ranked for testing, and you have a rough phased plan."
    },
    "systems-integration": {
        "assess": "You're ready to advance when you have an honest data-and-technology readiness read and know the integration constraints before committing.",
        "analyze": "You're ready to advance when the technical dependencies, review path, and data-pipeline needs are documented and feasible.",
        "design": "You're ready to advance when you have a build-ready requirements package, a documented tech-stack decision, and a fallback path defined.",
        "build": "You're ready to advance when the first version runs on validated real data, is tracked end-to-end, and high-impact outputs have a human checkpoint.",
        "sustain": "You're ready to advance when a named technical owner holds the full handoff package and monitoring for model drift is live."
    },
    "adoption-change": {
        "assess": "You're ready to advance when you know who is affected and how, and change management is a funded, owned workstream.",
        "analyze": "You're ready to advance when the future-state process is re-envisioned and each affected role has a clear \"what's in it for me,\" with visible leadership backing.",
        "design": "You're ready to advance when real test users are recruited, a training and cutover plan exists, and change is built into the delivery cadence.",
        "build": "You're ready to advance when real users are using the early version for actual work and trust is rising on the back of explainability and feedback loops.",
        "sustain": "You're ready to advance when the domain owns adoption, the old process is retired, and usage is holding above target."
    },
    "governance-risk": {
        "assess": "You're ready to advance when the team is staffed with clear accountability, the steering committee is standing, and the risk log is open.",
        "analyze": "You're ready to advance when the chosen workflow's risks and dependencies are logged and any high-risk exposure is flagged.",
        "design": "You're ready to advance when the operating cadence, escalation path, and decision rights are agreed before the build starts.",
        "build": "You're ready to advance when the steering cadence is clearing blockers weekly and risks are being actioned, not just tracked.",
        "sustain": "You're ready to advance when every owner is named, the governance council and monitoring are live, and open risks are handed to the ongoing cadence."
    }
}

# Add readyToAdvance to each phase section in each module
for chapter in content['modules']['chapters']:
    module_id = chapter['id']
    if module_id in ready_to_advance_map:
        for phase_section in chapter['phaseSections']:
            step_id = phase_section['stepId']
            if step_id in ready_to_advance_map[module_id]:
                # Add readyToAdvance field after description
                phase_section['readyToAdvance'] = ready_to_advance_map[module_id][step_id]
                print(f"Added readyToAdvance to {module_id} - {step_id}")

# Save the updated content
with open('content_synced.json', 'w', encoding='utf-8') as f:
    json.dump(content, f, indent=2, ensure_ascii=False)

print("\nDone! All readyToAdvance fields have been added to module phase sections.")

# Made with Bob
