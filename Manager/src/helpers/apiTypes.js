export function createApiTypes(type){
    type = type.toUpperCase();

    return [
        type + '_REQUEST',
        type + '_SUCCESS',
        type + '_FAILURE'
    ];
}

export function getApiTypeSuccess(type){
    return type.toUpperCase() + '_SUCCESS';
}

export function getApiTypeLoading(type){
    return type.toUpperCase() + '_REQUEST';
}

export function getApiTypeFailure(type){
    return type.toUpperCase() + '_FAILURE';
}
