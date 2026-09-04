import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import clean from '../scripts/clean.js';

const {
  keepWebsiteOnly,
  findWebsiteBase,
  cleanupDemo,
  stripHelloWorldTemplate,
  stripHelloWorldScript
} = clean;

let root;

function write(relPath, content) {
  const abs = path.join(root, relPath);

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

function writeEntrypointsFixture() {
  write('frontend/website/app.js', "import './style.scss';\n");
  write('frontend/admin/app.js', "import './style.scss';\n");
  write(
    'app/views/_shared/templates/default.html',
    "{{ vite({ entry: 'app', type: 'script' }) | safe }}\n"
  );
  write(
    'app/views/_shared/templates/admin.html',
    "{{ vite({ entry: 'admin', type: 'script' }) | safe }}\n"
  );
  write('app/views/home/index.html', '{% extends "_shared/templates/default.html" %}\n');
  write('app/views/admin/index.html', '{% extends "_shared/templates/admin.html" %}\n');
  write('app/controllers/HomeController.js', 'module.exports = { get() {} };\n');
  write('app/controllers/AdminController.js', 'module.exports = { get() {} };\n');
  write(
    'test/app/controllers/Home.http.test.js',
    "describe('GET /', () => {\n" +
      "  it('x', async () => {\n" +
      '    const res = await fetch(`http://localhost:${process.env.PORT}/`);\n' +
      '  });\n' +
      '});\n'
  );
  write(
    'test/app/controllers/Admin.http.test.js',
    "describe('GET /admin', () => {\n" +
      "  it('x', async () => {\n" +
      '    const res = await fetch(`http://localhost:${process.env.PORT}/admin`);\n' +
      '  });\n' +
      '});\n'
  );
  write(
    'vite.config.mjs',
    'export default {\n' +
      '  build: {\n' +
      '    rollupOptions: {\n' +
      "      input: {\n        app: 'frontend/website/app.js',\n        admin: 'frontend/admin/app.js'\n      }\n" +
      '    }\n' +
      '  },\n' +
      '  resolve: {\n' +
      "    alias: {\n      '@website': path.resolve(__dirname, 'frontend') + '/website/',\n      '@admin': path.resolve(__dirname, 'frontend') + '/admin/'\n    }\n" +
      '  }\n' +
      '};\n'
  );
  write(
    'app/config/routes.js',
    "module.exports = {\n  '/': 'HomeController.get',\n  '/admin': 'AdminController.get'\n\n  // '/admin/*': 'AdminController.get',\n  // '/*': 'HomeController.get',\n};\n"
  );
  write(
    'AGENTS.md',
    '| Area | SEO | Analytics | Accessibility |\n' +
      '| ---- | --- | --------- | ------------- |\n' +
      '| `/` (`frontend/website/`) — public site | on  | on        | on            |\n' +
      '| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |\n'
  );
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'clean-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('keepWebsiteOnly', () => {
  it('removes the admin entrypoint and flattens website back to frontend/', () => {
    writeEntrypointsFixture();

    keepWebsiteOnly(root);

    expect(fs.existsSync(path.join(root, 'frontend/admin'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/website'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/app.js'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'app/views/_shared/templates/admin.html'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/views/admin'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/controllers/AdminController.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'test/app/controllers/Admin.http.test.js'))).toBe(false);

    const vite = fs.readFileSync(path.join(root, 'vite.config.mjs'), 'utf8');
    expect(vite).toContain("app: 'frontend/app.js'");
    expect(vite).not.toContain('admin');

    const routes = fs.readFileSync(path.join(root, 'app/config/routes.js'), 'utf8');
    expect(routes).toContain("'/': 'HomeController.get'");
    expect(routes).not.toContain('admin');

    const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
    expect(agents).not.toContain('/admin');
    expect(agents).toContain('/` (`frontend/website/`)');
  });

  it('merges instead of crashing when frontend/ already has leftover entries from a previous run', () => {
    writeEntrypointsFixture();
    write('frontend/app.js', 'stale leftover from a crashed previous run\n');

    expect(() => keepWebsiteOnly(root)).not.toThrow();

    expect(fs.existsSync(path.join(root, 'frontend/website'))).toBe(false);
    expect(fs.readFileSync(path.join(root, 'frontend/app.js'), 'utf8')).toBe(
      "import './style.scss';\n"
    );
  });
});

describe('findWebsiteBase / cleanupDemo', () => {
  it('finds the website demo at frontend/website when present', () => {
    write('frontend/website/components/HelloWorld/HelloWorld.vue', '<template></template>\n');

    expect(findWebsiteBase(root)).toBe('frontend/website');
  });

  it('finds the website demo at a flattened frontend/ when present', () => {
    write('frontend/components/HelloWorld/HelloWorld.vue', '<template></template>\n');

    expect(findWebsiteBase(root)).toBe('frontend');
  });

  it('returns null when there is no website demo', () => {
    write('frontend/app.js', "import './style.scss';\n");

    expect(findWebsiteBase(root)).toBe(null);
  });

  it('removes demo backend targets and strips HelloWorld from the website home view', () => {
    write('app/controllers/api/Example.js', 'module.exports = {};\n');
    write('app/models/Example.js', 'module.exports = {};\n');
    write('app/models/ExampleWithScaffold.js', 'module.exports = {};\n');
    write('app/views/demo/index.html', '<html></html>\n');
    write('frontend/website/components/HelloWorld/HelloWorld.vue', '<template></template>\n');
    write('frontend/website/views/Demo/Index.vue', '<template></template>\n');
    write(
      'frontend/website/views/Home/Index.vue',
      '<template>\n\n  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />\n\n</template>\n'
    );
    write(
      'frontend/website/views/Home/Index.js',
      "import HelloWorld from '../../components/HelloWorld/HelloWorld.vue';\n\nexport default {\n\n  components: {\n\n    HelloWorld\n\n  },\n\n};\n"
    );

    cleanupDemo(root);

    expect(fs.existsSync(path.join(root, 'app/controllers/api'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/models/Example.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/models/ExampleWithScaffold.js'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'app/views/demo'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/website/components/HelloWorld'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/website/views/Demo'))).toBe(false);

    const vue = fs.readFileSync(path.join(root, 'frontend/website/views/Home/Index.vue'), 'utf8');
    const js = fs.readFileSync(path.join(root, 'frontend/website/views/Home/Index.js'), 'utf8');

    expect(vue).not.toContain('HelloWorld');
    expect(js).not.toContain('HelloWorld');
  });

  it('only removes backend demo targets when there is no website demo', () => {
    write('app/controllers/api/Example.js', 'module.exports = {};\n');
    write('frontend/app.js', "import './style.scss';\n");

    cleanupDemo(root);

    expect(fs.existsSync(path.join(root, 'app/controllers/api'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'frontend/app.js'))).toBe(true);
  });
});

describe('stripHelloWorldTemplate', () => {
  it('removes the HelloWorld tag and collapses the surrounding blank lines', () => {
    const source = [
      '<template>',
      '',
      '  <div class="home">',
      '    <a href="https://github.com/vulkanojs/vulkano" target="_blank">',
      '      <img src="/img/vulkano-logo-optimized.png" alt="Vulkano logo" />',
      '    </a>',
      '  </div>',
      '',
      '  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />',
      '',
      '  <p>',
      '    Edit',
      '  </p>',
      '',
      '</template>',
      '',
      '<script src="./Index.js"></script>',
      ''
    ].join('\n');

    const result = stripHelloWorldTemplate(source);

    expect(result).not.toContain('HelloWorld');
    expect(result).toBe(
      [
        '<template>',
        '',
        '  <div class="home">',
        '    <a href="https://github.com/vulkanojs/vulkano" target="_blank">',
        '      <img src="/img/vulkano-logo-optimized.png" alt="Vulkano logo" />',
        '    </a>',
        '  </div>',
        '',
        '  <p>',
        '    Edit',
        '  </p>',
        '',
        '</template>',
        '',
        '<script src="./Index.js"></script>',
        ''
      ].join('\n')
    );
  });
});

describe('stripHelloWorldScript', () => {
  it('removes the import and the components entry', () => {
    const source = [
      "import HelloWorld from '../../components/HelloWorld/HelloWorld.vue';",
      '',
      'export default {',
      '',
      '  components: {',
      '',
      '    HelloWorld',
      '',
      '  },',
      '',
      '  setup() {',
      '',
      '    return {',
      '',
      '    };',
      '',
      '  }',
      '',
      '};',
      ''
    ].join('\n');

    const result = stripHelloWorldScript(source);

    expect(result).not.toContain('HelloWorld');
    expect(result).toBe(
      [
        'export default {',
        '',
        '  components: {',
        '',
        '  },',
        '',
        '  setup() {',
        '',
        '    return {',
        '',
        '    };',
        '',
        '  }',
        '',
        '};',
        ''
      ].join('\n')
    );
  });
});
