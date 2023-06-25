import { mapObjIndexed } from 'ramda'
import { combineReducers } from 'redux'
import { stateMetricsReducer } from './StateMetrics'
import { stateSystemReducer } from './StateSystem'
import { stateConfigReducer } from './StateConfig'
import { stateDataReducer } from './StateData'
import { stateOptionsReducer } from './StateOptions'

const reducers = {
    ...stateMetricsReducer,
    ...stateSystemReducer,
    ...stateConfigReducer,
    ...stateDataReducer,
    ...stateOptionsReducer,
};

const rootReducer = combineReducers(reducers);

export const defaultState = mapObjIndexed(() => ({}), reducers);
export default rootReducer
