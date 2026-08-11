const fs = require('fs');
const path = require('path');

function searchFiles(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                searchFiles(fullPath, query);
            }
        } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                console.log(`Found "${query}" in: ${fullPath}`);
            }
        }
    }
}
console.log("--- Searching for history ---");
searchFiles(__dirname, "history");
console.log("--- Searching for GG Doctor Dashboard ---");
searchFiles(__dirname, "GG Doctor Dashboard");
console.log("--- Searching for GG Doctor Dashboard ---");
searchFiles(__dirname, "GG Doctor Dashboard");
