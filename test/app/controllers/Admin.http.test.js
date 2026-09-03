import { describe, it, expect } from 'vitest';
import { waitForReady } from '../../helpers/bootstrap.js';

describe('GET /admin', () => {
  it('renders the admin view with the overridden title and noindex, bypassing the site SEO default', async () => {
    await waitForReady();

    const res = await fetch(`http://localhost:${process.env.PORT}/admin`);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('<title>Vulkano App — Admin</title>');
    expect(body).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});
