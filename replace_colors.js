const fs = require('fs');
const path = require('path');

const dirsToScan = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

const replacements = [
  { from: /bg-cyan-600/g, to: 'bg-accent' },
  { from: /text-cyan-600/g, to: 'text-accent' },
  { from: /hover:bg-cyan-700/g, to: 'hover:bg-accent-dark' },
  { from: /border-cyan-600/g, to: 'border-accent' },
  { from: /hover:text-cyan-700/g, to: 'hover:text-accent-dark' },
  { from: /hover:text-cyan-800/g, to: 'hover:text-accent-dark' },
  { from: /focus:border-cyan-500/g, to: 'focus:border-accent' },
  { from: /focus:ring-cyan-500/g, to: 'focus:ring-accent' },
  { from: /bg-cyan-50/g, to: 'bg-accent/10' },
  { from: /bg-cyan-100/g, to: 'bg-accent/20' },
  { from: /text-cyan-700/g, to: 'text-accent-dark' },
  { from: /text-cyan-500/g, to: 'text-accent' },
  { from: /border-cyan-500/g, to: 'border-accent' },
  { from: /border-cyan-400/g, to: 'border-accent' },
  { from: /border-cyan-300/g, to: 'border-accent' },
  { from: /border-cyan-200/g, to: 'border-accent' },
  { from: /bg-cyan-500\/10/g, to: 'bg-accent/10' },
  { from: /bg-cyan-50\/40/g, to: 'bg-accent/10' },
  { from: /bg-cyan-50\/50/g, to: 'bg-accent/10' },
  { from: /bg-cyan-50\/60/g, to: 'bg-accent/10' },
  { from: /bg-cyan-400\/15/g, to: 'bg-accent/10' },
  { from: /text-cyan-300/g, to: 'text-accent' },
  { from: /bg-gradient-to-r from-cyan-400 to-cyan-600/g, to: 'bg-accent' },
  { from: /bg-gradient-to-br from-cyan-400 to-cyan-600/g, to: 'bg-accent' },
  { from: /bg-\[linear-gradient\([^)]+\)\]/g, to: 'bg-accent/5' },
  { from: /border-cyan-600\/35/g, to: 'border-accent/30' },
  { from: /border-cyan-400\/35/g, to: 'border-accent/30' },
  { from: /animate-ai-pulse/g, to: 'animate-pulse' }
];

function scanAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanAndReplace(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rep of replacements) {
        if (content.match(rep.from)) {
          content = content.replace(rep.from, rep.to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

for (const dir of dirsToScan) {
  scanAndReplace(dir);
}
console.log('Done replacing colors.');
