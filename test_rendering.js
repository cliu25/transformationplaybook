// Quick test to check if module data is being rendered correctly
const fs = require('fs');

const content = JSON.parse(fs.readFileSync('content_synced.json', 'utf8'));

// Find Value Measurement module
const module = content.modules.chapters.find(ch => ch.id === 'value-measurement-roi');

console.log('Module found:', module.title);
console.log('Number of phaseSections:', module.phaseSections.length);

module.phaseSections.forEach((section, idx) => {
  console.log(`\n=== Section ${idx + 1}: ${section.stepName} (${section.phaseGroup}) ===`);
  console.log('Description:', section.description ? 'YES' : 'NO');
  console.log('Actions:', section.actions ? section.actions.length : 0);
  console.log('Checklist:', section.checklist ? section.checklist.length : 0);
  console.log('Artifacts:', section.artifacts ? section.artifacts.length : 0);
  console.log('Common Pitfalls:', section.commonPitfalls ? section.commonPitfalls.length : 0);
  console.log('Example:', section.example ? 'YES' : 'NO');
  console.log('Who to Contact:', section.whoToContact ? 'YES' : 'NO');
});
