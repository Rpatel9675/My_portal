const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (let f of fs.readdirSync(dir)) {
    if (f === 'node_modules' || f === '.git' || f.startsWith('.')) continue;
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res.push(...walk(p));
    else if (f.endsWith('.html')) res.push(p);
  }
  return res;
}

const files = walk('.');
console.log('Total HTML files:', files.length);

let missingHeader = [];
let missingFooter = [];

for (let f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('header.js')) missingHeader.push(f);
  if (!content.includes('footer.js')) missingFooter.push(f);
}

console.log('Missing header.js (' + missingHeader.length + '):', missingHeader);
console.log('Missing footer.js (' + missingFooter.length + '):', missingFooter);
