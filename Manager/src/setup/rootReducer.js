import { combineReducers } from 'redux'
import formDataReducer from '../modules/formData/formDataReducer'
import { metricsReducer } from '../reducers/metricsReducer'
import { systemReducer } from '../reducers/systemReducer'
import { datasetReducer } from '../reducers/datasetReducer'
import { configReducer } from '../reducers/configReducer'
import { localConfigReducer } from '../reducers/localConfigReducer'
import { optionsReducer } from '../reducers/optionsReducer'

let reducers = {
    ...formDataReducer,

    ...systemReducer,
    ...datasetReducer,
    ...configReducer,
    ...localConfigReducer,
    ...optionsReducer,
    ...metricsReducer,
};

export default combineReducers(reducers)
