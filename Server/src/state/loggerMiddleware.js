import { mapObjIndexed, omit } from 'ramda'

function clean(object){
    return mapObjIndexed((val, key) => {
        if(Array.isArray(val) && val.length > 5){
            return `Array(${val.length})`;
        }

        if(typeof val === 'object' && val !== null){
            if(Object.keys(val).length > 8){
                return `Object(${Object.keys(val).length})`;
            }

            return clean(val);
        }

        return val;
    }, object);
}

const loggerMiddleware = () => next => action => {
    // These come from clients and can be a lot
    if(action.type.indexOf('METRICS_') === 0) return next(action);

    const info = clean(omit(['type'], action));

    console.log(`[ACTION] ${action.type}`, info);

    return next(action);
};

export default loggerMiddleware
