const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath, query);
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes(query)) {
                console.log(`Found in: ${fullPath}`);
            }
        }
    }
}

searchDir('d:/Documentos web/de-oportunidades', '/api/');
