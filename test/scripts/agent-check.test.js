import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import agentCheck from '../../scripts/agent-check.js';

const { shouldCheck } = agentCheck;

const root = path.resolve(__dirname, '../..');
const script = path.join(root, 'scripts/agent-check.js');
const probe = path.join(root, 'frontend/website/_agentCheckProbe.js');

function runHook(filePath) {
  return spawnSync('node', [script], {
    input: JSON.stringify({ hook_event_name: 'PostToolUse', tool_input: { file_path: filePath } }),
    encoding: 'utf8'
  });
}

afterEach(() => {
  fs.rmSync(probe, { force: true });
});

describe('shouldCheck', () => {
  it('checks source files in app/, frontend/, scripts/ and test/', () => {
    expect(shouldCheck(path.join(root, 'app/controllers/HomeController.js'))).toBe(true);
    expect(shouldCheck(path.join(root, 'frontend/website/App.vue'))).toBe(true);
    expect(shouldCheck(path.join(root, 'scripts/webp.js'))).toBe(true);
    expect(shouldCheck(path.join(root, 'test/conventions.test.js'))).toBe(true);
  });

  it('skips other folders, other extensions and paths outside the repo', () => {
    expect(shouldCheck(path.join(root, 'README.md'))).toBe(false);
    expect(shouldCheck(path.join(root, 'vite.config.ts'))).toBe(false);
    expect(shouldCheck(path.join(root, 'app/views/home/index.html'))).toBe(false);
    expect(shouldCheck(path.join(root, 'node_modules/vue/index.js'))).toBe(false);
    expect(shouldCheck(path.join(root, 'public/js/app.js'))).toBe(false);
    expect(shouldCheck('/tmp/elsewhere.js')).toBe(false);
    expect(shouldCheck(undefined)).toBe(false);
  });
});

describe('agent-check hook', () => {
  it('exits 0 and auto-fixes a fixable file', () => {
    fs.writeFileSync(probe, 'export const a = "x"\n');

    const result = runHook(probe);

    expect(result.status).toBe(0);
    expect(fs.readFileSync(probe, 'utf8')).toBe("export const a = 'x';\n");
  });

  it('exits 2 with the errors on stderr when a rule still fails', () => {
    fs.writeFileSync(probe, "export function f() {\n  window.confirm('x');\n}\n");

    const result = runHook(probe);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('no-restricted-properties');
  });

  it('exits 0 without checking a skipped file or bad input', () => {
    expect(runHook(path.join(root, 'README.md')).status).toBe(0);
    expect(spawnSync('node', [script], { input: 'not json', encoding: 'utf8' }).status).toBe(0);
  });
});
