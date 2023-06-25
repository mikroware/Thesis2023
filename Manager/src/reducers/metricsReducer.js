import { equals, mergeDeepWith } from 'ramda'

function merger(oldState, newData){
    return mergeDeepWith((lObj, rObj) => {
        if(equals(lObj, rObj)) return lObj;

        // For arrays, we try to use the previous items
        if(Array.isArray(lObj) && Array.isArray(rObj)){
            return rObj.map((item, i) => (
                equals(item, lObj[i]) ? lObj[i] : item
            ));
        }

        return rObj;
    }, oldState, newData);
}

function metricsReducerFinal(state = {}, action){
    if(action.type === 'MERGE_METRICS'){
        return merger(state, action.metrics);
    }

    return state;
}

export const metricsReducer = {
    metrics: metricsReducerFinal,
}
