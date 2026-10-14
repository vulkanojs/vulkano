import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { entries } from '../vite.entries.mjs';

// Prose rules from references/AGENTS/ checked mechanically. A project that
// overrides one in PROJECT.md removes its case here.

const root = path.resolve(__dirname, '..');

const APP_DIRS = ['config', 'controllers', 'models', 'services', 'views'];
const ENTRYPOINT_DIRS = ['scss', 'components', 'layouts', 'views', 'store', 'composables', 'utils'];

function dirs(dir) {
  const abs = path.join(root, dir);

  if (!fs.existsSync(abs)) {
    return [];
  }

  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

// Relative import/require targets of a file, as root-relative paths.
function relativeImports(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const specifiers = source.matchAll(
    /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"](\.{1,2}\/[^'"]*)['"]/g
  );

  return [...specifiers].map(([, specifier]) =>
    path.normalize(path.join(path.dirname(file), specifier))
  );
}

function walk(dir, match) {
  const abs = path.join(root, dir);

  if (!fs.existsSync(abs)) {
    return [];
  }

  return fs
    .readdirSync(abs, { recursive: true })
    .map((file) => path.join(dir, file))
    .filter((file) => match.test(file));
}

describe('conventions', () => {
  // FRONTEND.md § CSS: layout with CSS Grid, no Flexbox
  it('frontend styles use no Flexbox', () => {
    const offenders = walk('frontend', /\.(scss|vue)$/)
      .filter((file) => !file.split(path.sep).includes('ui'))
      .filter((file) =>
        /display\s*:\s*(inline-)?flex\b/.test(fs.readFileSync(path.join(root, file), 'utf8'))
      );

    expect(offenders).toEqual([]);
  });

  // vulkano-testing § Directory layout: controllers/<Name>.http.test.js
  it('every controller has its http test', () => {
    const missing = walk('app/controllers', /Controller\.js$/)
      .filter((file) => !file.split(path.sep).includes('sockets'))
      .map((file) => file.replace(/^app/, 'test/app').replace(/Controller\.js$/, '.http.test.js'))
      .filter((test) => !fs.existsSync(path.join(root, test)));

    expect(missing).toEqual([]);
  });

  // vulkano-testing § Directory layout: every other layer mirrors its source path
  it('every model, service, middleware, store, composable and util has its test', () => {
    const sources = [
      ...walk('app/models', /\.js$/),
      ...walk('app/services', /\.js$/),
      ...walk('app/config/middlewares', /\.js$/),
      ...walk('frontend', /\.js$/).filter((file) =>
        ['store', 'composables', 'utils'].includes(file.split(path.sep)[2])
      )
    ];
    const missing = sources
      .map((file) => path.join('test', file.replace(/\.js$/, '.test.js')))
      .filter((test) => !fs.existsSync(path.join(root, test)));

    expect(missing).toEqual([]);
  });

  // BACKEND.md: models/services are auto-loaded globals — checkJs needs each declared.
  // A service named like a core lib overrides it and reuses types/vulkano.d.ts.
  it('every model and service is declared in types/app.d.ts', () => {
    const declarations = ['types/app.d.ts', 'types/vulkano.d.ts']
      .map((file) => fs.readFileSync(path.join(root, file), 'utf8'))
      .join('\n');
    const missing = [...walk('app/models', /\.js$/), ...walk('app/services', /\.js$/)]
      .map((file) => path.basename(file, '.js'))
      .filter((name) => !declarations.includes(`declare const ${name}:`));

    expect(missing).toEqual([]);
  });

  // ARCHITECTURE.md § Project structure: app/ layers
  it('app/ holds only the documented layers', () => {
    const extra = dirs('app').filter((dir) => !APP_DIRS.includes(dir));

    expect(extra).toEqual([]);
  });

  // ARCHITECTURE.md § Entrypoints: one frontend/ folder per vite.entries.mjs key
  it('frontend/ holds exactly one folder per entrypoint', () => {
    const entryDirs = Object.values(entries).map((entry) => entry.split('/')[1]);
    const looseFiles = fs
      .readdirSync(path.join(root, 'frontend'), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name !== '.DS_Store')
      .map((entry) => entry.name);

    expect(dirs('frontend').sort()).toEqual([...entryDirs].sort());
    expect(
      Object.values(entries).filter((entry) => !fs.existsSync(path.join(root, entry)))
    ).toEqual([]);
    expect(looseFiles).toEqual([]);
  });

  // ARCHITECTURE.md § Project structure: entrypoint subfolders
  it('entrypoints hold only the documented subfolders', () => {
    const extra = dirs('frontend').flatMap((entry) =>
      dirs(path.join('frontend', entry))
        .filter((dir) => !ENTRYPOINT_DIRS.includes(dir))
        .map((dir) => path.join('frontend', entry, dir))
    );

    expect(extra).toEqual([]);
  });

  // FRONTEND.md § Components/Store: PascalCase folders, use<Entity>Store.js
  it('components, views and stores follow the naming convention', () => {
    const offenders = dirs('frontend').flatMap((entry) => {
      const base = path.join('frontend', entry);
      const folders = ['components', 'views'].flatMap((kind) =>
        dirs(path.join(base, kind))
          .filter((dir) => dir !== 'ui' && !/^[A-Z][A-Za-z0-9]*$/.test(dir))
          .map((dir) => path.join(base, kind, dir))
      );
      const stores = walk(path.join(base, 'store'), /\.js$/).filter(
        (file) => !/^use[A-Z][A-Za-z0-9]*Store\.js$/.test(path.basename(file))
      );

      return [...folders, ...stores];
    });

    expect(offenders).toEqual([]);
  });

  // ARCHITECTURE.md: app/ (backend) and frontend/ never import each other
  it('app/ and frontend/ never import each other', () => {
    const crossing = (from, forbidden) =>
      walk(from, /\.(js|mjs|vue)$/).filter((file) =>
        relativeImports(file).some((target) => target.startsWith(`${forbidden}${path.sep}`))
      );

    expect([...crossing('frontend', 'app'), ...crossing('app', 'frontend')]).toEqual([]);
  });
});
