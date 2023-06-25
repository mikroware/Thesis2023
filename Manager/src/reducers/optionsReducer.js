
export const optionsActionUpdate = (options) => ({
    type: 'UPDATE_OPTIONS',
    options: options,
});

function optionsReducerFinal(state = {}, action){
    if(action.type === 'UPDATE_OPTIONS'){
        return {
            ...state,
            ...action.options,
        }
    }

    return state;
}

export const optionsReducer = {
    options: optionsReducerFinal,
}
