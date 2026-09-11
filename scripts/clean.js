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

function mergeInto(from, to) {
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from)) {
    const fromPath = path.join(from, entry);
    const toPath = path.join(to, entry);

    if (fs.statSync(fromPath).isDirectory() && fs.existsSync(toPath)) {
      mergeInto(fromPath, toPath);
      fs.rmdirSync(fromPath);
    } else {
      fs.rmSync(toPath, { recursive: true, force: true });
      fs.renameSync(fromPath, toPath);
    }
  }
}

function flatten(root, name) {
  const from = path.join(root, 'frontend', name);
  const to = path.join(root, 'frontend');

  mergeInto(from, to);
  fs.rmdirSync(from);
}

function findMatchingBrace(source, openBraceIndex) {
  let depth = 1;
  let i = openBraceIndex + 1;

  while (depth > 0) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') depth--;
    i++;
  }

  return i - 1;
}

function splitTopLevelEntries(body) {
  const entries = [];
  let depth = 0;
  let current = '';

  for (const char of body) {
    if ('([{'.includes(char)) depth++;
    if (')]}'.includes(char)) depth--;

    if (char === ',' && depth === 0) {
      entries.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) entries.push(current);

  return entries;
}

// Removes a single `key: value` entry from an `<blockName>: { ... }` object
// literal, no matter how many sibling entries surround it — used instead of a
// literal whole-block string match so extra entries (e.g. a 3rd frontend
// entrypoint) don't cause a silent no-op.
function removeObjectEntry(source, blockName, keyToRemove) {
  const labelMatch = source.match(new RegExp(`${blockName}\\s*[:=]\\s*\\{`));

  if (!labelMatch) return source;

  const openBraceIndex = labelMatch.index + labelMatch[0].length - 1;
  const closeBraceIndex = findMatchingBrace(source, openBraceIndex);
  const body = source.slice(openBraceIndex + 1, closeBraceIndex);

  const entries = splitTopLevelEntries(body).filter((entry) => {
    const keyMatch = entry.match(/^\s*(['"]?)([\w@-]+)\1\s*:/);

    return !(keyMatch && keyMatch[2] === keyToRemove);
  });

  const trimmed = entries.map((entry) => entry.trim()).filter(Boolean);

  let newBody = '';

  if (trimmed.length) {
    const indentMatch = body.match(/\n(\s+)\S/);
    const indent = indentMatch ? indentMatch[1] : '  ';
    const closingIndentMatch = body.match(/\n(\s*)$/);
    const closingIndent = closingIndentMatch ? closingIndentMatch[1] : '';

    newBody = `\n${trimmed.map((entry) => indent + entry).join(',\n')}\n${closingIndent}`;
  }

  return source.slice(0, openBraceIndex + 1) + newBody + source.slice(closeBraceIndex);
}

function collapseViteConfig(root) {
  // Entries (and their derived @<dir> aliases) live in vite.entries.mjs, not
  // inline in vite.config.mjs — collapsing to 1 entrypoint only ever needs
  // that one file edited.
  let content = readFile(root, 'vite.entries.mjs');

  content = removeObjectEntry(content, 'entries', 'admin');
  content = content.replace("'frontend/website/app.js'", "'frontend/app.js'");

  writeFile(root, 'vite.entries.mjs', content);
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
      .replace(
        "  '/': 'HomeController.get',\n  '/admin': 'AdminController.get'",
        "  '/': 'HomeController.get'"
      )
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

function findWebsiteBase(root) {
  if (fs.existsSync(path.join(root, 'frontend/website/components/HelloWorld')))
    return 'frontend/website';
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
  const targets = [
    'app/controllers/api',
    'app/models/Example.js',
    'app/models/ExampleWithScaffold.js',
    'app/views/demo'
  ];

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
  let countAnswer = await ask(
    'How many frontend entrypoints do you want — "1" or "2"? (2 keeps both website+admin as shipped): '
  );

  while (countAnswer !== '1' && countAnswer !== '2' && countAnswer !== 'both') {
    countAnswer = await ask('Only "1" or "2" are supported here. Try again — "1" or "2"? ');
  }

  if (countAnswer === '2' || countAnswer === 'both') {
    console.log('Keeping both entrypoints — no changes made.');
  } else {
    keepWebsiteOnly(ROOT);
    console.log('Admin entrypoint removed. frontend/ collapsed back to a single flat app.');
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

module.exports = {
  keepWebsiteOnly,
  findWebsiteBase,
  cleanupDemo,
  stripHelloWorldTemplate,
  stripHelloWorldScript
};
