import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, afterEach } from 'vitest';
import webpModule from '../scripts/webp.js';

const { filterConvertibleImages, toPublicPath, rewriteReferences, run } = webpModule;

const tmpDirs = [];

function makeTmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'webp-test-'));
  tmpDirs.push(dir);
  fs.mkdirSync(path.join(dir, 'public', 'img'), { recursive: true });
  return dir;
}

afterEach(() => {
  while (tmpDirs.length > 0) {
    fs.rmSync(tmpDirs.pop(), { recursive: true, force: true });
  }
});

// 1x1 red pixel JPEG
const TINY_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkI' +
  'CQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

describe('filterConvertibleImages', () => {
  it('keeps only jpg/jpeg/png files, case-insensitively', () => {
    const filenames = [
      'logo.png',
      'photo.JPG',
      'banner.jpeg',
      'already.webp',
      'notes.pdf',
      '.gitignore'
    ];

    expect(filterConvertibleImages(filenames)).toEqual(['logo.png', 'photo.JPG', 'banner.jpeg']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterConvertibleImages(['notes.pdf', 'font.ttf'])).toEqual([]);
  });
});

describe('toPublicPath', () => {
  it('converts an absolute path under the public img dir to a root-relative /img/... path', () => {
    expect(toPublicPath('/repo/public/img/hero.jpg', '/repo/public')).toBe('/img/hero.jpg');
  });

  it('preserves nested feature subfolders', () => {
    expect(toPublicPath('/repo/public/img/landing/hero.jpg', '/repo/public')).toBe(
      '/img/landing/hero.jpg'
    );
  });
});

describe('rewriteReferences', () => {
  it('replaces every occurrence of the old public path with the new one', () => {
    const content = '<img src="/img/hero.jpg"><img src="/img/hero.jpg">';
    const result = rewriteReferences(content, '/img/hero.jpg', '/img/hero.webp');

    expect(result.changed).toBe(true);
    expect(result.content).toBe('<img src="/img/hero.webp"><img src="/img/hero.webp">');
  });

  it('reports changed: false and returns content unchanged when there is no match', () => {
    const content = '<img src="/img/other.jpg">';
    const result = rewriteReferences(content, '/img/hero.jpg', '/img/hero.webp');

    expect(result.changed).toBe(false);
    expect(result.content).toBe(content);
  });

  it('treats the path as a literal string, not a regex', () => {
    const content = 'background: url(/img/hero.jpg);';
    const result = rewriteReferences(content, '/img/hero.jpg', '/img/hero.webp');

    expect(result.changed).toBe(true);
    expect(result.content).toBe('background: url(/img/hero.webp);');
  });

  it('does not partially match a longer filename sharing the same prefix', () => {
    const content = '<img src="/img/hero-large.jpg">';
    const result = rewriteReferences(content, '/img/hero.jpg', '/img/hero.webp');

    expect(result.changed).toBe(false);
    expect(result.content).toBe(content);
  });
});

describe('run', () => {
  it('converts an image, rewrites its references, and deletes the original when confirmed', async () => {
    const repoRoot = makeTmpRepo();
    const publicDir = path.join(repoRoot, 'public');
    const imgPath = path.join(publicDir, 'img', 'hero.jpg');
    fs.writeFileSync(imgPath, Buffer.from(TINY_JPEG_BASE64, 'base64'));

    const viewPath = path.join(repoRoot, 'Home.vue');
    fs.writeFileSync(viewPath, '<img src="/img/hero.jpg">');

    const result = await run({ publicDir, repoRoot, promptFn: async () => true });

    expect(result.deleted).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'img', 'hero.webp'))).toBe(true);
    expect(fs.existsSync(imgPath)).toBe(false);
    expect(fs.readFileSync(viewPath, 'utf8')).toBe('<img src="/img/hero.webp">');
  });

  it('keeps the original file when the user declines deletion', async () => {
    const repoRoot = makeTmpRepo();
    const publicDir = path.join(repoRoot, 'public');
    const imgPath = path.join(publicDir, 'img', 'hero.jpg');
    fs.writeFileSync(imgPath, Buffer.from(TINY_JPEG_BASE64, 'base64'));

    const result = await run({ publicDir, repoRoot, promptFn: async () => false });

    expect(result.deleted).toBe(false);
    expect(fs.existsSync(imgPath)).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'img', 'hero.webp'))).toBe(true);
  });

  it('skips an image that already has a sibling .webp', async () => {
    const repoRoot = makeTmpRepo();
    const publicDir = path.join(repoRoot, 'public');
    const imgPath = path.join(publicDir, 'img', 'hero.jpg');
    fs.writeFileSync(imgPath, Buffer.from(TINY_JPEG_BASE64, 'base64'));
    fs.writeFileSync(path.join(publicDir, 'img', 'hero.webp'), 'not-really-webp');

    let promptCalled = false;
    const result = await run({
      publicDir,
      repoRoot,
      promptFn: async () => {
        promptCalled = true;
        return true;
      }
    });

    expect(result.converted).toEqual([]);
    expect(promptCalled).toBe(false);
    // untouched — the pre-existing (fake) .webp content proves no re-conversion happened
    expect(fs.readFileSync(path.join(publicDir, 'img', 'hero.webp'), 'utf8')).toBe(
      'not-really-webp'
    );
  });
});
