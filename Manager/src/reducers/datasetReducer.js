
function datasetReducerFinal(state = {}, action){
    if(action.type === 'UPDATE_DATASET'){
        return {
            ...state,
            ...action.dataset,
        }
    }

    return state;
}

export const datasetReducer = {
    dataset: datasetReducerFinal,
}
