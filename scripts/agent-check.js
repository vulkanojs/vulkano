'use strict';

// Claude Code PostToolUse hook (.claude/settings.json): runs `vp check --fix`
// on the file the agent just edited. Exit 2 sends what's left to the agent's
// stderr so it fixes it in the same turn; exit 0 means clean or skipped.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const CHECKED_EXTENSIONS = ['.js', '.mjs', '.mts', '.ts', '.vue', '.scss', '.json'];
const CHECKED_DIRS = ['app', 'frontend', 'scripts', 'test'];

function shouldCheck(filePath) {
  if (!filePath) {
    return false;
  }

  const relative = path.relative(REPO_ROOT, filePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return false;
  }

  return (
    CHECKED_DIRS.includes(relative.split(path.sep)[0]) &&
    CHECKED_EXTENSIONS.includes(path.extname(filePath))
  );
}

function main(input) {
  let filePath;

  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch (_err) {
    return 0;
  }

  if (!shouldCheck(filePath)) {
    return 0;
  }

  const vp = path.join(REPO_ROOT, 'node_modules', '.bin', 'vp');

  // No install yet (e.g. a fresh worktree): nothing to run, don't block edits
  if (!fs.existsSync(vp)) {
    return 0;
  }
  const result = spawnSync(vp, ['check', '--fix', filePath], { cwd: REPO_ROOT, encoding: 'utf8' });

  if (result.status === 0) {
    return 0;
  }

  process.stderr.write(`vp check failed for ${path.relative(REPO_ROOT, filePath)}:\n`);
  process.stderr.write(`${result.stdout}${result.stderr}`);

  return 2;
}

if (require.main === module) {
  let input = '';

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    process.exit(main(input));
  });
}

module.exports = { shouldCheck, main };
