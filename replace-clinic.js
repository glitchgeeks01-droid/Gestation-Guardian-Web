const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace GG Doctor Dashboard
    content = content.replace(/GG Doctor Dashboard/ig, 'GG Doctor Dashboard');
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function processFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                processFiles(fullPath);
            }
        } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.md')) {
            replaceInFile(fullPath);
        }
    }
}

processFiles(__dirname);
console.log("Replaced GG Doctor Dashboard with GG Doctor Dashboard.");
