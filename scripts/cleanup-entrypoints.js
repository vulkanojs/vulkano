'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

function askChoice(question) {
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

function flattenWebsite(root) {
  const from = path.join(root, 'frontend/website');
  const to = path.join(root, 'frontend');

  for (const entry of fs.readdirSync(from)) {
    fs.renameSync(path.join(from, entry), path.join(to, entry));
  }

  fs.rmdirSync(from);
}

function removeCms(root) {
  rm(root, 'frontend/cms');
  rm(root, 'app/views/_shared/templates/cms.html');
  rm(root, 'app/views/cms');
  rm(root, 'app/controllers/CmsController.js');
  rm(root, 'test/app/controllers/Cms.http.test.js');

  const vitePath = path.join(root, 'vite.config.mjs');

  fs.writeFileSync(
    vitePath,
    fs
      .readFileSync(vitePath, 'utf8')
      .replace(
        "input: {\n        app: 'frontend/website/app.js',\n        cms: 'frontend/cms/app.js'\n      }",
        "input: {\n        app: 'frontend/app.js'\n      }"
      )
  );

  const routesPath = path.join(root, 'app/config/routes.js');

  fs.writeFileSync(
    routesPath,
    fs
      .readFileSync(routesPath, 'utf8')
      .replace(
        "  '/': 'HomeController.get',\n  '/cms': 'CmsController.get'",
        "  '/': 'HomeController.get'"
      )
      .replace("  // '/cms/*': 'CmsController.get',\n", '')
  );

  const agentsPath = path.join(root, 'AGENTS.md');

  fs.writeFileSync(
    agentsPath,
    fs
      .readFileSync(agentsPath, 'utf8')
      .replace(
        '| `/cms` (`frontend/cms/`) — admin panel  | off | off       | on            |\n',
        ''
      )
  );
}

async function run() {
  const answer = await askChoice(
    'Keep which frontend entrypoint(s)? Type "both" to keep website+cms as-is, or "website" to drop the CMS ' +
      'and collapse frontend/ back to a single flat app: '
  );

  if (answer === 'both') {
    console.log('Keeping both entrypoints — no changes made.');
    return;
  }

  if (answer === 'website') {
    removeCms(ROOT);
    flattenWebsite(ROOT);
    console.log('CMS entrypoint removed. frontend/ collapsed back to a single flat app.');
    return;
  }

  console.log(
    'Only "both" or "website" are supported here. Dropping the public site to keep only the CMS isn\'t ' +
      "automated — do it manually (promote frontend/cms/ and its backend controller/template to the site's " +
      'primary entrypoint, then remove the website ones the same way this script removes the CMS).'
  );
}

if (require.main === module) {
  void run();
}

module.exports = { removeCms, flattenWebsite };
