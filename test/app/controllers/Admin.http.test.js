import { describe, it, expect } from 'vitest';
import { waitForReady } from '../../helpers/bootstrap.js';

describe('GET /admin', () => {
  it('renders the admin view with its controller title and noindex, no SEO block', async () => {
    await waitForReady();

    const res = await fetch(`http://localhost:${process.env.PORT}/admin`);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('<title>VulkanoJS - Admin</title>');
    expect(body).not.toContain('og:title');
    expect(body).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});
