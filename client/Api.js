import axios from 'axios';
import { shim } from 'promise.prototype.finally';

// Enable finally promisse into axios ...finally( () => { })
shim();

const domainBase = '/api';

axios.defaults.baseURL = domainBase;

// Interceptor after send request
axios.interceptors.response.use( (res) => res, (error) => {

  const {
    response
  } = error;

  // const {
  //   status
  // } = response;

  // const {
  //   url
  // } = response.config;

  // if ( (status) === 401 && url.indexOf('/auth/') < 0 ) {
  //   window.location.href = '/login/';
  //   throw new Error('Invalid token');
  // }

  return Promise.reject(response);

});

// API.js
export default {

  all(requests) {

    return axios.all(requests)
      .then(

        axios.spread( (...responses) => {

          return responses;

        })

      );

  },

  get(path, props) {

    return axios
      .get(path, props || {})
      .then( (response) => {
        const {
          data
        } = response || {};
        return data ? (data.data || {}) : null;
      });

  },

  post(path, payload, props) {

    return axios
      .post(path, payload, props || {})
      .then( (response) => {
        const {
          data
        } = response || {};
        return data ? (data.data || {}) : null;
      });

  },

  put(path, payload, props) {

    return axios
      .put(path, payload, props || {})
      .then( (response) => {
        const {
          data
        } = response || {};
        return data ? (data.data || {}) : null;
      });

  },

  delete(path, props) {

    return axios
      .delete(path, props || {})
      .then( (response) => {
        const {
          data
        } = response || {};
        return data ? (data.data || {}) : true;
      });

  }

};
