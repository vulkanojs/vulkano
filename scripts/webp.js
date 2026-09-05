'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const sharp = require('sharp');

const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const REFERENCE_EXTENSIONS = ['.vue', '.scss', '.css', '.njk', '.hbs', '.html', '.js'];
const EXCLUDED_DIR_NAMES = new Set(['node_modules', '.git', 'dist', '.claude', 'public']);

function filterConvertibleImages(filenames) {
  return filenames.filter((filename) =>
    IMAGE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
  );
}

function toPublicPath(absImagePath, publicDir) {
  const relative = path.relative(publicDir, absImagePath).split(path.sep).join('/');
  return `/${relative}`;
}

function escapeForRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rewriteReferences(content, oldPublicPath, newPublicPath) {
  const pattern = new RegExp(escapeForRegExp(oldPublicPath), 'g');
  const newContent = content.replace(pattern, newPublicPath);
  return { content: newContent, changed: newContent !== content };
}

function walkDir(dir, { excludedDirNames = new Set(), matchExtensions = null } = {}) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (excludedDirNames.has(entry.name)) continue;
      results.push(...walkDir(fullPath, { excludedDirNames, matchExtensions }));
      continue;
    }

    if (!matchExtensions || matchExtensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

function findConvertibleImages(dir) {
  const filenames = walkDir(dir, { matchExtensions: IMAGE_EXTENSIONS });
  return filterConvertibleImages(filenames);
}

function hasSiblingWebp(absImagePath) {
  const webpPath = path.join(path.dirname(absImagePath), `${path.parse(absImagePath).name}.webp`);
  return fs.existsSync(webpPath);
}

async function convertToWebp(absImagePath) {
  const outputPath = path.join(path.dirname(absImagePath), `${path.parse(absImagePath).name}.webp`);
  await sharp(absImagePath).webp().toFile(outputPath);
  return outputPath;
}

function updateReferencesForImage(oldPublicPath, newPublicPath, repoRoot) {
  const referenceFiles = walkDir(repoRoot, {
    excludedDirNames: EXCLUDED_DIR_NAMES,
    matchExtensions: REFERENCE_EXTENSIONS
  });
  const touchedFiles = [];

  for (const filePath of referenceFiles) {
    const original = fs.readFileSync(filePath, 'utf8');
    const { content, changed } = rewriteReferences(original, oldPublicPath, newPublicPath);

    if (changed) {
      fs.writeFileSync(filePath, content);
      touchedFiles.push(filePath);
    }
  }

  return touchedFiles;
}

function askYesNo(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function run({ publicDir = PUBLIC_DIR, repoRoot = REPO_ROOT, promptFn = askYesNo } = {}) {
  const imgDir = path.join(publicDir, 'img');
  const images = findConvertibleImages(imgDir);
  const pending = images.filter((absPath) => !hasSiblingWebp(absPath));

  if (pending.length === 0) {
    console.log('No convertible images found in public/img/ (or all already have a .webp).');
    return { converted: [], deleted: false };
  }

  const processed = [];

  for (const absImagePath of pending) {
    const oldPublicPath = toPublicPath(absImagePath, publicDir);
    const webpAbsPath = await convertToWebp(absImagePath);
    const newPublicPath = toPublicPath(webpAbsPath, publicDir);

    console.log(`Converted ${oldPublicPath} -> ${newPublicPath}`);

    const touchedFiles = updateReferencesForImage(oldPublicPath, newPublicPath, repoRoot);
    for (const file of touchedFiles) {
      console.log(`  updated reference in ${path.relative(repoRoot, file)}`);
    }

    processed.push(absImagePath);
  }

  const shouldDelete = await promptFn(
    `\nDelete the ${processed.length} original file(s) now replaced by .webp? (y/N) `
  );

  if (shouldDelete) {
    for (const absImagePath of processed) {
      fs.unlinkSync(absImagePath);
      console.log(`Deleted ${path.relative(repoRoot, absImagePath)}`);
    }
  }

  return { converted: processed, deleted: shouldDelete };
}

if (require.main === module) {
  void run();
}

module.exports = {
  filterConvertibleImages,
  toPublicPath,
  rewriteReferences,
  walkDir,
  findConvertibleImages,
  run
};
