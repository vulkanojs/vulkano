'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const INBOX_DIR = path.resolve(__dirname, '..', 'inbox');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

function filterConvertibleImages(filenames) {
  return filenames.filter((filename) =>
    IMAGE_EXTENSIONS.some((ext) => filename.toLowerCase().endsWith(ext))
  );
}

async function run() {
  const entries = fs.readdirSync(INBOX_DIR, { withFileTypes: true });
  const filenames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const images = filterConvertibleImages(filenames);

  if (images.length === 0) {
    console.log('No convertible images found in inbox/.');
    return;
  }

  for (const filename of images) {
    const inputPath = path.join(INBOX_DIR, filename);
    const outputPath = path.join(INBOX_DIR, `${path.parse(filename).name}.webp`);
    await sharp(inputPath).webp().toFile(outputPath);
    console.log(`Converted ${filename} -> ${path.basename(outputPath)}`);
  }
}

if (require.main === module) {
  void run();
}

module.exports = { filterConvertibleImages };
