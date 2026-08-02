const fs = require('fs');
const lines = fs.readFileSync('C:/Users/lucas/.gemini/antigravity/brain/80f94797-484c-473c-bfdd-a4a49ed9fac3/.system_generated/logs/transcript_full.jsonl', 'utf-8').split('\n');
for (let line of lines) {
    if (line.includes('Delete all code below ERPDashboard in StoreAdvancedPanel')) {
        fs.writeFileSync('recovered.json', line);
        console.log('Found it!');
        break;
    }
}
