const fetch = require('node-fetch');



const getHeaders = (authorizationToken = '') => {
  return {
    'Content-Type': 'application/json',
    'authorization': authorizationToken || '',
    'Accept': 'application/json',
  };
};

const paramsToUriQuery = (params) => {
  if (params === null) { return ''; }
  return '?' + Object.keys(params)
    .map((key) => `${key}=${params[key] instanceof Array ? params[key].join(',') : params[key]}`)
    .join('&');
};

const parseResponse = (response) => {
  return new Promise(async (resolve, reject) => {

    const content = await response.json(); // Parsing form data
    if (content.error) {
      reject(content.error);
      return;
    }
    // Response not ok but no server error
    if (!response.ok) {
      console.error('Server Error', response);
      reject('Error on the server');
      return;
    }
    resolve(content);
  });
};


module.exports = {


  /**
   *  ----------------------- API CALLS ---------------------
   */

  /*
   * Method POST
   * @param url string
   * @param params any
   * @param token_required Required security token
   */
  post: async (url, params, authorizationToken = '') => {
    // console.info('POST ', url, JSON.stringify(params));
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(authorizationToken),
      body: JSON.stringify(params),
    });

    return await parseResponse(response);
  },

  /*
   * Method PUT
   * @param url string
   * @param params any
   * @param token_required Required security token
   */
  put: async (url, id, params, authorizationToken = '') => {
    // console.info('PUT ', url, params);
    const response = await fetch(url + '/' + id, {
      method: 'PUT',
      headers: getHeaders(authorizationToken),
      body: JSON.stringify(params),
    });

    return await parseResponse(response);
  },


  /*
    * Method GET
    * @param url string
    * @param params any
    * @param token_required Required security token
    */
  get: async (url, params, authorizationToken = '') => {
    // console.info('GET ', url + paramsToUriQuery(params));
    const response = await fetch(url + paramsToUriQuery(params), {
      method: 'GET',
      headers: getHeaders(authorizationToken),
    });

    return await parseResponse(response);
  },


}
