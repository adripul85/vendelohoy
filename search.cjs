const fs = require('fs');
const path = require('path');

const query = process.argv[2];
const isRegex = process.argv[3] === 'true';
const searchRegex = isRegex ? new RegExp(query, 'i') : null;

function searchDir(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(searchDir(fullPath));
        } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (isRegex ? searchRegex.test(lines[i]) : lines[i].toLowerCase().includes(query.toLowerCase())) {
                    results.push(`${fullPath}:${i+1}: ${lines[i].trim()}`);
                }
            }
        }
    }
    return results;
}

const res = searchDir('d:/Documentos web/de-oportunidades');
if(res.length > 50) {
    console.log(res.slice(0, 50).join('\n'));
    console.log(`...and ${res.length - 50} more`);
} else {
    console.log(res.join('\n'));
}
