# `vulkano update` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `npx @vulkano/cli update` deja cualquier proyecto Vulkano existente con `AGENTS.md`, `references/`, skills, `.env.example`, `PROJECT.md` (solo si falta) y `@vulkano/core` al día con `master` del template, de forma determinista.

**Architecture:** `@vulkano/cli` 1.0.0 reescrito desde cero en `vulkanojs/vulkano-cli` (local `/Users/IvanMel/Sites/dailyscript/vulkano/cli`). Módulos puros pequeños en `src/lib/` (estado, clasificación, merge, migraciones, core, reporte), adaptadores inyectables (git, GitHub, npm, giget, prompts) y un orquestador `src/update/index.js` que recibe todo por `deps` para probarlo sin red. Después: skill delgada en `vulkano-skills` y ajustes de docs en el template.

**Tech Stack:** Node `>=24` (ESM), `giget` (única dependencia de runtime), `node:util` `parseArgs`, `node:readline/promises`, `git` CLI, Vitest, pnpm.

**Spec:** `.superpowers/specs/2026-10-13-vulkano-cli-update-design.md`

## Global Constraints

- Node `>=24`; ESM (`"type": "module"`). En esta máquina el `node` de Homebrew está roto (icu4c): antes de cada comando, `export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"`.
- Dependencias: runtime solo `giget`; dev solo `vitest`. Ambas con versión exacta (`pnpm add -E`).
- Fuente del template: `master` de `vulkanojs/vulkano`; escape `--ref <sha|rama>`.
- Nunca editar un `PROJECT.md` existente. Nunca tocar `.env`. Ninguna dependencia del proyecto salvo `@vulkano/core`.
- El CLI nunca hace `git commit`. Imprime `[chore] docs: sync with Vulkano template <sha corto>`.
- Estado en `.vulkano.json`: `{ "template": { "ref": "master", "sha": "<sha>" }, "skills": "<sha>", "syncedAt": "<ISO>" }`.
- Rama: `chore/vulkano-update-<sha corto>` (7 caracteres).
- Ruta de skills: `.claude/skills/vulkano-skills`.
- **Commits del plan:** cada paso "Commit" exige el sí explícito del usuario para ese commit (CLAUDE.md global). Formato `[tag] area: mensaje` (`added`, `updated`, `fixed`, `chore`, `removed`).
- Variables sin usar con prefijo `_` (`catch (_err)`).

## Review Focus

- `pnpm-workspace.yaml` con un segundo `'@vulkano/core': true` en otro mapa (p. ej. `onlyBuiltDependencies`): solo cambia la línea dentro de `catalog:` → test en Task 5.
- Correr sin TTY y sin `--yes` (CI, pipe): error claro antes de escribir nada, en vez de colgarse en un prompt → test en Task 12.
- `.vulkano.json` corrupto o editado a mano: error que nombra el archivo, no un `SyntaxError` suelto → test en Task 2.
- El sha base desapareció de `master` (force-push): se trata como primera sincronización con aviso → test en Task 12.
- `.gitmodules` con `url` antes de `path`, o con otra URL para la ruta de skills: se detecta igual y se pregunta antes de cambiarla → tests en Task 9.

---

### Task 1: Repo limpio, `package.json`, bin y parseo de argumentos

**Files:**

- Delete (en `cli/`): `app/`, `core/`, `libs/`, `models/`, `tasks/`, `bin/vulkano`, `yarn.lock`, `.eslintrc`, `.npmignore`
- Create: `cli/package.json` (reemplaza), `cli/bin/vulkano.js`, `cli/src/cli.js`, `cli/test/cli.test.js`, `cli/test/helpers.js`, `cli/.gitignore` (reemplaza)

**Interfaces:**

- Produces: `parseCli(argv: string[]) → { command: string|null, ref: string, yes: boolean, dryRun: boolean, help: boolean }`; `main(argv, { run, log }) → Promise<number>`; helpers de test `tempDir()`, `writeTree(root, files)`, `git(cwd, ...args)`, `commitAll(cwd, msg)`, `GIT_ENV`.

- [ ] **Step 1: Rama y limpieza**

```bash
cd /Users/IvanMel/Sites/dailyscript/vulkano/cli
git switch -c v1
git rm -r -q app core libs models tasks bin yarn.lock .eslintrc .npmignore
rm -rf node_modules
```

- [ ] **Step 2: `package.json` y `.gitignore`**

`package.json`:

```json
{
  "name": "@vulkano/cli",
  "version": "1.0.0",
  "description": "Vulkano CLI — keep Vulkano projects in sync with the template",
  "type": "module",
  "bin": { "vulkano": "./bin/vulkano.js" },
  "files": ["bin", "src"],
  "engines": { "node": ">=24" },
  "scripts": { "test": "vitest run" },
  "repository": { "type": "git", "url": "git+https://github.com/vulkanojs/vulkano-cli.git" },
  "homepage": "https://github.com/vulkanojs/vulkano-cli",
  "license": "MIT"
}
```

`.gitignore`:

```
node_modules/
.env
.DS_Store
```

Run: `pnpm add -E giget && pnpm add -D -E vitest`
Expected: `dependencies.giget` y `devDependencies.vitest` con versión exacta, `pnpm-lock.yaml` creado.

- [ ] **Step 3: Helpers de test**

`test/helpers.js`:

```js
import { mkdtemp, mkdir, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';

export const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com'
};

export function tempDir() {
  return mkdtemp(join(tmpdir(), 'vulkano-test-'));
}

// files: { 'path/file': 'content' | { link: 'target' } }
export async function writeTree(root, files) {
  for (const [path, value] of Object.entries(files)) {
    const abs = join(root, path);
    await mkdir(dirname(abs), { recursive: true });
    if (value && typeof value === 'object') await symlink(value.link, abs);
    else await writeFile(abs, value);
  }
  return root;
}

export function git(cwd, ...args) {
  return execFileSync(
    'git',
    ['-c', 'protocol.file.allow=always', '-c', 'init.defaultBranch=master', ...args],
    {
      cwd,
      env: GIT_ENV,
      encoding: 'utf8'
    }
  ).trim();
}

export function commitAll(cwd, message = 'commit') {
  git(cwd, 'add', '-A');
  git(cwd, 'commit', '-q', '-m', message);
  return git(cwd, 'rev-parse', 'HEAD');
}
```

- [ ] **Step 4: Test que falla**

`test/cli.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { parseCli, main } from '../src/cli.js';

describe('parseCli', () => {
  it('defaults ref to master', () => {
    expect(parseCli(['update'])).toEqual({
      command: 'update',
      ref: 'master',
      yes: false,
      dryRun: false,
      help: false
    });
  });

  it('reads flags', () => {
    expect(parseCli(['update', '--ref', 'abc', '--yes', '--dry-run'])).toMatchObject({
      ref: 'abc',
      yes: true,
      dryRun: true
    });
  });
});

describe('main', () => {
  it('runs update with the parsed options', async () => {
    const run = vi.fn(async () => 0);
    expect(await main(['update', '-y'], { run, log: () => {} })).toBe(0);
    expect(run).toHaveBeenCalledWith(expect.objectContaining({ command: 'update', yes: true }));
  });

  it('rejects an unknown command', async () => {
    const log = vi.fn();
    expect(await main(['nope'], { run: vi.fn(), log })).toBe(1);
    expect(log.mock.calls[0][0]).toMatch(/Unknown command: nope/);
  });

  it('rejects an unknown flag', async () => {
    expect(await main(['update', '--bogus'], { run: vi.fn(), log: () => {} })).toBe(1);
  });

  it('prints help', async () => {
    const log = vi.fn();
    expect(await main(['--help'], { run: vi.fn(), log })).toBe(0);
    expect(log.mock.calls[0][0]).toMatch(/vulkano update/);
  });

  it('prints the error and exits 1 when the command throws', async () => {
    const log = vi.fn();
    const run = async () => {
      throw new Error('boom');
    };
    expect(await main(['update'], { run, log })).toBe(1);
    expect(log).toHaveBeenCalledWith('Error: boom');
  });
});
```

- [ ] **Step 5: Correr y ver que falla**

Run: `pnpm test`
Expected: FAIL, `Cannot find module '../src/cli.js'`.

- [ ] **Step 6: Implementar**

`src/cli.js`:

```js
import { parseArgs } from 'node:util';

export const HELP = `Usage: vulkano update [--ref <sha|branch>] [--yes] [--dry-run]

  update     Sync AGENTS.md, references/, skills, .env.example and @vulkano/core
             with the Vulkano template (vulkanojs/vulkano, master by default).

  --ref      Template sha or branch to sync with (default: master)
  -y, --yes  Overwrite local edits without asking
  --dry-run  Show what would change, write nothing
  -h, --help Show this help`;

export function parseCli(argv) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      ref: { type: 'string' },
      yes: { type: 'boolean', short: 'y', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false }
    }
  });
  return {
    command: positionals[0] ?? null,
    ref: values.ref ?? 'master',
    yes: values.yes,
    dryRun: values['dry-run'],
    help: values.help
  };
}

async function defaultRun(options) {
  const { runUpdate } = await import('./update/index.js');
  return runUpdate(options);
}

export async function main(argv, { run = defaultRun, log = console.log } = {}) {
  let options;
  try {
    options = parseCli(argv);
  } catch (err) {
    log(err.message);
    log(HELP);
    return 1;
  }
  if (options.help || !options.command) {
    log(HELP);
    return options.help ? 0 : 1;
  }
  if (options.command !== 'update') {
    log(`Unknown command: ${options.command}`);
    log(HELP);
    return 1;
  }
  try {
    return await run(options);
  } catch (err) {
    log(`Error: ${err.message}`);
    return 1;
  }
}
```

`bin/vulkano.js`:

```js
#!/usr/bin/env node
import { main } from '../src/cli.js';

process.exitCode = await main(process.argv.slice(2));
```

Run: `chmod +x bin/vulkano.js`

- [ ] **Step 7: Correr y ver que pasa**

Run: `pnpm test`
Expected: PASS (7 tests).

- [ ] **Step 8: Commit (pedir sí al usuario)**

```bash
git add -A
git commit -m "[updated] cli: rewrite from scratch as 1.0 — package, bin, argument parsing"
```

---

### Task 2: Estado `.vulkano.json`

**Files:**

- Create: `cli/src/lib/state.js`, `cli/test/lib/state.test.js`

**Interfaces:**

- Produces: `STATE_FILE = '.vulkano.json'`; `readState(cwd) → Promise<{ template: { ref, sha }, skills, syncedAt } | null>`; `writeState(cwd, { ref, sha, skills, syncedAt }) → Promise<state>`.

- [ ] **Step 1: Test que falla**

`test/lib/state.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readState, writeState } from '../../src/lib/state.js';
import { tempDir, writeTree } from '../helpers.js';

const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

describe('state', () => {
  it('returns null when .vulkano.json is missing', async () => {
    expect(await readState(await tempDir())).toBeNull();
  });

  it('round-trips the state', async () => {
    const dir = await tempDir();
    await writeState(dir, {
      ref: 'master',
      sha: A,
      skills: B,
      syncedAt: '2026-10-13T00:00:00.000Z'
    });
    expect(await readState(dir)).toEqual({
      template: { ref: 'master', sha: A },
      skills: B,
      syncedAt: '2026-10-13T00:00:00.000Z'
    });
  });

  it('names the file when the JSON is invalid', async () => {
    const dir = await writeTree(await tempDir(), { '.vulkano.json': '{' });
    await expect(readState(dir)).rejects.toThrow(/\.vulkano\.json is not valid JSON/);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/state.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/state.js`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const STATE_FILE = '.vulkano.json';

