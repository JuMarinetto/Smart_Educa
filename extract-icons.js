const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const icons = new Set();
const regex = /<lucide-icon[^>]*\bname=['"]([^'"]+)['"]/g;

walkDir(path.join(__dirname, 'src'), function (filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.html')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        let match;
        while ((match = regex.exec(content)) !== null) {
            icons.add(match[1]);
        }
    }
});

const sortedIcons = Array.from(icons).sort();
fs.writeFileSync('icons.txt', sortedIcons.join(', '));
console.log('Done!');
