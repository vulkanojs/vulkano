import { describe, it, expect } from 'vitest';
import webpModule from '../scripts/webp.js';

const { filterConvertibleImages } = webpModule;

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
