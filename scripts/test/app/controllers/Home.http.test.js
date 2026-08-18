import { describe, it, expect } from 'vitest';
import { waitForReady } from '../../helpers/bootstrap.js';

describe('GET /', () => {
  it('renders the home view with the overridden SEO title and the default description/image', async () => {
    await waitForReady();

    const res = await fetch(`http://localhost:${process.env.PORT}/`);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(body).toContain('<title>Vulkano App — Home</title>');
    expect(body).toContain('content="Full-stack app built with the Vulkano Framework."');
    expect(body).toContain('content="/favicon.png"');
  });
});
