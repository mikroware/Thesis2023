
function localConfigReducerFinal(state = {}, action){
    if(action.type === 'UPDATE_LOCAL_CONFIG'){
        return {
            ...state,
            ...action.localConfig,
        }
    }

    return state;
}

export const localConfigReducer = {
    localConfig: localConfigReducerFinal,
}
