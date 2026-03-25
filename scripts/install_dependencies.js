// scripts/install_dependencies.js
// Purpose: Bootstraps the local JS workspace and Python backend environment in one command.
// Key Internal Depends On: package.json, Frontend/package.json, Backend/API/pyproject.toml
// Key Internal Exported To: package.json

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'Backend', 'API');
const corepackHome = path.join(rootDir, '.corepack');
const pipCacheDir = path.join(rootDir, '.pip-cache');
const isDryRun = process.argv.includes('--dry-run');

function fail(message) {
  console.error(`[Setup] ${message}`);
  process.exit(1);
}

function quoteForLog(value) {
  return /\s/.test(value) ? `"${value}"` : value;
}

function run(command, args, cwd, extraEnv = {}) {
  console.log(`[Setup] ${cwd}`);
  console.log(`         ${[command, ...args].map(quoteForLog).join(' ')}`);

  if (isDryRun) {
    return;
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...extraEnv
    }
  });

  if (result.status !== 0) {
    fail(`Command failed with exit code ${result.status}.`);
  }
}

function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });

  return result.status === 0;
}

function resolvePythonCommand() {
  const candidates = ['python3', 'python'];

  for (const candidate of candidates) {
    if (commandExists(candidate)) {
      return candidate;
    }
  }

  fail('Python 3 is required but was not found in PATH.');
}

function resolvePnpmInvocation() {
  if (commandExists('pnpm')) {
    return {
      command: 'pnpm',
      argsPrefix: [],
      env: {}
    };
  }

  if (commandExists('corepack')) {
    return {
      command: 'corepack',
      argsPrefix: ['pnpm'],
      env: { COREPACK_HOME: corepackHome }
    };
  }

  fail('Neither pnpm nor Corepack was found in PATH. Install Node.js with Corepack support or pnpm and try again.');
}

function getVenvPythonPath() {
  return process.platform === 'win32'
    ? path.join(backendDir, '.venv', 'Scripts', 'python.exe')
    : path.join(backendDir, '.venv', 'bin', 'python');
}

if (!commandExists('node')) {
  fail('Node.js is required but was not found in PATH.');
}

const pythonCommand = resolvePythonCommand();
const pnpmInvocation = resolvePnpmInvocation();

if (!fs.existsSync(path.join(backendDir, 'pyproject.toml'))) {
  fail(`Expected backend project at ${backendDir}, but pyproject.toml was not found.`);
}

fs.mkdirSync(corepackHome, { recursive: true });
fs.mkdirSync(pipCacheDir, { recursive: true });

console.log('\n--- Installing JavaScript Workspace Dependencies ---');
run(
  pnpmInvocation.command,
  [...pnpmInvocation.argsPrefix, 'install'],
  rootDir,
  pnpmInvocation.env
);

// Electron occasionally needs an explicit rebuild so the binary is present.
run(
  pnpmInvocation.command,
  [...pnpmInvocation.argsPrefix, 'rebuild', 'electron'],
  rootDir,
  pnpmInvocation.env
);

console.log('\n--- Creating Backend Virtual Environment ---');
run(pythonCommand, ['-m', 'venv', '.venv'], backendDir);

const venvPython = getVenvPythonPath();
if (!isDryRun && !fs.existsSync(venvPython)) {
  fail(`Virtual environment was created, but Python executable was not found at ${venvPython}.`);
}

console.log('\n--- Installing Backend Python Dependencies ---');
run(
  venvPython,
  ['-m', 'pip', 'install', '.'],
  backendDir,
  {
    PIP_CACHE_DIR: pipCacheDir,
    PIP_DISABLE_PIP_VERSION_CHECK: '1',
    PIP_NO_INPUT: '1'
  }
);

console.log('\n--- Setup Complete ---');
console.log('JavaScript dependencies live in this repo and the Python backend uses Backend/API/.venv.');
console.log('Next step: run "npm run dev" from the project root.');
