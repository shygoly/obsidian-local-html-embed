const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'manifest.json');
const releaseDir = path.join(repoRoot, 'release');
const requiredReleaseFiles = ['main.js', 'manifest.json', 'versions.json'];
const allowedManifestKeys = new Set([
  'id',
  'name',
  'description',
  'author',
  'version',
  'minAppVersion',
  'isDesktopOnly',
  'authorUrl',
  'fundingUrl',
  'helpUrl'
]);

const fail = (message) => {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
};

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`Unable to parse manifest.json: ${error.message}`);
}

if (manifest) {
  for (const key of Object.keys(manifest)) {
    if (!allowedManifestKeys.has(key)) {
      fail(`manifest.json contains disallowed key "${key}" for community validation.`);
    }
  }
}

try {
  childProcess.execFileSync('node', [path.join(__dirname, 'prepare-release.js')], {
    cwd: repoRoot,
    stdio: 'ignore'
  });
} catch (error) {
  fail(`Unable to prepare release assets: ${error.message}`);
}

if (!fs.existsSync(releaseDir)) {
  fail('release/ directory is missing after release preparation.');
} else {
  for (const filename of requiredReleaseFiles) {
    const target = path.join(releaseDir, filename);
    if (!fs.existsSync(target)) {
      fail(`release/${filename} is missing.`);
      continue;
    }

    const rootSource = fs.readFileSync(path.join(repoRoot, filename), 'utf8');
    const releaseCopy = fs.readFileSync(target, 'utf8');
    if (rootSource !== releaseCopy) {
      fail(`release/${filename} does not match the repository root copy.`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Release validation passed.');
