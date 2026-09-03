'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function rm(root, relPath) {
  fs.rmSync(path.join(root, relPath), { recursive: true, force: true });
}

function readFile(root, relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function writeFile(root, relPath, content) {
  fs.writeFileSync(path.join(root, relPath), content);
}

function flatten(root, name) {
  const from = path.join(root, 'frontend', name);
  const to = path.join(root, 'frontend');

  for (const entry of fs.readdirSync(from)) {
    fs.renameSync(path.join(from, entry), path.join(to, entry));
  }

  fs.rmdirSync(from);
}

function collapseViteConfig(root) {
  writeFile(
    root,
    'vite.config.mjs',
    readFile(root, 'vite.config.mjs')
      .replace(
        "input: {\n        app: 'frontend/website/app.js',\n        admin: 'frontend/admin/app.js'\n      }",
        "input: {\n        app: 'frontend/app.js'\n      }"
      )
      .replace(
        "alias: {\n      '@website': path.resolve(__dirname, 'frontend') + '/website/',\n      '@admin': path.resolve(__dirname, 'frontend') + '/admin/'\n    }",
        'alias: {}'
      )
  );
}

function keepWebsiteOnly(root) {
  rm(root, 'frontend/admin');
  rm(root, 'app/views/_shared/templates/admin.html');
  rm(root, 'app/views/admin');
  rm(root, 'app/controllers/AdminController.js');
  rm(root, 'test/app/controllers/Admin.http.test.js');

  collapseViteConfig(root);

  writeFile(
    root,
    'app/config/routes.js',
    readFile(root, 'app/config/routes.js')
      .replace("  '/': 'HomeController.get',\n  '/admin': 'AdminController.get'", "  '/': 'HomeController.get'")
      .replace("  // '/admin/*': 'AdminController.get',\n", '')
  );

  writeFile(
    root,
    'AGENTS.md',
    readFile(root, 'AGENTS.md').replace(
      '| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |\n',
      ''
    )
  );

  flatten(root, 'website');
}

function keepAdminOnly(root) {
  rm(root, 'frontend/website');
  rm(root, 'app/views/_shared/templates/default.html');
  rm(root, 'app/views/home');
  rm(root, 'app/controllers/HomeController.js');
  rm(root, 'test/app/controllers/Home.http.test.js');

  collapseViteConfig(root);

  writeFile(
    root,
    'app/config/routes.js',
    readFile(root, 'app/config/routes.js')
      .replace("  '/': 'HomeController.get',\n  '/admin': 'AdminController.get'", "  '/': 'AdminController.get'")
      .replace("  // '/admin/*': 'AdminController.get',\n", '')
      .replace("  // '/*': 'HomeController.get',", "  // '/*': 'AdminController.get',")
  );

  writeFile(
    root,
    'AGENTS.md',
    readFile(root, 'AGENTS.md')
      .replace('| `/` (`frontend/website/`) — public site | on  | on        | on            |\n', '')
      .replace(
        '| `/admin` (`frontend/admin/`) — admin panel | off | off       | on            |',
        '| `/` (`frontend/`) — admin panel | off | off       | on            |'
      )
  );

  writeFile(
    root,
    'test/app/controllers/Admin.http.test.js',
    readFile(root, 'test/app/controllers/Admin.http.test.js')
      .replace("GET /admin'", "GET /'")
      .replace('${process.env.PORT}/admin`', '${process.env.PORT}/`')
  );

  flatten(root, 'admin');

  writeFile(
    root,
    'app/views/_shared/templates/admin.html',
    readFile(root, 'app/views/_shared/templates/admin.html').replace(/entry: 'admin'/g, "entry: 'app'")
  );
}

function findWebsiteBase(root) {
  if (fs.existsSync(path.join(root, 'frontend/website/components/HelloWorld'))) return 'frontend/website';
  if (fs.existsSync(path.join(root, 'frontend/components/HelloWorld'))) return 'frontend';

  return null;
}

function stripHelloWorldTemplate(source) {
  return source.replace('\n\n  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />\n', '\n');
}

function stripHelloWorldScript(source) {
  return source
    .replace("import HelloWorld from '../../components/HelloWorld/HelloWorld.vue';\n\n", '')
    .replace('\n\n    HelloWorld\n\n  },', '\n\n  },');
}

function cleanupDemo(root) {
  const websiteBase = findWebsiteBase(root);
  const targets = ['app/controllers/api', 'app/models/Example.js', 'app/models/ExampleWithScaffold.js', 'app/views/demo'];

  if (websiteBase) {
    targets.push(`${websiteBase}/components/HelloWorld`, `${websiteBase}/views/Demo`);
  }

  for (const target of targets) {
    rm(root, target);
    console.log(`Removed ${target}`);
  }

  if (websiteBase) {
    const vuePath = `${websiteBase}/views/Home/Index.vue`;
    const jsPath = `${websiteBase}/views/Home/Index.js`;

    writeFile(root, vuePath, stripHelloWorldTemplate(readFile(root, vuePath)));
    writeFile(root, jsPath, stripHelloWorldScript(readFile(root, jsPath)));
    console.log(`${websiteBase}/views/Home no longer references HelloWorld.`);
  }
}

async function run() {
  const countAnswer = await ask(
    'How many frontend entrypoints do you want — "1" or "2"? (2 keeps both website+admin as shipped): '
  );

  if (countAnswer === '2' || countAnswer === 'both') {
    console.log('Keeping both entrypoints — no changes made.');
  } else if (countAnswer === '1') {
    const keep = await ask('Which one do you want to keep — "website" or "admin"? ');

    if (keep === 'website') {
      keepWebsiteOnly(ROOT);
      console.log('Admin entrypoint removed. frontend/ collapsed back to a single flat app.');
    } else if (keep === 'admin') {
      keepAdminOnly(ROOT);
      console.log('Website entrypoint removed. frontend/ collapsed back to a single flat app (admin).');
    } else {
      console.log('Only "website" or "admin" are supported here. No changes made.');
    }
  } else {
    console.log('Only "1" or "2" are supported here. No changes made.');
  }

  const cleanConfirmed = await ask(
    'Remove demo boilerplate too (example controller/models, HelloWorld homepage)? Type "yes" to continue: '
  );

  if (cleanConfirmed === 'yes') {
    cleanupDemo(ROOT);
  } else {
    console.log('Demo cleanup skipped.');
  }
}

if (require.main === module) {
  void run();
}

module.exports = { keepWebsiteOnly, keepAdminOnly, findWebsiteBase, cleanupDemo, stripHelloWorldTemplate, stripHelloWorldScript };
