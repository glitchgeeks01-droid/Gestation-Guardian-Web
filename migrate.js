const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove the CDN script
    content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\r?\n?/g, '');
    
    // Remove the inline config
    const configRegex = /<script id="tailwind-config">[\s\S]*?<\/script>\r?\n?/g;
    content = content.replace(configRegex, '');

    // Determine the relative path to the CSS folder
    const relPath = path.relative(__dirname, filePath);
    const depthCount = relPath.split(path.sep).length - 1;
    
    let cssPath = depthCount > 0 ? '../'.repeat(depthCount) + 'css/output.css' : 'css/output.css';
    const linkTag = `<link href="${cssPath}" rel="stylesheet">\n`;

    // Inject the CSS link before </head>
    if (!content.includes(cssPath)) {
        content = content.replace(/<\/head>/i, `    ${linkTag}</head>`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
}

function findHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                findHtmlFiles(fullPath);
            }
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    }
}

findHtmlFiles(__dirname);
console.log("Migration complete.");
