import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import api from './api'
import rootReducer from './rootReducer'
import loggerMiddleware from './loggerMiddleware'
import socketMiddleware from './socketMiddleware'

export default function configureStore(initialState = {}) {
    const middleware = [
        thunk,
        api,
        socketMiddleware,
        loggerMiddleware,
    ].filter(Boolean);

    const finalCreateStore = compose(
        applyMiddleware(...middleware),
        typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f
    )(createStore);

    return finalCreateStore(rootReducer, {
        ...initialState
    });
}
