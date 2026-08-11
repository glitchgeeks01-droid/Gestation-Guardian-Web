const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace names
    content = content.replace(/GG Doctor Dashboard/g, 'GG Doctor Dashboard');
    content = content.replace(/GG Doctor Dashboard/g, 'GG Doctor Dashboard');
    
    // Replace history typo to fix Material Symbols rendering
    content = content.replace(/history/g, 'history');
    
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
console.log("Renaming and typo fixing complete.");
