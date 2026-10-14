import { describe, it, expect, vi } from 'vitest';
import { waitForReady } from '../../../helpers/bootstrap.js';
import seo from '../../../../app/config/middlewares/seo.js';

describe('seo middleware', () => {
  it('sets res.locals.seo from app.config.common and the request URL, then calls next', async () => {
    await waitForReady();

    const req = {
      protocol: 'https',
      get: (header) => (header === 'host' ? 'example.com' : undefined),
      originalUrl: '/products?page=2'
    };
    const res = { locals: {} };
    const next = vi.fn();

    seo(req, res, next);

    expect(res.locals.seo).toEqual({
      title: app.config.common.SEO_DEFAULT_TITLE,
      description: app.config.common.SEO_DEFAULT_DESCRIPTION,
      image: app.config.common.SEO_DEFAULT_IMAGE,
      url: 'https://example.com/products?page=2',
      noindex: app.config.common.SEO_NOINDEX
    });
    expect(next).toHaveBeenCalledOnce();
  });
});
