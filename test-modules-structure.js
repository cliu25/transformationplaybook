// Test script to verify module structure matches requirements
// Run in browser console on http://localhost:8080

console.log('=== MODULE STRUCTURE TEST ===\n');

// Expected structure for each module
const expectedStructure = {
    'value-measurement-roi': {
        name: 'Value Measurement & ROI',
        relevantPhases: ['assess', 'analyze', 'build', 'sustain'],
        phaseCount: 4
    },
    'prioritization-roadmap': {
        name: 'Prioritization & Roadmap',
        relevantPhases: ['assess'],
        phaseCount: 1
    },
    'systems-integration': {
        name: 'Systems Integration',
        relevantPhases: ['analyze', 'build'],
        phaseCount: 2
    },
    'adoption-change': {
        name: 'Adoption & Change',
        relevantPhases: ['design', 'sustain'],
        phaseCount: 2
    },
    'governance-risk': {
        name: 'Governance & Risk',
        relevantPhases: ['assess', 'design', 'sustain'],
        phaseCount: 3
    }
};

// Test each module
Object.keys(expectedStructure).forEach(moduleId => {
    const expected = expectedStructure[moduleId];
    console.log(`\n📋 Testing: ${expected.name}`);
    console.log('─'.repeat(50));
    
    // Find the module in content
    const module = content.modules.chapters.find(ch => ch.id === moduleId);
    
    if (!module) {
        console.error(`❌ Module not found: ${moduleId}`);
        return;
    }
    
    // Check phaseSections
    const actualPhases = module.phaseSections ? 
        module.phaseSections.map(s => s.stepId) : [];
    
    console.log(`Expected phases: ${expected.relevantPhases.join(', ')}`);
    console.log(`Actual phases: ${actualPhases.join(', ')}`);
    
    // Verify phase count
    if (actualPhases.length === expected.phaseCount) {
        console.log(`✅ Phase count correct: ${expected.phaseCount}`);
    } else {
        console.error(`❌ Phase count mismatch: expected ${expected.phaseCount}, got ${actualPhases.length}`);
    }
    
    // Verify each expected phase exists
    let allPhasesMatch = true;
    expected.relevantPhases.forEach(phase => {
        if (actualPhases.includes(phase)) {
            console.log(`✅ Phase "${phase}" found`);
        } else {
            console.error(`❌ Phase "${phase}" missing`);
            allPhasesMatch = false;
        }
    });
    
    // Check for unexpected phases
    actualPhases.forEach(phase => {
        if (!expected.relevantPhases.includes(phase)) {
            console.error(`❌ Unexpected phase "${phase}" found`);
            allPhasesMatch = false;
        }
    });
    
    if (allPhasesMatch && actualPhases.length === expected.phaseCount) {
        console.log(`✅ ${expected.name} structure is CORRECT`);
    } else {
        console.error(`❌ ${expected.name} structure has ERRORS`);
    }
});

console.log('\n' + '='.repeat(50));
console.log('TEST COMPLETE');
console.log('='.repeat(50));

// Made with Bob
