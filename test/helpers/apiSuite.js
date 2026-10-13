import { describe, it, expect, vi, afterEach } from 'vitest';

// Shared cases for each entrypoint's Api.js (frontend/<entrypoint>/Api.js).
// fetch is stubbed — never hits the network.
function reply(status, body, statusText = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body))
  };
}

export default function apiSuite(name, Api) {
  describe(`${name} Api.js`, () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('resolves the `data` field of the res.vsr envelope, prefixed with /api', async () => {
      const fetchMock = vi.fn().mockResolvedValue(reply(200, { success: true, data: { id: 1 } }));
      vi.stubGlobal('fetch', fetchMock);

      await expect(Api.get('/items/1')).resolves.toEqual({ id: 1 });
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/items/1',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('DELETE with an empty body (204) resolves to true', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(204)));
      await expect(Api.delete('/items/1')).resolves.toBe(true);
    });

    it('non-2xx rejects with the backend message (error.detail) and status', async () => {
      const body = {
        success: false,
        statusCode: 401,
        error: { errorCode: '001', errorName: 'Unauthorized', detail: 'Invalid email or password' }
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(401, body, 'Unauthorized')));

      const err = await Api.post('/auth/login', {}).catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err).toMatchObject({
        message: 'Invalid email or password',
        status: 401,
        code: '001',
        name: 'Unauthorized',
        data: body
      });
    });

    it('non-2xx without an envelope falls back to statusText', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(502, undefined, 'Bad Gateway')));
      await expect(Api.get('/x')).rejects.toMatchObject({
        message: 'Bad Gateway',
        status: 502,
        data: null
      });
    });

    it('network failure rejects with status 0', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      await expect(Api.get('/x')).rejects.toMatchObject({
        message: 'Network error',
        status: 0,
        name: 'NetworkError'
      });
    });
  });
}
