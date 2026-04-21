const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const releaseDir = path.join(repoRoot, 'release');
const files = ['main.js', 'manifest.json', 'versions.json'];

fs.mkdirSync(releaseDir, { recursive: true });

for (const filename of files) {
  fs.copyFileSync(path.join(repoRoot, filename), path.join(releaseDir, filename));
}

console.log(`Prepared release assets in ${releaseDir}`);
