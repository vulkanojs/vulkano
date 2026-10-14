import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Prose rules from references/AGENTS/ checked mechanically. A project that
// overrides one in PROJECT.md removes its case here.

const root = path.resolve(__dirname, '..');

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
});
