const BASE = '/api';

/**
 * Build the default request headers for API calls.
 * Additional headers passed in props take precedence over the defaults.
 */
function getHeaders(props = {}) {
  return {
    'Content-Type': 'application/json',
    ...(props.headers),
  };
}

/**
 * Send a JSON request to the API and return the `data` payload when available.
 *
 * @param {string} method - HTTP method to use.
 * @param {string} path - API path appended to the base endpoint.
 * @param {any} body - Request body to serialize as JSON.
 * @param {object} props - Optional request options.
 * @param {object} [props.headers] - Additional headers merged into the defaults.
 * @returns {Promise<any>} The parsed `data` field, an empty object, or `null`.
 */
async function request(method, path, body, props = {}) {

  const options = {
    method,
    headers: getHeaders(props)
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, options);

  if (!response.ok) {
    // const { status } = response;
    // if (status === 401 && !path.includes('/auth/')) {
    //   window.location.href = '/login/';
    //   throw new Error('Invalid token');
    // }
    return Promise.reject(response);
  }

  const json = await response.json().catch(() => null);
  return json ? (json.data || {}) : null;
}

/**
 * Shared API client helpers used across the client application.
 */
export default {

  /** Resolve multiple requests at once. */
  all: (requests) => Promise.all(requests),

  /** Perform a GET request. */
  get: (path, props) => request('GET', path, undefined, props),

  /** Perform a POST request. */
  post: (path, payload, props) => request('POST', path, payload, props),

  /** Perform a PUT request. */
  put: (path, payload, props) => request('PUT', path, payload, props),

  /** Perform a PATCH request. */
  patch: (path, payload, props) => request('PATCH', path, payload, props),

  /** Perform a DELETE request and normalize empty responses to `true`. */
  delete: (path, props) => request('DELETE', path, undefined, props).then((d) => d || true)

};
