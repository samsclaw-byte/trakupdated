const { execSync } = require('child_process');
const fs = require('fs');
try {
    execSync('npx eslint src/ --format json', { stdio: 'pipe' });
    console.log("No lint errors.");
} catch (e) {
    fs.writeFileSync('lint-clean.json', e.stdout);
    const data = JSON.parse(fs.readFileSync('lint-clean.json', 'utf8'));
    const errors = data.flatMap(f => f.messages.filter(m => m.severity > 0).map(m => `FILE: ${f.filePath}:${m.line} - ${m.ruleId} - ${m.message}`));
    console.log(errors.join('\n'));
}
