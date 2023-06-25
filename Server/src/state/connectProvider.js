import shallowEqual from 'shallowequal'

/**
 * @callback onConnectChange
 * @param {object} mappedState
 */

/**
 * @callback connectFunction
 * @param {function} mapState
 * @param {onConnectChange} cb
 */

/**
 * @param {object} store
 * @returns {connectFunction}
 */
const connectProvider = (store) => (mapState, cb) => {
    let watchingState;

    const storeChange = () => {
        const newState = mapState(store.getState());

        // Shallow compare to decide if update should be called
        if(shallowEqual(watchingState, newState)) return;

        watchingState = newState;
        cb(newState);
    }

    return store.subscribe(storeChange);
}

export default connectProvider
