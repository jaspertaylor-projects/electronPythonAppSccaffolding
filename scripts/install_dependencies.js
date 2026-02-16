// scripts/install_dependencies.js
// Purpose: Automates the installation of dependencies for Root, Frontend, and Backend environments.
// Key Internal Depends On: package.json, Frontend/package.json, Backend/API/pyproject.toml
// Key Internal Exported To: (none)

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');

/**
 * Helper to run shell commands synchronously.
 */
function run(command, args, cwd, shell = true) {
  console.log(`[Setup] Running: ${command} ${args.join(' ')} in ${cwd}`);
  const result = spawnSync(command, args, { 
    cwd, 
    stdio: 'inherit', 
    shell 
  });
  if (result.status !== 0) {
    console.error(`[Setup] Command failed with code ${result.status}`);
    process.exit(result.status);
  }
}

// 1. Install Root Dependencies
// This ensures devDependencies like 'concurrently', 'electron', 'wait-on' are installed.
console.log('\n--- Installing Root Dependencies ---');
run('pnpm', ['install'], rootDir);

// Explicitly rebuild electron to ensure the binary is downloaded.
// This fixes the "Electron failed to install correctly" error caused by suppressed postinstall scripts.
console.log('[Setup] Ensuring Electron binary is installed...');
run('pnpm', ['rebuild', 'electron'], rootDir);

// 2. Install Backend Dependencies with uv
console.log('\n--- Installing Backend Dependencies (uv) ---');
const backendDir = path.join(rootDir, 'Backend', 'API');

// Check if uv is installed
const uvCheck = spawnSync('uv', ['--version'], { shell: true });
if (uvCheck.status !== 0) {
  console.error('Error: "uv" is not installed or not in PATH.');
  console.error('Please install uv: https://github.com/astral-sh/uv');
  process.exit(1);
}

// Create venv if it doesn't exist (uv venv creates .venv in cwd)
console.log('Creating/Updating virtual environment...');
run('uv', ['venv'], backendDir);

// Install dependencies from pyproject.toml
console.log('Installing Python dependencies...');
run('uv', ['pip', 'install', '.'], backendDir);

console.log('\n--- Setup Complete ---');
console.log('You can now run "pnpm dev" to start the application.');
