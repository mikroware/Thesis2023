
function configReducerFinal(state = {}, action){
    if(action.type === 'REPLACE_CONFIG'){
        return {
            ...action.config,
        }
    }

    return state;
}

export const configReducer = {
    config: configReducerFinal,
}
