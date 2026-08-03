const fs = require('fs');
const path = require('path');

const dir = 'd:/Documentos web/de-oportunidades/api-handlers';
const files = fs.readdirSync(dir);
for (const file of files) {
    if (file.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        if (content.includes('export default')) {
            console.log(`${file}: HAS default export`);
        } else {
            console.log(`${file}: NO default export`);
        }
    }
}
