const fs = require('fs');
const path = require('path');

const results = [];

function searchDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'api-handlers' || file === 'api') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('/api/') && (lines[i].includes('import') || lines[i].includes('from'))) {
                    results.push(`${fullPath}:${i+1}: ${lines[i].trim()}`);
                }
            }
        }
    }
}

searchDir('d:/Documentos web/de-oportunidades');
results.forEach(r => console.log(r));
