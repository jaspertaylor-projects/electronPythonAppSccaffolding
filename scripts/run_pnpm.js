// scripts/run_pnpm.js
// Purpose: Runs pnpm through Corepack using a repo-local Corepack cache.
// Key Internal Depends On: package.json
// Key Internal Exported To: package.json

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const corepackHome = path.join(rootDir, '.corepack');
const args = process.argv.slice(2);

fs.mkdirSync(corepackHome, { recursive: true });

const invocation = commandExists('pnpm')
  ? {
      command: 'pnpm',
      args: args,
      env: process.env
    }
  : {
      command: 'corepack',
      args: ['pnpm', ...args],
      env: {
        ...process.env,
        COREPACK_HOME: corepackHome
      }
    };

const result = spawnSync(invocation.command, invocation.args, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: invocation.env
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

function commandExists(command) {
  const probe = spawnSync(command, ['--version'], {
    stdio: 'ignore',
    shell: process.platform === 'win32'
  });

  return probe.status === 0;
}