export async function readState(cwd) {
  let text;
  try {
    text = await readFile(join(cwd, STATE_FILE), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(
      `${STATE_FILE} is not valid JSON (${err.message}); fix or delete it to run a first sync`
    );
  }
}

export async function writeState(cwd, { ref, sha, skills, syncedAt }) {
  const state = { template: { ref, sha }, skills, syncedAt };
  await writeFile(join(cwd, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
  return state;
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/state.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/state.js test/lib/state.test.js
git commit -m "[added] cli: .vulkano.json sync state"
```

---

### Task 3: Merge de `.env.example`

**Files:**

- Create: `cli/src/lib/env-example.js`, `cli/test/lib/env-example.test.js`

**Interfaces:**

- Produces: `envKeys(text) → Set<string>`; `mergeEnvExample(projectText: string|null, templateText: string) → { text: string, added: string[] }`.

Formato real del template: una clave por línea, comentario en la misma línea; las opcionales van comentadas (`# SITE_URL=...   # optional ...`). Una clave cuenta como presente si está activa o comentada.

- [ ] **Step 1: Test que falla**

`test/lib/env-example.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { envKeys, mergeEnvExample } from '../../src/lib/env-example.js';

const TEMPLATE = [
  'PORT=8000',
  'JWT_SECRET_KEY=change-me   # optional, for auth',
  '# SITE_URL=https://example.com   # optional, recommended once a domain is known',
  ''
].join('\n');

describe('envKeys', () => {
  it('reads active and commented keys', () => {
    expect([...envKeys(TEMPLATE)]).toEqual(['PORT', 'JWT_SECRET_KEY', 'SITE_URL']);
  });
});

describe('mergeEnvExample', () => {
  it('appends missing keys with their inline comment', () => {
    const { text, added } = mergeEnvExample('PORT=3000\n', TEMPLATE);
    expect(added).toEqual(['JWT_SECRET_KEY', 'SITE_URL']);
    expect(text).toBe(
      'PORT=3000\nJWT_SECRET_KEY=change-me   # optional, for auth\n# SITE_URL=https://example.com   # optional, recommended once a domain is known\n'
    );
  });

  it('keeps project values and treats a commented key as present', () => {
    const project = 'PORT=3000\n# JWT_SECRET_KEY=x\nSITE_URL=https://mine.com\n';
    expect(mergeEnvExample(project, TEMPLATE)).toEqual({ text: project, added: [] });
  });

  it('adds a newline before appending when the file lacks one', () => {
    expect(mergeEnvExample('PORT=3000', 'PORT=8000\nA=1\n').text).toBe('PORT=3000\nA=1\n');
  });

  it('copies the template when the project has no .env.example', () => {
    expect(mergeEnvExample(null, TEMPLATE)).toEqual({
      text: TEMPLATE,
      added: ['PORT', 'JWT_SECRET_KEY', 'SITE_URL']
    });
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/env-example.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/env-example.js`:

```js
const KEY_RE = /^#?\s*([A-Z][A-Z0-9_]*)=/;

export function envKeys(text) {
  const keys = new Set();
  for (const line of text.split('\n')) {
    const match = line.match(KEY_RE);
    if (match) keys.add(match[1]);
  }
  return keys;
}

export function mergeEnvExample(projectText, templateText) {
  if (projectText == null) return { text: templateText, added: [...envKeys(templateText)] };
  const present = envKeys(projectText);
  const lines = [];
  const added = [];
  for (const line of templateText.split('\n')) {
    const match = line.match(KEY_RE);
    if (!match || present.has(match[1])) continue;
    lines.push(line);
    added.push(match[1]);
    present.add(match[1]);
  }
  if (!lines.length) return { text: projectText, added };
  const base = projectText === '' || projectText.endsWith('\n') ? projectText : `${projectText}\n`;
  return { text: `${base}${lines.join('\n')}\n`, added };
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/env-example.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/env-example.js test/lib/env-example.test.js
git commit -m "[added] cli: merge missing .env.example keys from the template"
```

---

### Task 4: Migraciones del CHANGELOG del template

**Files:**

- Create: `cli/src/lib/migrations.js`, `cli/test/lib/migrations.test.js`

**Interfaces:**

- Produces: `parseChangelog(text) → { date, title, migration }[]`; `pendingMigrations(text, sinceDate: 'YYYY-MM-DD') → { date, title, migration }[]` (fecha `>= sinceDate`, sin "None"); `daysAgo(days, now: Date) → 'YYYY-MM-DD'`.

Formato real de `references/CHANGELOG.md`: `## YYYY-MM-DD — título`, luego `**Changed:**` y `**Migration:**` con viñetas; "sin migración" = una sola línea `- None.`. Se usa `>=` porque varias entradas comparten fecha y un commit puede ser del mismo día: es mejor listar de más que perder una.

- [ ] **Step 1: Test que falla**

`test/lib/migrations.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseChangelog, pendingMigrations, daysAgo } from '../../src/lib/migrations.js';

const CHANGELOG = `## 2026-10-13 — core 2.1.6

**Changed:**

- Core bump.

**Migration:**

- \`pnpm install\`.

## 2026-10-13 — docs only

**Changed:**

- Docs.

**Migration:**

- None.

## 2026-09-20 — old

**Migration:**

- Delete GIT.md.
`;

describe('parseChangelog', () => {
  it('splits entries and extracts the migration block', () => {
    const entries = parseChangelog(CHANGELOG);
    expect(entries.map((e) => e.title)).toEqual(['core 2.1.6', 'docs only', 'old']);
    expect(entries[0]).toMatchObject({ date: '2026-10-13', migration: '- `pnpm install`.' });
    expect(entries[1].migration).toBe('- None.');
  });
});

describe('pendingMigrations', () => {
  it('keeps entries on or after the date that need action', () => {
    expect(pendingMigrations(CHANGELOG, '2026-10-13').map((e) => e.title)).toEqual(['core 2.1.6']);
    expect(pendingMigrations(CHANGELOG, '2026-09-01').map((e) => e.title)).toEqual([
      'core 2.1.6',
      'old'
    ]);
  });

  it('returns nothing for an empty changelog', () => {
    expect(pendingMigrations('', '2026-01-01')).toEqual([]);
  });
});

describe('daysAgo', () => {
  it('returns an ISO date', () => {
    expect(daysAgo(90, new Date('2026-10-13T12:00:00Z'))).toBe('2026-07-15');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/migrations.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/migrations.js`:

```js
const ENTRY_RE = /^## (\d{4}-\d{2}-\d{2}) — (.+)$/;
const MIGRATION = '**Migration:**';
const NONE_RE = /^-\s*None\.?$/i;

function extractMigration(body) {
  const start = body.indexOf(MIGRATION);
  if (start === -1) return '';
  const rest = body.slice(start + MIGRATION.length);
  const end = rest.search(/^\*\*[^*]+:\*\*/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

export function parseChangelog(text) {
  const entries = [];
  let current = null;
  for (const line of text.split('\n')) {
    const match = line.match(ENTRY_RE);
    if (match) {
      current = { date: match[1], title: match[2].trim(), body: [] };
      entries.push(current);
    } else if (current) {
      current.body.push(line);
    }
  }
  return entries.map(({ date, title, body }) => ({
    date,
    title,
    migration: extractMigration(body.join('\n'))
  }));
}

export function pendingMigrations(text, sinceDate) {
  return parseChangelog(text).filter(
    (e) => e.date >= sinceDate && e.migration && !NONE_RE.test(e.migration)
  );
}

export function daysAgo(days, now = new Date()) {
  return new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/migrations.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/migrations.js test/lib/migrations.test.js
git commit -m "[added] cli: list template changelog migrations since a date"
```

---

### Task 5: Versión de `@vulkano/core`

**Files:**

- Create: `cli/src/lib/core.js`, `cli/test/lib/core.test.js`

**Interfaces:**

- Produces: `readCoreVersion(cwd) → Promise<{ where: 'catalog'|'package', version: string }>` (lanza `Not a Vulkano project: ...`); `setCoreVersion(cwd, where, version) → Promise<void>`; `cleanVersion(spec) → string`; `isNewer(from, to) → boolean`; `isMajorBump(from, to) → boolean`.

`pnpm-workspace.yaml` real tiene `'@vulkano/core': 2.1.6` dentro de `catalog:` y otra línea `'@vulkano/core': true` en un mapa posterior: solo se toca la que está dentro de `catalog:`.

- [ ] **Step 1: Test que falla**

`test/lib/core.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  readCoreVersion,
  setCoreVersion,
  isNewer,
  isMajorBump,
  cleanVersion
} from '../../src/lib/core.js';
import { tempDir, writeTree } from '../helpers.js';

const WORKSPACE = `minimumReleaseAgeExclude:
  - '@vulkano/core'

catalog:
  vite-plus: 0.3.3
  '@vulkano/core': 2.1.2
  sharp: ^0.35.4

onlyBuiltDependencies:
  '@vulkano/core': true
`;

const pkg = (spec) =>
  JSON.stringify({ name: 'app', dependencies: { '@vulkano/core': spec } }, null, 2);

describe('readCoreVersion', () => {
  it('reads the catalog entry', async () => {
    const dir = await writeTree(await tempDir(), {
      'package.json': pkg('catalog:'),
      'pnpm-workspace.yaml': WORKSPACE
    });
    expect(await readCoreVersion(dir)).toEqual({ where: 'catalog', version: '2.1.2' });
  });

  it('reads package.json when there is no catalog', async () => {
    const dir = await writeTree(await tempDir(), { 'package.json': pkg('^2.0.0') });
    expect(await readCoreVersion(dir)).toEqual({ where: 'package', version: '^2.0.0' });
  });

  it('rejects a project without @vulkano/core', async () => {
    const dir = await writeTree(await tempDir(), { 'package.json': '{"name":"x"}' });
    await expect(readCoreVersion(dir)).rejects.toThrow(/Not a Vulkano project/);
  });

  it('rejects a folder without package.json', async () => {
    await expect(readCoreVersion(await tempDir())).rejects.toThrow(
      /Not a Vulkano project: package\.json not found/
    );
  });
});

describe('setCoreVersion', () => {
  it('changes only the catalog line', async () => {
    const dir = await writeTree(await tempDir(), {
      'package.json': pkg('catalog:'),
      'pnpm-workspace.yaml': WORKSPACE
    });
    await setCoreVersion(dir, 'catalog', '2.1.6');
    expect(await readFile(join(dir, 'pnpm-workspace.yaml'), 'utf8')).toBe(
      WORKSPACE.replace("'@vulkano/core': 2.1.2", "'@vulkano/core': 2.1.6")
    );
  });

  it('pins package.json exactly', async () => {
    const dir = await writeTree(await tempDir(), { 'package.json': pkg('^2.0.0') });
    await setCoreVersion(dir, 'package', '2.1.6');
    expect(
      JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')).dependencies['@vulkano/core']
    ).toBe('2.1.6');
  });
});

describe('versions', () => {
  it('compares versions', () => {
    expect(cleanVersion('^2.1.1')).toBe('2.1.1');
    expect(isNewer('^2.1.1', '2.1.6')).toBe(true);
    expect(isNewer('2.1.6', '2.1.6')).toBe(false);
    expect(isNewer('2.10.0', '2.9.0')).toBe(false);
    expect(isMajorBump('2.1.6', '3.0.0')).toBe(true);
    expect(isMajorBump('2.1.1', '2.1.6')).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/core.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/core.js`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const NAME = '@vulkano/core';
const CATALOG_LINE_RE = /^(\s+)(['"]?)@vulkano\/core\2:(\s*)(['"]?)([^'"\s#]+)\4(.*)$/;

async function readPackage(cwd) {
  try {
    return JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error('Not a Vulkano project: package.json not found');
    throw err;
  }
}

function catalogLineIndex(lines) {
  const start = lines.findIndex((line) => /^catalog:\s*$/.test(line));
  if (start === -1) return -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '') continue;
    if (!/^\s/.test(lines[i])) return -1;
    if (CATALOG_LINE_RE.test(lines[i])) return i;
  }
  return -1;
}

export async function readCoreVersion(cwd) {
  const pkg = await readPackage(cwd);
  const spec = pkg.dependencies?.[NAME] ?? pkg.devDependencies?.[NAME];
  if (!spec) throw new Error(`Not a Vulkano project: ${NAME} missing from package.json`);
  if (!spec.startsWith('catalog:')) return { where: 'package', version: spec };
  const lines = (await readFile(join(cwd, 'pnpm-workspace.yaml'), 'utf8')).split('\n');
  const index = catalogLineIndex(lines);
  if (index === -1)
    throw new Error(`${NAME} uses catalog: but pnpm-workspace.yaml has no catalog entry for it`);
  return { where: 'catalog', version: lines[index].match(CATALOG_LINE_RE)[5] };
}

export async function setCoreVersion(cwd, where, version) {
  if (where === 'catalog') {
    const path = join(cwd, 'pnpm-workspace.yaml');
    const lines = (await readFile(path, 'utf8')).split('\n');
    const index = catalogLineIndex(lines);
    lines[index] = lines[index].replace(
      CATALOG_LINE_RE,
      (_m, indent, q, space, vq, _old, rest) =>
        `${indent}${q}${NAME}${q}:${space}${vq}${version}${vq}${rest}`
    );
    await writeFile(path, lines.join('\n'));
    return;
  }
  const path = join(cwd, 'package.json');
  const pkg = JSON.parse(await readFile(path, 'utf8'));
  const field = pkg.dependencies?.[NAME] ? 'dependencies' : 'devDependencies';
  pkg[field][NAME] = version;
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function cleanVersion(spec) {
  return spec.replace(/^[\^~=v]+/, '');
}

const parts = (spec) =>
  cleanVersion(spec)
    .split('.')
    .map((n) => Number.parseInt(n, 10) || 0);

export function isNewer(from, to) {
  const a = parts(from);
  const b = parts(to);
  for (let i = 0; i < 3; i += 1) {
    if ((b[i] ?? 0) !== (a[i] ?? 0)) return (b[i] ?? 0) > (a[i] ?? 0);
  }
  return false;
}

export function isMajorBump(from, to) {
  return parts(to)[0] > parts(from)[0];
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/core.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/core.js test/lib/core.test.js
git commit -m "[added] cli: read and pin @vulkano/core in catalog or package.json"
```

---

### Task 6: Clasificación de docs

**Files:**

- Create: `cli/src/lib/classify.js`, `cli/test/lib/classify.test.js`

**Interfaces:**

- Produces: `DOC_ROOTS = ['AGENTS.md', 'CLAUDE.md', 'references']`; `readEntry(path) → Promise<{ type: 'file', content: Buffer } | { type: 'link', target: string } | null>`; `sameEntry(a, b) → boolean`; `listDocs(root) → Promise<string[]>`; `kindOf({ project, base, target, firstSync }) → Kind`; `classifyDocs({ projectDir, baseDir: string|null, targetDir }) → Promise<{ path, kind }[]>`.
- `Kind` = `'same' | 'new' | 'overwrite' | 'edited' | 'delete' | 'delete-edited' | 'overwrite-first' | 'delete-first'`.

- [ ] **Step 1: Test que falla**

`test/lib/classify.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { kindOf, classifyDocs, listDocs } from '../../src/lib/classify.js';
import { tempDir, writeTree } from '../helpers.js';

const f = (s) => ({ type: 'file', content: Buffer.from(s) });

describe('kindOf', () => {
  it.each([
    [{ project: f('a'), base: f('a'), target: f('a') }, 'same'],
    [{ project: null, base: null, target: f('a') }, 'new'],
    [{ project: f('a'), base: f('a'), target: f('b') }, 'overwrite'],
    [{ project: f('mine'), base: f('a'), target: f('b') }, 'edited'],
    [{ project: f('a'), base: f('a'), target: null }, 'delete'],
    [{ project: f('mine'), base: f('a'), target: null }, 'delete-edited'],
    [{ project: f('mine'), base: null, target: f('b') }, 'edited']
  ])('%o → %s', (entries, kind) => {
    expect(kindOf({ ...entries, firstSync: false })).toBe(kind);
  });

  it('first sync overwrites or deletes without a base', () => {
    expect(kindOf({ project: f('x'), base: undefined, target: f('b'), firstSync: true })).toBe(
      'overwrite-first'
    );
    expect(kindOf({ project: f('x'), base: undefined, target: null, firstSync: true })).toBe(
      'delete-first'
    );
  });

  it('compares symlinks by target', () => {
    const link = { type: 'link', target: 'AGENTS.md' };
    expect(kindOf({ project: link, base: link, target: { ...link }, firstSync: false })).toBe(
      'same'
    );
    expect(kindOf({ project: f('real'), base: link, target: link, firstSync: false })).toBe(
      'edited'
    );
  });
});

describe('classifyDocs', () => {
  it('walks AGENTS.md, CLAUDE.md and references/, ignoring .DS_Store', async () => {
    const project = await writeTree(await tempDir(), {
      'AGENTS.md': 'v1',
      'references/AGENTS/GIT.md': 'old',
      'references/.DS_Store': 'x',
      'app/x.js': 'ignored'
    });
    const base = await writeTree(await tempDir(), {
      'AGENTS.md': 'v1',
      'references/AGENTS/GIT.md': 'old'
    });
    const target = await writeTree(await tempDir(), {
      'AGENTS.md': 'v2',
      'CLAUDE.md': { link: 'AGENTS.md' },
      'references/AGENTS/WORKFLOW.md': 'new'
    });
    expect(await listDocs(project)).toEqual(['AGENTS.md', 'references/AGENTS/GIT.md']);
    expect(await classifyDocs({ projectDir: project, baseDir: base, targetDir: target })).toEqual([
      { path: 'AGENTS.md', kind: 'overwrite' },
      { path: 'CLAUDE.md', kind: 'new' },
      { path: 'references/AGENTS/GIT.md', kind: 'delete' },
      { path: 'references/AGENTS/WORKFLOW.md', kind: 'new' }
    ]);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/classify.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/classify.js`:

```js
import { lstat, readFile, readlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const DOC_ROOTS = ['AGENTS.md', 'CLAUDE.md', 'references'];
const IGNORED = new Set(['.DS_Store']);

async function statOrNull(path) {
  try {
    return await lstat(path);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function readEntry(path) {
  const st = await statOrNull(path);
  if (!st) return null;
  if (st.isSymbolicLink()) return { type: 'link', target: await readlink(path) };
  if (st.isFile()) return { type: 'file', content: await readFile(path) };
  return null;
}

export function sameEntry(a, b) {
  if (!a || !b) return !a && !b;
  if (a.type !== b.type) return false;
  return a.type === 'link' ? a.target === b.target : a.content.equals(b.content);
}

export async function listDocs(root) {
  const out = [];
  async function walk(rel) {
    const st = await statOrNull(join(root, rel));
    if (!st) return;
    if (st.isDirectory()) {
      for (const name of await readdir(join(root, rel))) {
        if (!IGNORED.has(name)) await walk(join(rel, name));
      }
    } else {
      out.push(rel);
    }
  }
  for (const rootPath of DOC_ROOTS) await walk(rootPath);
  return out.sort();
}

export function kindOf({ project, base, target, firstSync }) {
  if (sameEntry(project, target)) return 'same';
  if (!project) return 'new';
  if (firstSync) return target ? 'overwrite-first' : 'delete-first';
  const edited = !sameEntry(project, base);
  if (!target) return edited ? 'delete-edited' : 'delete';
  return edited ? 'edited' : 'overwrite';
}

export async function classifyDocs({ projectDir, baseDir, targetDir }) {
  const paths = new Set([...(await listDocs(projectDir)), ...(await listDocs(targetDir))]);
  const items = [];
  for (const path of [...paths].sort()) {
    const project = await readEntry(join(projectDir, path));
    const target = await readEntry(join(targetDir, path));
    const base = baseDir ? await readEntry(join(baseDir, path)) : undefined;
    items.push({ path, kind: kindOf({ project, base, target, firstSync: !baseDir }) });
  }
  return items;
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/classify.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/classify.js test/lib/classify.test.js
git commit -m "[added] cli: classify template docs against base and target"
```

---

### Task 7: Aplicar docs

**Files:**

- Create: `cli/src/lib/apply-docs.js`, `cli/test/lib/apply-docs.test.js`

**Interfaces:**

- Consumes: `readEntry` (Task 6); items `{ path, kind }[]` de `classifyDocs`.
- Produces: `applyDocs({ projectDir, targetDir, items, prompt, yes, dryRun, diff }) → Promise<{ added: string[], changed: string[], removed: string[], kept: string[], ask: string[] }>`. `prompt` = `{ confirm(message) → Promise<boolean>, choose(message, choices: string[]) → Promise<string> }`; `diff(path) → Promise<void>`. Lanza `Aborted by user` si se rechaza la confirmación de primera sincronización.

- [ ] **Step 1: Test que falla**

`test/lib/apply-docs.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { readFile, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { applyDocs } from '../../src/lib/apply-docs.js';
import { tempDir, writeTree } from '../helpers.js';

async function dirs() {
  const project = await writeTree(await tempDir(), {
    'AGENTS.md': 'old',
    'references/OLD.md': 'old',
    'references/MINE.md': 'mine'
  });
  const target = await writeTree(await tempDir(), {
    'AGENTS.md': 'new',
    'CLAUDE.md': { link: 'AGENTS.md' },
    'references/NEW.md': 'n',
    'references/MINE.md': 'tpl'
  });
  return { project, target };
}

const ITEMS = [
  { path: 'AGENTS.md', kind: 'overwrite' },
  { path: 'CLAUDE.md', kind: 'new' },
  { path: 'references/MINE.md', kind: 'edited' },
  { path: 'references/NEW.md', kind: 'new' },
  { path: 'references/OLD.md', kind: 'delete' }
];

const read = (dir, p) => readFile(join(dir, p), 'utf8');

describe('applyDocs', () => {
  it('writes, removes and keeps an edited file when the user says keep', async () => {
    const { project, target } = await dirs();
    const prompt = { confirm: vi.fn(), choose: vi.fn(async () => 'keep') };
    const summary = await applyDocs({
      projectDir: project,
      targetDir: target,
      items: ITEMS,
      prompt,
      yes: false,
      dryRun: false,
      diff: vi.fn()
    });
    expect(summary).toEqual({
      added: ['CLAUDE.md', 'references/NEW.md'],
      changed: ['AGENTS.md'],
      removed: ['references/OLD.md'],
      kept: ['references/MINE.md'],
      ask: []
    });
    expect(await read(project, 'AGENTS.md')).toBe('new');
    expect(await readlink(join(project, 'CLAUDE.md'))).toBe('AGENTS.md');
    expect(await read(project, 'references/MINE.md')).toBe('mine');
    expect(existsSync(join(project, 'references/OLD.md'))).toBe(false);
  });

  it('shows the diff and asks again before overwriting', async () => {
    const { project, target } = await dirs();
    const answers = ['diff', 'overwrite'];
    const prompt = { confirm: vi.fn(), choose: vi.fn(async () => answers.shift()) };
    const diff = vi.fn(async () => {});
    await applyDocs({
      projectDir: project,
      targetDir: target,
      items: ITEMS,
      prompt,
      yes: false,
      dryRun: false,
      diff
    });
    expect(diff).toHaveBeenCalledWith('references/MINE.md');
    expect(await read(project, 'references/MINE.md')).toBe('tpl');
  });

  it('overwrites edited files without asking with --yes', async () => {
    const { project, target } = await dirs();
    const prompt = { confirm: vi.fn(), choose: vi.fn() };
    await applyDocs({
      projectDir: project,
      targetDir: target,
      items: ITEMS,
      prompt,
      yes: true,
      dryRun: false,
      diff: vi.fn()
    });
    expect(prompt.choose).not.toHaveBeenCalled();
    expect(await read(project, 'references/MINE.md')).toBe('tpl');
  });

  it('asks once on a first sync and aborts on no', async () => {
    const { project, target } = await dirs();
    const items = [
      { path: 'AGENTS.md', kind: 'overwrite-first' },
      { path: 'references/OLD.md', kind: 'delete-first' }
    ];
    const prompt = { confirm: vi.fn(async () => false), choose: vi.fn() };
    await expect(
      applyDocs({
        projectDir: project,
        targetDir: target,
        items,
        prompt,
        yes: false,
        dryRun: false,
        diff: vi.fn()
      })
    ).rejects.toThrow('Aborted by user');
    expect(prompt.confirm).toHaveBeenCalledTimes(1);
    expect(await read(project, 'AGENTS.md')).toBe('old');
  });

  it('writes nothing on a dry run and lists the files it would ask about', async () => {
    const { project, target } = await dirs();
    const prompt = { confirm: vi.fn(), choose: vi.fn() };
    const summary = await applyDocs({
      projectDir: project,
      targetDir: target,
      items: ITEMS,
      prompt,
      yes: false,
      dryRun: true,
      diff: vi.fn()
    });
    expect(summary.ask).toEqual(['references/MINE.md']);
    expect(summary.changed).toEqual(['AGENTS.md']);
    expect(await read(project, 'AGENTS.md')).toBe('old');
    expect(existsSync(join(project, 'references/NEW.md'))).toBe(false);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/apply-docs.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/apply-docs.js`:

```js
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readEntry } from './classify.js';

const WRITE = new Set(['new', 'overwrite', 'overwrite-first']);
const REMOVE = new Set(['delete', 'delete-first']);

async function copyEntry(from, to) {
  const entry = await readEntry(from);
  await mkdir(dirname(to), { recursive: true });
  await rm(to, { force: true });
  if (entry.type === 'link') await symlink(entry.target, to);
  else await writeFile(to, entry.content);
}

async function askEdited({ path, kind, prompt, diff }) {
  const verb = kind === 'edited' ? 'overwrite' : 'remove';
  for (;;) {
    const answer = await prompt.choose(`${path} has local edits. ${verb}?`, [verb, 'keep', 'diff']);
    if (answer !== 'diff') return answer === 'keep' ? 'keep' : verb;
    await diff(path);
  }
}

export async function applyDocs({ projectDir, targetDir, items, prompt, yes, dryRun, diff }) {
  const summary = { added: [], changed: [], removed: [], kept: [], ask: [] };
  const firstSync = items.filter((i) => i.kind === 'overwrite-first' || i.kind === 'delete-first');
  if (firstSync.length && !yes && !dryRun) {
    const list = firstSync
      .map((i) => `  ${i.kind === 'delete-first' ? 'remove' : 'overwrite'} ${i.path}`)
      .join('\n');
    const ok = await prompt.confirm(
      `First sync with the template — these files will be replaced or removed:\n${list}\nContinue?`
    );
    if (!ok) throw new Error('Aborted by user');
  }
  for (const { path, kind } of items) {
    if (kind === 'same') continue;
    let action;
    if (WRITE.has(kind)) action = 'overwrite';
    else if (REMOVE.has(kind)) action = 'remove';
    else if (dryRun) {
      summary.ask.push(path);
      continue;
    } else if (yes) action = kind === 'edited' ? 'overwrite' : 'remove';
    else action = await askEdited({ path, kind, prompt, diff });

    if (action === 'keep') summary.kept.push(path);
    if (action === 'overwrite') {
      (kind === 'new' ? summary.added : summary.changed).push(path);
      if (!dryRun) await copyEntry(join(targetDir, path), join(projectDir, path));
    }
    if (action === 'remove') {
      summary.removed.push(path);
      if (!dryRun) await rm(join(projectDir, path), { force: true });
    }
  }
  return summary;
}
```

Los tipos `edited` y `delete-edited` son los que llegan a la rama final (preguntar, `--yes` o dry run).

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/apply-docs.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/apply-docs.js test/lib/apply-docs.test.js
git commit -m "[added] cli: apply template docs, asking per locally edited file"
```

---

### Task 8: Adaptadores (git, GitHub, npm, prompts, giget)

**Files:**

- Create: `cli/src/lib/git.js`, `cli/src/lib/github.js`, `cli/src/lib/npm.js`, `cli/src/lib/prompt.js`, `cli/src/lib/template.js`
- Test: `cli/test/lib/git.test.js`, `cli/test/lib/github.test.js`, `cli/test/lib/npm.test.js`, `cli/test/lib/prompt.test.js`

**Interfaces:**

- Produces:
  - `createGit(cwd, { extraArgs?: string[] }) → { run(args: string[]) → Promise<string>, isRepo() → Promise<boolean>, isClean() → Promise<boolean>, switchNew(branch) → Promise<void> }`
  - `createGithub({ fetch?, token?, repo? }) → { resolveSha(ref), commitDate(sha) → 'YYYY-MM-DD'|null, isInHistory(baseSha, targetSha) → boolean, submoduleSha(ref, path) → { sha, url } }`
  - `createNpm({ fetch? }) → { latest(name) → Promise<string> }`
  - `createPrompt({ input?, output? }) → { confirm(message) → Promise<boolean>, choose(message, choices) → Promise<string> }`
  - `fetchTemplate(repo: 'owner/name', sha, dir) → Promise<dir>` (giget; sin test unitario, se cubre en la prueba manual de Task 13)

- [ ] **Step 1: Tests que fallan**

`test/lib/git.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createGit } from '../../src/lib/git.js';
import { tempDir, git, commitAll } from '../helpers.js';

describe('createGit', () => {
  it('detects a repo, a clean tree and creates a branch', async () => {
    const dir = await tempDir();
    expect(await createGit(dir).isRepo()).toBe(false);
    git(dir, 'init', '-q');
    await writeFile(join(dir, 'a.txt'), 'a');
    commitAll(dir);
    const g = createGit(dir);
    expect(await g.isRepo()).toBe(true);
    expect(await g.isClean()).toBe(true);
    await writeFile(join(dir, 'b.txt'), 'b');
    expect(await g.isClean()).toBe(false);
    await g.switchNew('chore/x');
    expect(git(dir, 'branch', '--show-current')).toBe('chore/x');
  });
});
```

`test/lib/github.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { createGithub } from '../../src/lib/github.js';

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body });

describe('createGithub', () => {
  it('resolves a ref and sends the token', async () => {
    const fetch = vi.fn(async () => reply(200, { sha: 'abc' }));
    const gh = createGithub({ fetch, token: 'T' });
    expect(await gh.resolveSha('master')).toBe('abc');
    expect(fetch.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/vulkanojs/vulkano/commits/master'
    );
    expect(fetch.mock.calls[0][1].headers.authorization).toBe('Bearer T');
  });

  it('explains the rate limit', async () => {
    const gh = createGithub({ fetch: async () => reply(403, {}), token: undefined });
    await expect(gh.resolveSha('master')).rejects.toThrow(/rate limit.*GITHUB_TOKEN/);
  });

  it('reads the submodule sha and url', async () => {
    const gh = createGithub({
      fetch: async () =>
        reply(200, {
          type: 'submodule',
          sha: 's1',
          submodule_git_url: 'https://github.com/vulkanojs/vulkano-skills.git'
        }),
      token: undefined
    });
    expect(await gh.submoduleSha('abc', '.claude/skills/vulkano-skills')).toEqual({
      sha: 's1',
      url: 'https://github.com/vulkanojs/vulkano-skills.git'
    });
  });

  it('rejects a path that is not a submodule', async () => {
    const gh = createGithub({ fetch: async () => reply(200, { type: 'dir' }), token: undefined });
    await expect(gh.submoduleSha('abc', 'x')).rejects.toThrow(/not a submodule/);
  });

  it('checks history with compare', async () => {
    const status = (s) =>
      createGithub({ fetch: async () => reply(200, { status: s }), token: undefined });
    expect(await status('ahead').isInHistory('a', 'b')).toBe(true);
    expect(await status('identical').isInHistory('a', 'b')).toBe(true);
    expect(await status('diverged').isInHistory('a', 'b')).toBe(false);
    expect(
      await createGithub({ fetch: async () => reply(404, {}), token: undefined }).isInHistory(
        'a',
        'b'
      )
    ).toBe(false);
  });

  it('reads the commit date', async () => {
    const gh = createGithub({
      fetch: async () => reply(200, { commit: { committer: { date: '2026-10-05T10:00:00Z' } } }),
      token: undefined
    });
    expect(await gh.commitDate('abc')).toBe('2026-10-05');
  });
});
```

`test/lib/npm.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { createNpm } from '../../src/lib/npm.js';

describe('createNpm', () => {
  it('reads the latest dist-tag', async () => {
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ 'dist-tags': { latest: '2.1.6' } })
    }));
    expect(await createNpm({ fetch }).latest('@vulkano/core')).toBe('2.1.6');
    expect(fetch.mock.calls[0][0]).toBe('https://registry.npmjs.org/@vulkano%2Fcore');
  });

  it('fails clearly when the registry fails', async () => {
    const npm = createNpm({ fetch: async () => ({ ok: false, status: 503 }) });
    await expect(npm.latest('@vulkano/core')).rejects.toThrow(/npm registry.*503/);
  });
});
```

`test/lib/prompt.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { createPrompt } from '../../src/lib/prompt.js';

function streams() {
  return { input: new PassThrough(), output: new PassThrough() };
}

describe('createPrompt', () => {
  it('choose accepts the first letter', async () => {
    const { input, output } = streams();
    const answer = createPrompt({ input, output }).choose('AGENTS.md?', [
      'overwrite',
      'keep',
      'diff'
    ]);
    input.write('k\n');
    expect(await answer).toBe('keep');
  });

  it('confirm defaults to no and accepts sí', async () => {
    const a = streams();
    const no = createPrompt(a).confirm('Continue?');
    a.input.write('\n');
    expect(await no).toBe(false);
    const b = streams();
    const yes = createPrompt(b).confirm('Continue?');
    b.input.write('sí\n');
    expect(await yes).toBe(true);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm test test/lib/git.test.js test/lib/github.test.js test/lib/npm.test.js test/lib/prompt.test.js`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar**

`src/lib/git.js`:

```js
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export function createGit(cwd, { extraArgs = [] } = {}) {
  async function run(args) {
    const { stdout } = await exec('git', [...extraArgs, ...args], {
      cwd,
      maxBuffer: 64 * 1024 * 1024
    });
    return stdout.trim();
  }
  return {
    run,
    async isRepo() {
      try {
        return (await run(['rev-parse', '--is-inside-work-tree'])) === 'true';
      } catch (_err) {
        return false;
      }
    },
    async isClean() {
      return (await run(['status', '--porcelain'])) === '';
    },
    async switchNew(branch) {
      await run(['switch', '-c', branch]);
    }
  };
}
```

`src/lib/github.js`:

```js
const API = 'https://api.github.com';

export function createGithub({
  fetch = globalThis.fetch,
  token = process.env.GITHUB_TOKEN,
  repo = 'vulkanojs/vulkano'
} = {}) {
  async function get(path) {
    const res = await fetch(`${API}${path}`, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'vulkano-cli',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    });
    if (res.status === 403 || res.status === 429) {
      throw new Error(`GitHub API rate limit reached (${res.status}). Set GITHUB_TOKEN and retry.`);
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API ${path} failed with ${res.status}`);
    return res.json();
  }

  return {
    async resolveSha(ref) {
      const commit = await get(`/repos/${repo}/commits/${encodeURIComponent(ref)}`);
      if (!commit) throw new Error(`Ref not found in ${repo}: ${ref}`);
      return commit.sha;
    },
    async commitDate(sha) {
      const commit = await get(`/repos/${repo}/commits/${sha}`);
      return commit ? commit.commit.committer.date.slice(0, 10) : null;
    },
    async isInHistory(baseSha, targetSha) {
      const cmp = await get(`/repos/${repo}/compare/${baseSha}...${targetSha}`);
      return Boolean(cmp) && (cmp.status === 'ahead' || cmp.status === 'identical');
    },
    async submoduleSha(ref, path) {
      const entry = await get(`/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`);
      if (!entry || entry.type !== 'submodule')
        throw new Error(`${path} is not a submodule in ${repo}@${ref}`);
      return { sha: entry.sha, url: entry.submodule_git_url };
    }
  };
}
```

`src/lib/npm.js`:

```js
export function createNpm({ fetch = globalThis.fetch } = {}) {
  return {
    async latest(name) {
      const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}`, {
        headers: { accept: 'application/vnd.npm.install-v1+json' }
      });
      if (!res.ok) throw new Error(`npm registry request for ${name} failed with ${res.status}`);
      return (await res.json())['dist-tags'].latest;
    }
  };
}
```

`src/lib/prompt.js`:

```js
import { createInterface } from 'node:readline/promises';

const YES = new Set(['y', 'yes', 's', 'si', 'sí']);

export function createPrompt({ input = process.stdin, output = process.stdout } = {}) {
  async function ask(question) {
    const rl = createInterface({ input, output });
    try {
      return (await rl.question(question)).trim().toLowerCase();
    } finally {
      rl.close();
    }
  }
  return {
    async confirm(message) {
      return YES.has(await ask(`${message} [y/N] `));
    },
    async choose(message, choices) {
      for (;;) {
        const answer = await ask(`${message} [${choices.join('/')}] `);
        const hit = choices.find((c) => c === answer || c[0] === answer);
        if (hit) return hit;
      }
    }
  };
}
```

`src/lib/template.js`:

```js
import { downloadTemplate } from 'giget';

export async function fetchTemplate(repo, sha, dir) {
  await downloadTemplate(`gh:${repo}#${sha}`, { dir, force: true, auth: process.env.GITHUB_TOKEN });
  return dir;
}
```

- [ ] **Step 4: Correr y ver que pasan**

Run: `pnpm test`
Expected: PASS (todos los tests hasta aquí).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib test/lib
git commit -m "[added] cli: git, GitHub, npm, prompt and giget adapters"
```

---

### Task 9: Skills como submódulo

**Files:**

- Create: `cli/src/lib/skills.js`, `cli/test/lib/skills.test.js`

**Interfaces:**

- Consumes: `createGit` (Task 8), `prompt` (Task 8).
- Produces: `SKILLS_PATH = '.claude/skills/vulkano-skills'`; `parseGitmodules(text) → Record<path, url>`; `repoFromUrl(url) → 'owner/name' | url`; `detectSkills(projectDir) → Promise<{ state: 'submodule'|'copied'|'missing', url? }>`; `syncSkills({ projectDir, git, target: { sha, url }, prompt, yes, dryRun, downloadSkills: (sha) → Promise<dir>, diffDirs: (a, b) → Promise<void> }) → Promise<{ state, from: string|null, to: string, action: 'checkout'|'add'|'replace' }>`.

- [ ] **Step 1: Test que falla**

`test/lib/skills.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  parseGitmodules,
  repoFromUrl,
  detectSkills,
  syncSkills,
  SKILLS_PATH
} from '../../src/lib/skills.js';
import { createGit } from '../../src/lib/git.js';
import { tempDir, writeTree, git, commitAll } from '../helpers.js';

async function skillsRepo() {
  const dir = await writeTree(await tempDir(), { 'vulkano-x/SKILL.md': 's1\n' });
  git(dir, 'init', '-q');
  const s1 = commitAll(dir);
  await writeFile(join(dir, 'vulkano-x/SKILL.md'), 's2\n');
  const s2 = commitAll(dir);
  return { url: dir, s1, s2 };
}

async function project(files = {}) {
  const dir = await writeTree(await tempDir(), { 'package.json': '{}', ...files });
  git(dir, 'init', '-q');
  commitAll(dir);
  return dir;
}

const gitFor = (dir) => createGit(dir, { extraArgs: ['-c', 'protocol.file.allow=always'] });
const gitlink = (dir) => git(dir, 'ls-files', '-s', SKILLS_PATH).split(/\s+/)[1];
const yesPrompt = { confirm: vi.fn(async () => true), choose: vi.fn() };

describe('parseGitmodules', () => {
  it('reads path and url in any order', () => {
    const text = `[submodule "a"]\n\turl = https://x/a.git\n\tpath = ${SKILLS_PATH}\n[submodule "b"]\n\tpath = b\n\turl = https://x/b.git\n`;
    expect(parseGitmodules(text)).toEqual({
      [SKILLS_PATH]: 'https://x/a.git',
      b: 'https://x/b.git'
    });
  });
});

describe('repoFromUrl', () => {
  it('extracts owner/name from GitHub urls', () => {
    expect(repoFromUrl('https://github.com/vulkanojs/vulkano-skills.git')).toBe(
      'vulkanojs/vulkano-skills'
    );
    expect(repoFromUrl('git@github.com:vulkanojs/vulkano-skills.git')).toBe(
      'vulkanojs/vulkano-skills'
    );
    expect(repoFromUrl('/tmp/local')).toBe('/tmp/local');
  });
});

describe('syncSkills', () => {
  it('adds the submodule when skills are missing', async () => {
    const skills = await skillsRepo();
    const dir = await project();
    expect((await detectSkills(dir)).state).toBe('missing');
    const result = await syncSkills({
      projectDir: dir,
      git: gitFor(dir),
      target: { sha: skills.s1, url: skills.url },
      prompt: yesPrompt,
      yes: false,
      dryRun: false,
      downloadSkills: vi.fn(),
      diffDirs: vi.fn()
    });
    expect(result).toEqual({ state: 'missing', from: null, to: skills.s1, action: 'add' });
    expect(gitlink(dir)).toBe(skills.s1);
  });

  it('moves an existing submodule to the target sha', async () => {
    const skills = await skillsRepo();
    const dir = await project();
    git(dir, 'submodule', 'add', '-q', skills.url, SKILLS_PATH);
    git(dir, '-C', SKILLS_PATH, 'checkout', '-q', skills.s1);
    commitAll(dir);
    expect((await detectSkills(dir)).state).toBe('submodule');
    const result = await syncSkills({
      projectDir: dir,
      git: gitFor(dir),
      target: { sha: skills.s2, url: skills.url },
      prompt: yesPrompt,
      yes: false,
      dryRun: false,
      downloadSkills: vi.fn(),
      diffDirs: vi.fn()
    });
    expect(result).toMatchObject({
      state: 'submodule',
      from: skills.s1,
      to: skills.s2,
      action: 'checkout'
    });
    expect(gitlink(dir)).toBe(skills.s2);
  });

  it('replaces a copied folder after showing the diff', async () => {
    const skills = await skillsRepo();
    const dir = await project({ [`${SKILLS_PATH}/vulkano-x/SKILL.md`]: 'copied\n' });
    expect((await detectSkills(dir)).state).toBe('copied');
    const downloadSkills = vi.fn(async () => '/tmp/fake');
    const diffDirs = vi.fn(async () => {});
    const result = await syncSkills({
      projectDir: dir,
      git: gitFor(dir),
      target: { sha: skills.s2, url: skills.url },
      prompt: yesPrompt,
      yes: false,
      dryRun: false,
      downloadSkills,
      diffDirs
    });
    expect(diffDirs).toHaveBeenCalledWith(join(dir, SKILLS_PATH), '/tmp/fake');
    expect(result.action).toBe('replace');
    expect(gitlink(dir)).toBe(skills.s2);
  });

  it('asks before changing another submodule url and aborts on no', async () => {
    const skills = await skillsRepo();
    const dir = await project();
    git(dir, 'submodule', 'add', '-q', skills.url, SKILLS_PATH);
    commitAll(dir);
    const prompt = { confirm: vi.fn(async () => false), choose: vi.fn() };
    await expect(
      syncSkills({
        projectDir: dir,
        git: gitFor(dir),
        target: { sha: skills.s2, url: 'https://github.com/other/skills.git' },
        prompt,
        yes: false,
        dryRun: false,
        downloadSkills: vi.fn(),
        diffDirs: vi.fn()
      })
    ).rejects.toThrow(/Aborted/);
  });

  it('only reports on a dry run', async () => {
    const skills = await skillsRepo();
    const dir = await project();
    const result = await syncSkills({
      projectDir: dir,
      git: gitFor(dir),
      target: { sha: skills.s1, url: skills.url },
      prompt: yesPrompt,
      yes: false,
      dryRun: true,
      downloadSkills: vi.fn(),
      diffDirs: vi.fn()
    });
    expect(result.action).toBe('add');
    expect(git(dir, 'status', '--porcelain')).toBe('');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/skills.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/skills.js`:

```js
import { lstat, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

export const SKILLS_PATH = '.claude/skills/vulkano-skills';

export function parseGitmodules(text) {
  const out = {};
  let section = null;
  const flush = () => {
    if (section?.path && section.url) out[section.path] = section.url;
  };
  for (const line of text.split('\n')) {
    if (/^\s*\[submodule/.test(line)) {
      flush();
      section = {};
      continue;
    }
    const match = line.match(/^\s*(path|url)\s*=\s*(.+?)\s*$/);
    if (match && section) section[match[1]] = match[2];
  }
  flush();
  return out;
}

export function repoFromUrl(url) {
  const match = url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?\/?$/);
  return match ? match[1] : url;
}

const normalize = (url) => repoFromUrl(url).toLowerCase();

export async function detectSkills(projectDir) {
  const gitmodules = await readFile(join(projectDir, '.gitmodules'), 'utf8').catch(() => '');
  const url = parseGitmodules(gitmodules)[SKILLS_PATH];
  if (url) return { state: 'submodule', url };
  const st = await lstat(join(projectDir, SKILLS_PATH)).catch(() => null);
  return { state: st?.isDirectory() ? 'copied' : 'missing' };
}

export async function syncSkills({
  projectDir,
  git,
  target,
  prompt,
  yes,
  dryRun,
  downloadSkills,
  diffDirs
}) {
  const current = await detectSkills(projectDir);
  const action = { submodule: 'checkout', copied: 'replace', missing: 'add' }[current.state];
  let from = null;
  if (current.state === 'submodule') {
    const line = await git.run(['ls-tree', 'HEAD', SKILLS_PATH]);
    from = line.split(/\s+/)[2] ?? null;
  }
  const result = { state: current.state, from, to: target.sha, action };
  if (dryRun) return result;

  if (current.state === 'submodule' && normalize(current.url) !== normalize(target.url)) {
    const ok =
      yes ||
      (await prompt.confirm(
        `${SKILLS_PATH} points to ${current.url}. Switch it to ${target.url}?`
      ));
    if (!ok) throw new Error('Aborted: skills submodule URL left unchanged');
    await git.run(['submodule', 'set-url', SKILLS_PATH, target.url]);
  }

  if (current.state === 'copied') {
    await diffDirs(join(projectDir, SKILLS_PATH), await downloadSkills(target.sha));
    const ok =
      yes ||
      (await prompt.confirm(
        `Replace the copied ${SKILLS_PATH} folder with the vulkano-skills submodule?`
      ));
    if (!ok) throw new Error('Aborted: copied skills folder kept');
    await git.run(['rm', '-r', '-q', '--cached', '--ignore-unmatch', SKILLS_PATH]);
    await rm(join(projectDir, SKILLS_PATH), { recursive: true, force: true });
  }

  if (current.state === 'submodule') await git.run(['submodule', 'update', '--init', SKILLS_PATH]);
  else await git.run(['submodule', 'add', '--force', target.url, SKILLS_PATH]);
  await git.run(['-C', SKILLS_PATH, 'fetch', '--quiet', 'origin']);
  await git.run(['-C', SKILLS_PATH, 'checkout', '--quiet', target.sha]);
  await git.run(['add', SKILLS_PATH]);
  return result;
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/skills.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/skills.js test/lib/skills.test.js
git commit -m "[added] cli: pin vulkano-skills submodule, convert copied or missing skills"
```

---

### Task 10: Pasos de proyecto (`PROJECT.md`, `.env.example`, core)

**Files:**

- Create: `cli/src/update/steps.js`, `cli/test/update/steps.test.js`

**Interfaces:**

- Consumes: `mergeEnvExample` (Task 3); `readCoreVersion`, `setCoreVersion`, `isNewer`, `isMajorBump`, `cleanVersion` (Task 5).
- Produces:
  - `ensureProjectMd({ projectDir, targetDir, dryRun }) → Promise<boolean>` (true si lo crea o lo crearía)
  - `syncEnvExample({ projectDir, targetDir, dryRun }) → Promise<string[]>` (claves añadidas)
  - `updateCore({ cwd, latest, prompt, dryRun, isInteractive, install, log }) → Promise<null | { from, to, where, skipped?: true, failed?: string }>`

- [ ] **Step 1: Test que falla**

`test/update/steps.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureProjectMd, syncEnvExample, updateCore } from '../../src/update/steps.js';
import { tempDir, writeTree } from '../helpers.js';

const pkg = (v) => JSON.stringify({ name: 'app', dependencies: { '@vulkano/core': v } }, null, 2);

describe('ensureProjectMd', () => {
  it('creates PROJECT.md only when missing', async () => {
    const target = await writeTree(await tempDir(), { 'PROJECT.md': '# template\n' });
    const empty = await tempDir();
    expect(await ensureProjectMd({ projectDir: empty, targetDir: target, dryRun: false })).toBe(
      true
    );
    expect(await readFile(join(empty, 'PROJECT.md'), 'utf8')).toBe('# template\n');
    const mine = await writeTree(await tempDir(), { 'PROJECT.md': '# mine\n' });
    expect(await ensureProjectMd({ projectDir: mine, targetDir: target, dryRun: false })).toBe(
      false
    );
    expect(await readFile(join(mine, 'PROJECT.md'), 'utf8')).toBe('# mine\n');
  });

  it('does not write on a dry run', async () => {
    const target = await writeTree(await tempDir(), { 'PROJECT.md': '# template\n' });
    const empty = await tempDir();
    expect(await ensureProjectMd({ projectDir: empty, targetDir: target, dryRun: true })).toBe(
      true
    );
    expect(existsSync(join(empty, 'PROJECT.md'))).toBe(false);
  });
});

describe('syncEnvExample', () => {
  it('adds missing keys and never creates .env', async () => {
    const target = await writeTree(await tempDir(), { '.env.example': 'PORT=8000\nA=1\n' });
    const project = await writeTree(await tempDir(), { '.env.example': 'PORT=3000\n' });
    expect(await syncEnvExample({ projectDir: project, targetDir: target, dryRun: false })).toEqual(
      ['A']
    );
    expect(await readFile(join(project, '.env.example'), 'utf8')).toBe('PORT=3000\nA=1\n');
    expect(existsSync(join(project, '.env'))).toBe(false);
  });
});

describe('updateCore', () => {
  const base = {
    prompt: { confirm: vi.fn(async () => true) },
    dryRun: false,
    isInteractive: true,
    log: () => {}
  };

  it('returns null when already on latest', async () => {
    const cwd = await writeTree(await tempDir(), { 'package.json': pkg('2.1.6') });
    expect(await updateCore({ ...base, cwd, latest: '2.1.6', install: vi.fn() })).toBeNull();
  });

  it('pins the new version and installs', async () => {
    const cwd = await writeTree(await tempDir(), { 'package.json': pkg('^2.1.2') });
    const install = vi.fn(async () => {});
    expect(await updateCore({ ...base, cwd, latest: '2.1.6', install })).toEqual({
      from: '2.1.2',
      to: '2.1.6',
      where: 'package'
    });
    expect(install).toHaveBeenCalledWith(cwd);
    expect(
      JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')).dependencies['@vulkano/core']
    ).toBe('2.1.6');
  });

  it('restores dependency files when install fails', async () => {
    const cwd = await writeTree(await tempDir(), {
      'package.json': pkg('2.1.2'),
      'pnpm-lock.yaml': 'lock-v1\n'
    });
    const install = vi.fn(async () => {
      throw new Error('ERR_PNPM');
    });
    const result = await updateCore({ ...base, cwd, latest: '2.1.6', install });
    expect(result).toMatchObject({ from: '2.1.2', to: '2.1.6', failed: 'ERR_PNPM' });
    expect(await readFile(join(cwd, 'package.json'), 'utf8')).toBe(pkg('2.1.2'));
    expect(await readFile(join(cwd, 'pnpm-lock.yaml'), 'utf8')).toBe('lock-v1\n');
  });

  it('asks before a major bump and skips it without a terminal', async () => {
    const cwd = await writeTree(await tempDir(), { 'package.json': pkg('2.1.6') });
    const install = vi.fn();
    const confirm = vi.fn(async () => false);
    expect(
      await updateCore({ ...base, cwd, latest: '3.0.0', install, prompt: { confirm } })
    ).toMatchObject({ skipped: true });
    expect(confirm).toHaveBeenCalled();
    expect(
      await updateCore({ ...base, cwd, latest: '3.0.0', install, isInteractive: false })
    ).toMatchObject({ skipped: true });
    expect(install).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/update/steps.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/update/steps.js`:

```js
import { copyFile, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mergeEnvExample } from '../lib/env-example.js';
import {
  readCoreVersion,
  setCoreVersion,
  isNewer,
  isMajorBump,
  cleanVersion
} from '../lib/core.js';

const DEP_FILES = ['package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml'];
export const CORE_CHANGELOG_URL = 'https://github.com/vulkanojs/vulkano-core/releases';

export async function ensureProjectMd({ projectDir, targetDir, dryRun }) {
  if (existsSync(join(projectDir, 'PROJECT.md'))) return false;
  if (!dryRun) await copyFile(join(targetDir, 'PROJECT.md'), join(projectDir, 'PROJECT.md'));
  return true;
}

export async function syncEnvExample({ projectDir, targetDir, dryRun }) {
  const template = await readFile(join(targetDir, '.env.example'), 'utf8').catch(() => null);
  if (template == null) return [];
  const current = await readFile(join(projectDir, '.env.example'), 'utf8').catch(() => null);
  const { text, added } = mergeEnvExample(current, template);
  if (added.length && !dryRun) await writeFile(join(projectDir, '.env.example'), text);
  return added;
}

async function snapshot(cwd) {
  const files = {};
  for (const name of DEP_FILES) files[name] = await readFile(join(cwd, name)).catch(() => null);
  return files;
}

async function restore(cwd, files) {
  for (const [name, content] of Object.entries(files)) {
    if (content == null) await rm(join(cwd, name), { force: true });
    else await writeFile(join(cwd, name), content);
  }
}

export async function updateCore({ cwd, latest, prompt, dryRun, isInteractive, install, log }) {
  const { where, version } = await readCoreVersion(cwd);
  if (!isNewer(version, latest)) return null;
  const change = { from: cleanVersion(version), to: latest, where };
  if (dryRun) return change;
  log(`@vulkano/core ${change.from} → ${latest}. Changelog: ${CORE_CHANGELOG_URL}`);
  if (isMajorBump(version, latest)) {
    const ok =
      isInteractive &&
      (await prompt.confirm(
        `Major update of @vulkano/core (${change.from} → ${latest}). Install it?`
      ));
    if (!ok) return { ...change, skipped: true };
  }
  const files = await snapshot(cwd);
  try {
    await setCoreVersion(cwd, where, latest);
    await install(cwd);
    return change;
  } catch (err) {
    await restore(cwd, files);
    log(`pnpm install failed, dependency files restored: ${err.message}`);
    return { ...change, failed: err.message };
  }
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/update/steps.test.js`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/update/steps.js test/update/steps.test.js
git commit -m "[added] cli: PROJECT.md skeleton, .env.example keys and @vulkano/core bump steps"
```

---

### Task 11: Entrada de CHANGELOG y reporte

**Files:**

- Create: `cli/src/lib/report.js`, `cli/test/lib/report.test.js`

**Interfaces:**

- Produces:
  - `renderSyncEntry({ date, targetSha, baseSha, docs, skills, projectMdCreated, envAdded, core }) → string`
  - `appendProjectChangelog(projectDir, entry) → Promise<void>` (inserta antes del primer `## `; crea `# Changelog` si falta)
  - `formatReport(result) → string`. `result` = `{ ref, targetSha, baseSha, branch, dryRun, docs, skills, projectMdCreated, envAdded, migrations, firstSync, core }`.

- [ ] **Step 1: Test que falla**

`test/lib/report.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderSyncEntry, appendProjectChangelog, formatReport } from '../../src/lib/report.js';
import { tempDir, writeTree } from '../helpers.js';

const RESULT = {
  ref: 'master',
  targetSha: '2'.repeat(40),
  baseSha: null,
  branch: 'chore/vulkano-update-2222222',
  dryRun: false,
  docs: {
    added: ['references/AGENTS/WORKFLOW.md'],
    changed: ['AGENTS.md'],
    removed: ['references/AGENTS/GIT.md'],
    kept: [],
    ask: []
  },
  skills: { state: 'copied', from: null, to: 's'.repeat(40), action: 'replace' },
  projectMdCreated: true,
  envAdded: ['SITE_URL'],
  migrations: [{ date: '2026-10-12', title: 'two', migration: '- Rename foo to bar.' }],
  firstSync: true,
  core: { from: '2.1.2', to: '2.1.6', where: 'catalog' }
};

describe('renderSyncEntry', () => {
  it('lists every change', () => {
    expect(renderSyncEntry({ date: '2026-10-13', ...RESULT })).toBe(
      [
        '## 2026-10-13 — Vulkano template sync 2222222',
        '',
        '**Changed:**',
        '',
        '- Template: `vulkanojs/vulkano@2222222` (base: first sync).',
        '- Docs added: `references/AGENTS/WORKFLOW.md`; changed: `AGENTS.md`; removed: `references/AGENTS/GIT.md`.',
        '- Local edits kept: none.',
        '- Skills submodule: copied → sssssss.',
        '- `PROJECT.md` created from the template.',
        '- `.env.example`: added `SITE_URL`.',
        '- `@vulkano/core`: 2.1.2 → 2.1.6.'
      ].join('\n')
    );
  });
});

describe('appendProjectChangelog', () => {
  it('inserts the entry above the newest one', async () => {
    const dir = await writeTree(await tempDir(), {
      'CHANGELOG.md': '# Changelog\n\nIntro.\n\n## 2026-01-01 — old\n'
    });
    await appendProjectChangelog(dir, '## 2026-10-13 — new');
    expect(await readFile(join(dir, 'CHANGELOG.md'), 'utf8')).toBe(
      '# Changelog\n\nIntro.\n\n## 2026-10-13 — new\n\n## 2026-01-01 — old\n'
    );
  });

  it('creates the file when missing', async () => {
    const dir = await tempDir();
    await appendProjectChangelog(dir, '## 2026-10-13 — new');
    expect(await readFile(join(dir, 'CHANGELOG.md'), 'utf8')).toBe(
      '# Changelog\n\n## 2026-10-13 — new\n'
    );
  });
});

describe('formatReport', () => {
  it('includes branch, migrations, first-sync note and commit message', () => {
    const text = formatReport(RESULT);
    expect(text).toMatch(/Branch: chore\/vulkano-update-2222222/);
    expect(text).toMatch(/2026-10-12 — two\n {2}- Rename foo to bar\./);
    expect(text).toMatch(/last 90 days/);
    expect(text).toMatch(/\[chore\] docs: sync with Vulkano template 2222222/);
    expect(text).toMatch(/Nothing was committed/);
  });

  it('marks a dry run and lists files that would need an answer', () => {
    const text = formatReport({
      ...RESULT,
      dryRun: true,
      docs: { ...RESULT.docs, ask: ['AGENTS.md'] }
    });
    expect(text).toMatch(/Dry run — nothing was written/);
    expect(text).toMatch(/Would ask \(local edits\): `AGENTS.md`/);
    expect(text).not.toMatch(/Suggested commit/);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/lib/report.test.js`
Expected: FAIL, módulo no encontrado.

- [ ] **Step 3: Implementar**

`src/lib/report.js`:

```js
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const short = (sha) => sha.slice(0, 7);
const list = (items) => (items?.length ? items.map((x) => `\`${x}\``).join(', ') : 'none');

function bullets({ targetSha, baseSha, docs, skills, projectMdCreated, envAdded, core }) {
  const lines = [
    `- Template: \`vulkanojs/vulkano@${short(targetSha)}\` (base: ${baseSha ? `\`${short(baseSha)}\`` : 'first sync'}).`
  ];
  if (docs) {
    lines.push(
      `- Docs added: ${list(docs.added)}; changed: ${list(docs.changed)}; removed: ${list(docs.removed)}.`
    );
    lines.push(`- Local edits kept: ${list(docs.kept)}.`);
  }
  if (skills)
    lines.push(
      `- Skills submodule: ${skills.from ? short(skills.from) : skills.state} → ${short(skills.to)}.`
    );
  if (projectMdCreated) lines.push('- `PROJECT.md` created from the template.');
  if (envAdded?.length) lines.push(`- \`.env.example\`: added ${list(envAdded)}.`);
  if (core) {
    const note = core.skipped ? ' (skipped)' : core.failed ? ` (failed: ${core.failed})` : '';
    lines.push(`- \`@vulkano/core\`: ${core.from} → ${core.to}${note}.`);
  }
  return lines;
}

export function renderSyncEntry({ date, ...result }) {
  return [
    `## ${date} — Vulkano template sync ${short(result.targetSha)}`,
    '',
    '**Changed:**',
    '',
    ...bullets(result)
  ].join('\n');
}

export async function appendProjectChangelog(projectDir, entry) {
  const path = join(projectDir, 'CHANGELOG.md');
  let text = await readFile(path, 'utf8').catch((err) => {
    if (err.code === 'ENOENT') return '# Changelog\n';
    throw err;
  });
  const index = text.search(/^## /m);
  text =
    index === -1
      ? `${text.trimEnd()}\n\n${entry}\n`
      : `${text.slice(0, index)}${entry}\n\n${text.slice(index)}`;
  await writeFile(path, text);
}

export function formatReport(result) {
  const out = [
    result.dryRun ? 'Dry run — nothing was written.' : `Branch: ${result.branch}`,
    '',
    ...bullets(result)
  ];
  if (result.dryRun && result.docs?.ask.length)
    out.push(`- Would ask (local edits): ${list(result.docs.ask)}.`);
  if (result.migrations?.length) {
    out.push('', 'Pending migrations (apply them with the vulkano-template-update skill):');
    for (const m of result.migrations) {
      out.push(`- ${m.date} — ${m.title}`, ...m.migration.split('\n').map((line) => `  ${line}`));
    }
  }
  if (result.firstSync) {
    out.push(
      '',
      'First sync: only migrations from the last 90 days are listed; review older ones against the project.'
    );
  }
  if (!result.dryRun) {
    out.push(
      '',
      `Suggested commit: [chore] docs: sync with Vulkano template ${short(result.targetSha)}`,
      'Nothing was committed.'
    );
  }
  return out.join('\n');
}
```

- [ ] **Step 4: Correr y ver que pasa**

Run: `pnpm test test/lib/report.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add src/lib/report.js test/lib/report.test.js
git commit -m "[added] cli: sync changelog entry and console report"
```

---

### Task 12: Orquestador `runUpdate` + pruebas de integración

**Files:**

- Create: `cli/src/update/index.js`, `cli/src/update/deps.js`, `cli/test/update/update.test.js`

**Interfaces:**

- Consumes: todo lo anterior.
- Produces: `runUpdate({ ref, yes, dryRun, cwd }, deps) → Promise<0>` (lanza en error); `defaultDeps(cwd) → deps`; `TEMPLATE_REPO = 'vulkanojs/vulkano'`.
- `deps` = `{ git, github, npm, fetchTemplate(repo, sha, dir), prompt, log(message), install(cwd), isInteractive: boolean, now() → Date, diffFiles(a, b), diffDirs(a, b), tmpDir() → Promise<string> }`.

- [ ] **Step 1: Test que falla**

`test/update/update.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readFile, readlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { runUpdate } from '../../src/update/index.js';
import { createGit } from '../../src/lib/git.js';
import { SKILLS_PATH } from '../../src/lib/skills.js';
import { tempDir, writeTree, git, commitAll } from '../helpers.js';

const SHA1 = '1'.repeat(40);
const SHA2 = '2'.repeat(40);

const TEMPLATE_V1 = {
  'AGENTS.md': 'agents v1\n',
  'CLAUDE.md': { link: 'AGENTS.md' },
  'references/AGENTS/BACKEND.md': 'backend v1\n',
  'references/CHANGELOG.md': '## 2026-10-01 — one\n\n**Migration:**\n\n- None.\n',
  'PROJECT.md': '# PROJECT.md (template)\n',
  '.env.example': 'PORT=8000\n'
};
const TEMPLATE_V2 = {
  ...TEMPLATE_V1,
  'AGENTS.md': 'agents v2\n',
  'references/AGENTS/FRONTEND.md': 'frontend v2\n',
  'references/CHANGELOG.md':
    '## 2026-10-12 — two\n\n**Migration:**\n\n- Rename foo to bar in app/.\n\n## 2026-10-01 — one\n\n**Migration:**\n\n- None.\n',
  '.env.example': 'PORT=8000\n# SITE_URL=https://example.com   # optional\n'
};
const TEMPLATES = { [SHA1]: TEMPLATE_V1, [SHA2]: TEMPLATE_V2 };
const PKG = JSON.stringify({ name: 'app', dependencies: { '@vulkano/core': '2.1.2' } }, null, 2);

async function skillsRepo() {
  const dir = await writeTree(await tempDir(), { 'vulkano-x/SKILL.md': 's1\n' });
  git(dir, 'init', '-q');
  const s1 = commitAll(dir);
  await writeFile(join(dir, 'vulkano-x/SKILL.md'), 's2\n');
  const s2 = commitAll(dir);
  return { url: dir, s1, s2 };
}

async function makeProject(files, setup = () => {}) {
  const dir = await writeTree(await tempDir(), { 'package.json': PKG, ...files });
  git(dir, 'init', '-q');
  await setup(dir);
  commitAll(dir);
  return dir;
}

function makeDeps(
  cwd,
  skills,
  { latest = '2.1.2', answers = [], isInteractive = true, install = async () => {} } = {}
) {
  const logs = [];
  const deps = {
    git: createGit(cwd, { extraArgs: ['-c', 'protocol.file.allow=always'] }),
    github: {
      resolveSha: async () => SHA2,
      isInHistory: async (base) => base === SHA1 || base === SHA2,
      commitDate: async () => '2026-10-05',
      submoduleSha: async () => ({ sha: skills.s2, url: skills.url })
    },
    npm: { latest: async () => latest },
    fetchTemplate: async (repo, sha, dir) =>
      writeTree(
        dir,
        repo === 'vulkanojs/vulkano' ? TEMPLATES[sha] : { 'vulkano-x/SKILL.md': 's2\n' }
      ),
    prompt: {
      confirm: async () => answers.shift() ?? true,
      choose: async () => answers.shift() ?? 'keep'
    },
    log: (message) => logs.push(message),
    install,
    isInteractive,
    now: () => new Date('2026-10-13T00:00:00Z'),
    diffFiles: async () => {},
    diffDirs: async () => {},
    tmpDir: () => tempDir()
  };
  return { deps, logs };
}

const read = (dir, path) => readFile(join(dir, path), 'utf8');
const gitlink = (dir) => git(dir, 'ls-files', '-s', SKILLS_PATH).split(/\s+/)[1];

async function expectSynced(dir, skills) {
  expect(await read(dir, 'AGENTS.md')).toBe('agents v2\n');
  expect(await readlink(join(dir, 'CLAUDE.md'))).toBe('AGENTS.md');
  expect(await read(dir, 'references/AGENTS/FRONTEND.md')).toBe('frontend v2\n');
  expect(existsSync(join(dir, 'references/AGENTS/GIT.md'))).toBe(false);
  expect(gitlink(dir)).toBe(skills.s2);
  expect(JSON.parse(await read(dir, '.vulkano.json')).template.sha).toBe(SHA2);
  expect(await read(dir, 'CHANGELOG.md')).toMatch(/## 2026-10-13 — Vulkano template sync 2222222/);
  expect(git(dir, 'branch', '--show-current')).toBe('chore/vulkano-update-2222222');
}

describe('runUpdate — starting states', () => {
  it('state 1: skills submodule + old references', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject(
      { 'AGENTS.md': 'old\n', 'references/AGENTS/GIT.md': 'old\n', 'PROJECT.md': '# mine\n' },
      (d) => {
        git(d, 'submodule', 'add', '-q', skills.url, SKILLS_PATH);
        git(d, '-C', SKILLS_PATH, 'checkout', '-q', skills.s1);
      }
    );
    const { deps } = makeDeps(dir, skills);
    expect(await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps)).toBe(0);
    await expectSynced(dir, skills);
    expect(await read(dir, 'PROJECT.md')).toBe('# mine\n');
  });

  it('state 2: copied skills folder', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({
      'AGENTS.md': 'old\n',
      [`${SKILLS_PATH}/vulkano-x/SKILL.md`]: 'copied\n'
    });
    const { deps } = makeDeps(dir, skills);
    await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps);
    await expectSynced(dir, skills);
  });

  it('state 3: old references/ without skills', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({
      'AGENTS.md': 'old\n',
      'references/AGENTS/GIT.md': 'old\n',
      'references/AGENTS/SEO.md': 'old\n'
    });
    const { deps } = makeDeps(dir, skills);
    await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps);
    await expectSynced(dir, skills);
    expect(existsSync(join(dir, 'references/AGENTS/SEO.md'))).toBe(false);
  });

  it('state 4: no references/, no AGENTS.md, no PROJECT.md', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({ '.env.example': 'PORT=3000\n' });
    const { deps } = makeDeps(dir, skills);
    await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps);
    await expectSynced(dir, skills);
    expect(await read(dir, 'PROJECT.md')).toBe('# PROJECT.md (template)\n');
    expect(await read(dir, '.env.example')).toBe(
      'PORT=3000\n# SITE_URL=https://example.com   # optional\n'
    );
    expect(existsSync(join(dir, '.env'))).toBe(false);
  });
});

describe('runUpdate — behaviour', () => {
  it('keeps a local edit when the user answers keep and lists pending migrations', async () => {
    const skills = await skillsRepo();
    const state = JSON.stringify({
      template: { ref: 'master', sha: SHA1 },
      skills: skills.s1,
      syncedAt: 'x'
    });
    const dir = await makeProject({
      ...TEMPLATE_V1,
      'AGENTS.md': 'my agents\n',
      '.vulkano.json': state
    });
    const { deps, logs } = makeDeps(dir, skills, { answers: ['keep'] });
    await runUpdate({ ref: 'master', yes: false, dryRun: false, cwd: dir }, deps);
    expect(await read(dir, 'AGENTS.md')).toBe('my agents\n');
    expect(await read(dir, 'references/AGENTS/FRONTEND.md')).toBe('frontend v2\n');
    const report = logs.at(-1);
    expect(report).toMatch(/Local edits kept: `AGENTS.md`/);
    expect(report).toMatch(/Rename foo to bar in app\//);
  });

  it('says already up to date and creates no branch', async () => {
    const skills = await skillsRepo();
    const state = JSON.stringify({
      template: { ref: 'master', sha: SHA2 },
      skills: skills.s2,
      syncedAt: 'x'
    });
    const dir = await makeProject({ '.vulkano.json': state });
    const { deps, logs } = makeDeps(dir, skills);
    expect(await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps)).toBe(0);
    expect(logs.join('\n')).toMatch(/Already up to date/);
    expect(git(dir, 'branch', '--show-current')).toBe('master');
  });

  it('treats a base that left master (force-push) as a first sync', async () => {
    const skills = await skillsRepo();
    const state = JSON.stringify({
      template: { ref: 'master', sha: '9'.repeat(40) },
      skills: skills.s1,
      syncedAt: 'x'
    });
    const dir = await makeProject({ 'AGENTS.md': 'old\n', '.vulkano.json': state });
    const { deps, logs } = makeDeps(dir, skills);
    await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps);
    expect(logs.join('\n')).toMatch(/no longer in master: treating this as a first sync/);
    await expectSynced(dir, skills);
  });

  it('refuses to prompt without a terminal and writes nothing', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({ 'AGENTS.md': 'old\n' });
    const { deps } = makeDeps(dir, skills, { isInteractive: false });
    await expect(
      runUpdate({ ref: 'master', yes: false, dryRun: false, cwd: dir }, deps)
    ).rejects.toThrow(/interactive terminal.*--yes or --dry-run/);
    expect(git(dir, 'status', '--porcelain')).toBe('');
    expect(git(dir, 'branch', '--show-current')).toBe('master');
  });

  it('stops on a dirty tree', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({});
    await writeFile(join(dir, 'untracked.txt'), 'x');
    const { deps } = makeDeps(dir, skills);
    await expect(
      runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps)
    ).rejects.toThrow(/not clean/);
  });

  it('dry run writes nothing and creates no branch', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({ 'AGENTS.md': 'old\n' });
    const { deps, logs } = makeDeps(dir, skills, { latest: '2.1.6' });
    await runUpdate({ ref: 'master', yes: false, dryRun: true, cwd: dir }, deps);
    expect(git(dir, 'status', '--porcelain')).toBe('');
    expect(git(dir, 'branch', '--show-current')).toBe('master');
    expect(logs.at(-1)).toMatch(/Dry run — nothing was written/);
    expect(logs.at(-1)).toMatch(/2.1.2 → 2.1.6/);
  });

  it('bumps the core and records it', async () => {
    const skills = await skillsRepo();
    const dir = await makeProject({});
    const { deps } = makeDeps(dir, skills, { latest: '2.1.6' });
    await runUpdate({ ref: 'master', yes: true, dryRun: false, cwd: dir }, deps);
    expect(JSON.parse(await read(dir, 'package.json')).dependencies['@vulkano/core']).toBe('2.1.6');
    expect(await read(dir, 'CHANGELOG.md')).toMatch(/`@vulkano\/core`: 2.1.2 → 2.1.6\./);
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm test test/update/update.test.js`
Expected: FAIL, módulo `../../src/update/index.js` no encontrado.

- [ ] **Step 3: Implementar `deps.js`**

`src/update/deps.js`:

```js
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGit } from '../lib/git.js';
import { createGithub } from '../lib/github.js';
import { createNpm } from '../lib/npm.js';
import { createPrompt } from '../lib/prompt.js';
import { fetchTemplate } from '../lib/template.js';

const exec = promisify(execFile);

function gitDiffNoIndex(a, b) {
  // exit 1 = there are differences; that's the normal case here
  return new Promise((resolve) => {
    spawn('git', ['--no-pager', 'diff', '--no-index', '--color', '--', a, b], {
      stdio: 'inherit'
    }).on('close', () => resolve());
  });
}

export function defaultDeps(cwd) {
  return {
    git: createGit(cwd),
    github: createGithub(),
    npm: createNpm(),
    fetchTemplate,
    prompt: createPrompt(),
    log: (message) => console.log(message),
    install: (dir) => exec('pnpm', ['install'], { cwd: dir, maxBuffer: 64 * 1024 * 1024 }),
    isInteractive: Boolean(process.stdin.isTTY),
    now: () => new Date(),
    diffFiles: gitDiffNoIndex,
    diffDirs: gitDiffNoIndex,
    tmpDir: () => mkdtemp(join(tmpdir(), 'vulkano-update-'))
  };
}
```

- [ ] **Step 4: Implementar `index.js`**

`src/update/index.js`:

```js
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { readState, writeState } from '../lib/state.js';
import { classifyDocs } from '../lib/classify.js';
import { applyDocs } from '../lib/apply-docs.js';
import { syncSkills, SKILLS_PATH, repoFromUrl } from '../lib/skills.js';
import { readCoreVersion, isNewer } from '../lib/core.js';
import { pendingMigrations, daysAgo } from '../lib/migrations.js';
import { renderSyncEntry, appendProjectChangelog, formatReport } from '../lib/report.js';
import { ensureProjectMd, syncEnvExample, updateCore } from './steps.js';
import { defaultDeps } from './deps.js';

export const TEMPLATE_REPO = 'vulkanojs/vulkano';
const short = (sha) => sha.slice(0, 7);

export async function runUpdate(
  { ref = 'master', yes = false, dryRun = false, cwd = process.cwd() } = {},
  deps = defaultDeps(cwd)
) {
  const { git, github, npm, fetchTemplate, prompt, log, isInteractive, now, tmpDir } = deps;

  if (!(await git.isRepo())) throw new Error('Not a git repository');
  const core = await readCoreVersion(cwd);
  if (!(await git.isClean()))
    throw new Error('git status is not clean: commit or stash your changes first');
  if (!yes && !dryRun && !isInteractive) {
    throw new Error('Prompts need an interactive terminal: rerun with --yes or --dry-run');
  }

  const targetSha = await github.resolveSha(ref);
  const state = await readState(cwd);
  let baseSha = state?.template?.sha ?? null;
  if (baseSha && baseSha !== targetSha && !(await github.isInHistory(baseSha, targetSha))) {
    log(`Base ${short(baseSha)} is no longer in ${ref}: treating this as a first sync`);
    baseSha = null;
  }
  const latestCore = await npm.latest('@vulkano/core');
  const docsPending = baseSha !== targetSha;
  if (!docsPending && !isNewer(core.version, latestCore)) {
    log(`Already up to date (template ${short(targetSha)}, @vulkano/core ${core.version})`);
    return 0;
  }

  const branch = `chore/vulkano-update-${short(targetSha)}`;
  if (!dryRun) await git.switchNew(branch);
  const work = await tmpDir();
  try {
    const result = {
      ref,
      targetSha,
      baseSha,
      branch,
      dryRun,
      docs: null,
      skills: null,
      projectMdCreated: false,
      envAdded: [],
      migrations: [],
      firstSync: false,
      core: null
    };
    if (docsPending) {
      const targetDir = await fetchTemplate(TEMPLATE_REPO, targetSha, join(work, 'target'));
      const baseDir = baseSha
        ? await fetchTemplate(TEMPLATE_REPO, baseSha, join(work, 'base'))
        : null;
      const items = await classifyDocs({ projectDir: cwd, baseDir, targetDir });
      result.docs = await applyDocs({
        projectDir: cwd,
        targetDir,
        items,
        prompt,
        yes,
        dryRun,
        diff: (path) => deps.diffFiles(join(cwd, path), join(targetDir, path))
      });
      const skillsTarget = await github.submoduleSha(targetSha, SKILLS_PATH);
      result.skills = await syncSkills({
        projectDir: cwd,
        git,
        target: skillsTarget,
        prompt,
        yes,
        dryRun,
        downloadSkills: (sha) =>
          fetchTemplate(repoFromUrl(skillsTarget.url), sha, join(work, 'skills')),
        diffDirs: deps.diffDirs
      });
      result.projectMdCreated = await ensureProjectMd({ projectDir: cwd, targetDir, dryRun });
      result.envAdded = await syncEnvExample({ projectDir: cwd, targetDir, dryRun });
      const changelog = await readFile(join(targetDir, 'references/CHANGELOG.md'), 'utf8').catch(
        () => ''
      );
      const since = baseSha
        ? ((await github.commitDate(baseSha)) ?? daysAgo(90, now()))
        : daysAgo(90, now());
      result.migrations = pendingMigrations(changelog, since);
      result.firstSync = !baseSha;
    }
    result.core = await updateCore({
      cwd,
      latest: latestCore,
      prompt,
      dryRun,
      isInteractive,
      install: deps.install,
      log
    });
    if (!dryRun) {
      await writeState(cwd, {
        ref,
        sha: targetSha,
        skills: result.skills?.to ?? state?.skills ?? null,
        syncedAt: now().toISOString()
      });
      await appendProjectChangelog(
        cwd,
        renderSyncEntry({ date: now().toISOString().slice(0, 10), ...result })
      );
    }
    log(formatReport(result));
    return 0;
  } catch (err) {
    if (!dryRun) {
      log(
        `Update stopped on branch ${branch}. To discard it: git reset --hard && git clean -fd && git switch - && git branch -D ${branch}`
      );
    }
    throw err;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}
```

- [ ] **Step 5: Correr y ver que pasa**

Run: `pnpm test`
Expected: PASS (todos los tests, incluidos los 11 de integración).

- [ ] **Step 6: Commit (pedir sí al usuario)**

```bash
git add src/update test/update/update.test.js
git commit -m "[added] cli: vulkano update orchestrator with integration tests for the 4 starting states"
```

---

### Task 13: README, CHANGELOG del CLI y prueba manual real

**Files:**

- Create: `cli/README.md` (reemplaza), `cli/CHANGELOG.md`

**Interfaces:**

- Consumes: el CLI completo.

- [ ] **Step 1: README**

`README.md`:

````markdown
# @vulkano/cli

Keeps Vulkano projects in sync with the [Vulkano template](https://github.com/vulkanojs/vulkano).

## `vulkano update`

Run inside an existing Vulkano project (clean git tree, Node 24+):

```bash
npx @vulkano/cli update            # sync with master of vulkanojs/vulkano
npx @vulkano/cli update --dry-run  # show what would change
npx @vulkano/cli update --yes      # overwrite local edits without asking
npx @vulkano/cli update --ref <sha|branch>
```

What it does, on a new branch `chore/vulkano-update-<sha>`:

- Overwrites `AGENTS.md`, `CLAUDE.md` and `references/` with the template's; asks per file when you edited one locally.
- Pins the `.claude/skills/vulkano-skills` submodule to the sha the template pins (converts a copied skills folder into the submodule).
- Creates `PROJECT.md` only if missing — never edits an existing one.
- Adds new keys to `.env.example` (never touches `.env`).
- Bumps `@vulkano/core` to the latest version (asks on a major).
- Writes `.vulkano.json` (the base for the next sync) and a `CHANGELOG.md` entry, then prints pending migrations and a suggested commit message. It never commits.

Set `GITHUB_TOKEN` to avoid GitHub's anonymous rate limit (60 requests/hour).
````

- [ ] **Step 2: CHANGELOG**

`CHANGELOG.md`:

```markdown
# Changelog

## 1.0.0 — 2026-10-13

- Rewritten from scratch. Replaces the unused 0.x scaffolding commands.
- New `vulkano update`: syncs AGENTS.md, references/, skills, .env.example and @vulkano/core with the Vulkano template.
```

- [ ] **Step 3: Paquete**

Run: `pnpm test && npm pack --dry-run`
Expected: tests PASS; el tarball solo trae `bin/`, `src/`, `package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`.

- [ ] **Step 4: Prueba manual contra GitHub real**

En una copia desechable de un proyecto real (pedir al usuario cuál; nunca en el original):

```bash
cp -R <proyecto> /tmp/vulkano-update-check && cd /tmp/vulkano-update-check
node /Users/IvanMel/Sites/dailyscript/vulkano/cli/bin/vulkano.js update --dry-run
node /Users/IvanMel/Sites/dailyscript/vulkano/cli/bin/vulkano.js update
```

Verificar a mano:

- `CLAUDE.md` es symlink a `AGENTS.md` (`ls -la CLAUDE.md`). Si giget no conserva el symlink, anotarlo y crear el symlink explícitamente en `applyDocs` cuando `path === 'CLAUDE.md'` y el destino sea un archivo cuyo contenido sea `AGENTS.md`.
- `git -C .claude/skills/vulkano-skills rev-parse HEAD` = sha del gitlink en `master` de `vulkanojs/vulkano`.
- `vp check` y `vp test` en verde.

Reportar el resultado al usuario.

- [ ] **Step 5: Commit (pedir sí al usuario)**

```bash
git add README.md CHANGELOG.md
git commit -m "[added] cli: README and changelog for 1.0.0"
```

- [ ] **Step 6: Publicar (solo con sí explícito del usuario)**

```bash
npm publish --access public
```

---

### Task 14: Skill `vulkano-template-update` delgada (repo `vulkano-skills`)

**Files:**

- Modify: `framework/.claude/skills/vulkano-skills/vulkano-template-update/SKILL.md` (reemplazo completo)

**Interfaces:**

- Consumes: `npx @vulkano/cli update` publicado (Task 13).

- [ ] **Step 1: Reescribir el SKILL.md**

```markdown
---
name: vulkano-template-update
description: Use when the user asks to update, sync, or refresh this project's agent docs (AGENTS.md, references/AGENTS/, skills) or @vulkano/core from the latest Vulkano template — runs `npx @vulkano/cli update`, then applies the migrations it lists and reviews kept local edits. Never edits PROJECT.md values.
---

# Vulkano Template Update

## Overview

`npx @vulkano/cli update` does the mechanical sync: it overwrites the template-owned docs (`AGENTS.md`, `CLAUDE.md`, `references/`), pins the skills submodule, creates `PROJECT.md` only if missing, adds new `.env.example` keys, bumps `@vulkano/core`, and writes `.vulkano.json` plus a `CHANGELOG.md` entry. This skill covers what needs judgment afterwards.

## When to use

The user says "update/sync the docs/references/skills from the template", "get this project up to date with Vulkano", or similar. Not for app code changes unrelated to a template migration.

## Steps

1. Run `npx @vulkano/cli update` in the project root, without `--yes`: the user answers the per-file questions about local edits. If it stops (dirty tree, no network, rate limit), report the message and stop.
2. Migrations: the report lists **Migration** entries from the template's `references/CHANGELOG.md`. Each is a condition plus an action. Check the condition against the project; skip it if already satisfied, apply it otherwise, and ask when in doubt. Never change `PROJECT.md` values; only its structure when a migration says so. On a first sync the list covers the last 90 days only: check older entries in `references/CHANGELOG.md` against the project's real state.
3. Kept local edits: for each file the user kept, check if it holds project facts. If so, propose moving them to `PROJECT.md` so the next sync can overwrite the file.
4. Verify: `vp check` and `vp test`; every relative link and anchor in `AGENTS.md`, `PROJECT.md` and `references/AGENTS/*.md` resolves; grep the project (`app/`, `frontend/`, `README.md`, `public/`, `test/`) for references to files the sync removed.
5. Report what the CLI changed, the migrations applied/skipped, and the suggested commit message. Never run `git commit`.
```

- [ ] **Step 2: Commit en `vulkano-skills` (pedir sí al usuario)**

```bash
cd /Users/IvanMel/Sites/dailyscript/vulkano/framework/.claude/skills/vulkano-skills
git add vulkano-template-update/SKILL.md
git commit -m "[updated] template-update skill: delegate the sync to npx @vulkano/cli update"
```

---

### Task 15: Template (`vulkanojs/vulkano`): docs y puntero del submódulo

**Files:**

- Modify: `framework/CHANGELOG.md` (encabezado del stub)
- Modify: `framework/references/CHANGELOG.md` (entrada nueva arriba)
- Modify: gitlink `framework/.claude/skills/vulkano-skills`

- [ ] **Step 1: Encabezado del `CHANGELOG.md` del proyecto**

Reemplazar el último párrafo:

```
A template sync adds an entry titled `## YYYY-MM-DD — Vulkano template sync <sha>` (written by the `vulkano-template-update` skill); the next sync uses that sha as its diff base.
```

por:

```
A template sync (`npx @vulkano/cli update`) adds an entry titled `## YYYY-MM-DD — Vulkano template sync <sha>`. The base for the next sync is stored in `.vulkano.json`, not in the entry title.
```

- [ ] **Step 2: Entrada en `references/CHANGELOG.md`** (arriba del todo)

```markdown
## 2026-10-13 — Template sync moves to `npx @vulkano/cli update`

**Changed:**

- New `@vulkano/cli` 1.0 command `update`: syncs `AGENTS.md`, `references/`, the skills submodule, `.env.example` keys and `@vulkano/core` with `master` of the template; creates `PROJECT.md` only if missing; records the synced sha in `.vulkano.json`.
- Skills submodule: `vulkano-template-update` now runs the CLI and only handles migrations and kept local edits.
- `CHANGELOG.md` stub: the next sync's base lives in `.vulkano.json`.

**Migration:**

- Run `npx @vulkano/cli update` in the project root and commit the result (including `.vulkano.json`).
```

- [ ] **Step 3: Puntero del submódulo y verificación**

```bash
cd /Users/IvanMel/Sites/dailyscript/vulkano/framework
git add .claude/skills/vulkano-skills
vp check && vp test
```

Expected: ambos en verde; `git diff --cached --stat` muestra el gitlink.

- [ ] **Step 4: Commit en el framework (pedir sí al usuario)**

```bash
git add CHANGELOG.md references/CHANGELOG.md .claude/skills/vulkano-skills
git commit -m "[updated] docs: template sync via npx @vulkano/cli update, bump skills"
```
