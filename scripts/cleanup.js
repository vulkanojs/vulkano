'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.resolve(__dirname, '..');

const CLEANUP_TARGETS = [
  'app/controllers/api',
  'app/models/Example.js',
  'app/models/ExampleWithScaffold.js',
  'client/components/HelloWorld',
  'client/views/Demo',
  'app/views/demo'
];

function stripHelloWorldTemplate(source) {
  return source.replace('\n\n  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />\n', '\n');
}

function stripHelloWorldScript(source) {
  return source
    .replace("import HelloWorld from '@client/components/HelloWorld/HelloWorld.vue';\n\n", '')
    .replace('\n\n    HelloWorld\n\n  },', '\n\n  },');
}

function askConfirmation(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

async function run() {
  const confirmed = await askConfirmation(
    'This will delete the demo homepage, example controllers, and example models. Type "yes" to continue: '
  );

  if (!confirmed) {
    console.log('Cleanup cancelled.');
    return;
  }

  for (const target of CLEANUP_TARGETS) {
    const targetPath = path.join(ROOT, target);
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }

  const homeVuePath = path.join(ROOT, 'client/views/Home/Index.vue');
  const homeJsPath = path.join(ROOT, 'client/views/Home/Index.js');

  fs.writeFileSync(homeVuePath, stripHelloWorldTemplate(fs.readFileSync(homeVuePath, 'utf8')));
  fs.writeFileSync(homeJsPath, stripHelloWorldScript(fs.readFileSync(homeJsPath, 'utf8')));

  console.log('Cleanup complete. client/views/Home no longer references HelloWorld.');
}

if (require.main === module) {
  void run();
}

module.exports = { CLEANUP_TARGETS, stripHelloWorldTemplate, stripHelloWorldScript };
