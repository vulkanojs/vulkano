import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import cleanupEntrypoints from '../scripts/cleanup-entrypoints.js';

const { removeCms, flattenWebsite } = cleanupEntrypoints;

let root;

function write(relPath, content) {
  const abs = path.join(root, relPath);

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-entrypoints-'));

  write('frontend/website/app.js', "import './style.scss';\n");
  write('frontend/cms/app.js', "import './style.scss';\n");
  write('app/views/_shared/templates/cms.html', '<html></html>\n');
  write('app/views/cms/index.html', '{% extends "_shared/templates/cms.html" %}\n');
  write('app/controllers/CmsController.js', 'module.exports = { get() {} };\n');
  write('test/app/controllers/Cms.http.test.js', '// test\n');
  write(
    'vite.config.mjs',
    "export default {\n  build: {\n    rollupOptions: {\n      input: {\n        app: 'frontend/website/app.js',\n        cms: 'frontend/cms/app.js'\n      }\n    }\n  }\n};\n"
  );
  write(
    'app/config/routes.js',
    "module.exports = {\n  '/': 'HomeController.get',\n  '/cms': 'CmsController.get'\n\n  // '/cms/*': 'CmsController.get',\n  // '/*': 'HomeController.get',\n};\n"
  );
  write(
    'AGENTS.md',
    '| Area | SEO | Analytics | Accessibility |\n' +
      '| ---- | --- | --------- | ------------- |\n' +
      '| `/` (`frontend/website/`) — public site | on  | on        | on            |\n' +
      '| `/cms` (`frontend/cms/`) — admin panel  | off | off       | on            |\n'
  );
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('removeCms', () => {
  it('deletes the CMS frontend/backend files and rewrites config/docs', () => {
    removeCms(root);

    expect(fs.existsSync(path.join(root, 'frontend/cms'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/views/_shared/templates/cms.html'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/views/cms'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/controllers/CmsController.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'test/app/controllers/Cms.http.test.js'))).toBe(false);

    const vite = fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf8');
    expect(vite).toContain("app: 'frontend/app.js'");
    expect(vite).not.toContain('cms');

    const routes = fs.readFileSync(path.join(root, 'app/config/routes.js'), 'utf8');
    expect(routes).toContain("'/': 'HomeController.get'");
    expect(routes).not.toContain('cms');

    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    expect(agents).not.toContain('/cms');
    expect(agents).toContain('/` (`frontend/website/`)');
  });
});

describe('flattenWebsite', () => {
  it('moves frontend/website/* up to frontend/ and removes the now-empty folder', () => {
    flattenWebsite(root);

    expect(fs.existsSync(path.join(root, 'frontend/website'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/app.js'))).toBe(true);
  });
});
