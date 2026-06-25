import json

# Load the content file
with open('content_synced.json', 'r', encoding='utf-8') as f:
    content = json.load(f)

# Define which ones to remove: module_id -> list of stepIds to remove
to_remove = {
    "value-measurement-roi": ["assess", "design"],
    "systems-integration": ["assess", "sustain"]
}

# Remove readyToAdvance from specified phase sections
removed_count = 0
for chapter in content['modules']['chapters']:
    module_id = chapter['id']
    if module_id in to_remove:
        for phase_section in chapter['phaseSections']:
            step_id = phase_section['stepId']
            if step_id in to_remove[module_id]:
                if 'readyToAdvance' in phase_section:
                    del phase_section['readyToAdvance']
                    removed_count += 1
                    print(f"Removed readyToAdvance from {module_id} - {step_id}")

# Save the updated content
with open('content_synced.json', 'w', encoding='utf-8') as f:
    json.dump(content, f, indent=2, ensure_ascii=False)

print(f"\nDone! Removed {removed_count} readyToAdvance fields.")

# Made with Bob
