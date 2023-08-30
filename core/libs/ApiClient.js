const http = require('http');
const https = require('https');
const axios = require('axios');

module.exports = {

  /**
   * Method to make a GET request
   *
   * @param {String} url
   * @param {Object} props { headers }
   * @returns {Promise}
   */
  get(url, props) {

    return this.send({
      url,
      ...props,
      method: 'GET'
    });

  },

  /**
   * Method to make a POST request
   *
   * @param {String} url
   * @param {Object} body
   * @param {Object} props { headers }
   * @returns {Promise}
   */
  post(url, body, props) {

    return this.send({
      url,
      body,
      ...props,
      method: 'POST'
    });

  },

  /**
   * Method to make a PUT request
   *
   * @param {String} url
   * @param {Object} body
   * @param {Object} props { headers }
   * @returns {Promise}
   */
  put(url, body, props) {

    return this.send({
      url,
      body,
      ...props,
      method: 'PUT'
    });

  },

  /**
   * Method to make a DELETE request
   *
   * @param {String} url
   * @param {Object} body
   * @param {Object} props { headers }
   * @returns {Promise}
   */
  delete(url, props) {

    return this.send({
      url,
      ...props,
      method: 'DELETE'
    });

  },

  /**
   * Method to send a request
   *
   * @param {Object} props
   * @returns {Promise}
   */
  send(props) {

    const {
      url,
      body,
      method,
      headers
    } = typeof props === 'string'
      ? { path: props, method: 'get' }
      : (props || {});

    const optHeaders = {};

    const options = {
      url,
      method: (method || 'GET').toLowerCase(),
      headers: Object.assign(headers || {}, optHeaders),
      httpAgent: new http.Agent({ keepAlive: true, rejectUnauthorized: false }),
      httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false }),
      responseType: 'json'
    };

    if (body) {
      // convert body into just one line of json.
      options.data = JSON.parse(JSON.stringify(body || {}));
    }

    // force header 'application/json' if the petition uses POST
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };

    // console.log(options);

    return axios(options)
      .then( (response) => {

        const {
          data
        } = response;

        return data || {};

      })
      .catch( (err) => {

        const {
          response
        } = err || {};

        const {
          data: errorData,
          status: statusCode
        } = response || {};

        console.log('');
        console.log('');
        console.log('---------------------');
        console.log('Request Debug');
        console.log('---------------------');

        if (options.baseURL) {
          console.log(`${options.method} ${options.baseURL}/${options.url}`);
        } else {
          console.log(`${options.method} ${options.url}`);
        }

        const {
          msg,
          message: errorMessage,
          error: errorMessage2
        } = errorData || {};

        const message = msg || errorMessage || errorMessage2 || 'Unable to connect to the Request Service';

        return VSError.reject(message, statusCode || 500);

      });

  }

};
