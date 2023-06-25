import { getApiTypeSuccess } from '../helpers/apiTypes'

function systemReducerFinal(state = {}, action){
    // TODO: find a cleaner way to handle all system changes
    // Perhaps some special key (and in case of API actions use a success thunk to create the side effect)

    if(action.type === 'REPLACE_SYSTEM'){
        return {
            ...action.system,
        }
    }

    if(action.type === 'UPDATE_SYSTEM'){
        return {
            ...state,
            ...action.system,
        }
    }

    if(action.type === getApiTypeSuccess('SYSTEM_STATE')){
        return {
            ...state,
            ...action.response.result.system,
        }
    }

    return state;
}

export const systemReducer = {
    system: systemReducerFinal,
}
