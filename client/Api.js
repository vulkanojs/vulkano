const BASE = '/api';

function getHeaders(props = {}) {
  return {
    'Content-Type': 'application/json',
    ...(props.headers || {})
  };
}

async function request(method, path, body, props = {}) {
  const options = {
    method,
    headers: getHeaders(props),
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE}${path}`, options);

  // Interceptor: handle error responses
  if (!response.ok) {
    // const { status } = response;
    // const url = `${BASE}${path}`;
    //
    // if (status === 401 && !url.includes('/auth/')) {
    //   window.location.href = '/login/';
    //   throw new Error('Invalid token');
    // }

    return Promise.reject(response);
  }

  const json = await response.json().catch(() => null);
  return json ? (json.data || {}) : null;
}

// API.js
export default {

  all(requests) {
    return Promise.all(requests);
  },

  get(path, props) {
    return request('GET', path, undefined, props);
  },

  post(path, payload, props) {
    return request('POST', path, payload, props);
  },

  put(path, payload, props) {
    return request('PUT', path, payload, props);
  },

  patch(path, payload, props) {
    return request('PATCH', path, payload, props);
  },

  delete(path, props) {
    return request('DELETE', path, undefined, props).then((data) => data || true);
  }

};
