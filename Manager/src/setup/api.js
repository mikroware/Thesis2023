import fetch from 'isomorphic-fetch'
import { createApiTypes } from '../helpers/apiTypes'

let API_ROOT = process.env.API_URL || '/api/';

export function getApiUrl(path){
    return API_ROOT + path;
}

function callApi(endpoint, schema, method = 'GET', body = null){
    const fullUrl = API_ROOT + endpoint;
    const options = {
        method: method && method.toUpperCase(),
        headers: {},
    };

    if(body){
        if (options.method === undefined || options.method === 'GET') {
            options.method = 'POST';
        }

        options.body = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    return fetch(fullUrl, options)
        .then(response => {
            // Try to parse in json
            return response.json()
                .then(json => ({ json, response }))
                .catch(error => {
                    return ({ json: null, response })
                });
        })
        .then(({ json, response }) => {
            // Response checks
            if (!response.ok) {
                return Promise.reject({
                    ...json,
                    errorCode: response.status
                });
            }

            if(!json) return {};

            // Create final data
            return {
                result: json,
            };
        })
        .catch((error) => {
            return Promise.reject(error);
        });
}

export const CALL_API = Symbol('Call API');

export default store => next => action => {
    // Get the API request data, otherwise forward
    const callAPI = action[CALL_API];
    if (typeof callAPI === 'undefined') {
        return next(action)
    }

    const { endpoint, schema, type, method, body } = callAPI;

    function nextWith(data) {
        const finalAction = {...action, ...data};
        delete finalAction[CALL_API];
        return finalAction;
    }

    if(!type){
        throw Error(`API call to endpoint "${endpoint}" should have a "type" defined in its action object`);
    }

    const [ requestType, successType, failureType ] = createApiTypes(type);
    next(nextWith({ type: requestType }));

    API_ROOT = `//${store.getState().localConfig.serverUrl}/`;

    return callApi(endpoint, schema, method, body).then(
        response => next(nextWith({
            response,
            type: successType
        })),
        error => {
            return next(nextWith({
                ...error,
                type: failureType,
                message: error.message || error.msg || (
                    error.errorCode === 500 ? 'Internal server error.' : 'Something went wrong...'
                ),
                errorCode: error.errorCode,
            }))
        });
}
