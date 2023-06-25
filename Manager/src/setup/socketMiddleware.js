import Socket from '../services/Socket'

export const CALL_SOCKET = Symbol('Call SOCKET');

/**
 *
 * @param store {Store}
 * @returns {function(*): function(...[*]=)}
 */
const socketMiddleware = store => next => action => {
    // Get the SOCKET request data, otherwise forward
    const callSOCKET = action[CALL_SOCKET];
    if(typeof callSOCKET === 'undefined'){
        return next(action);
    }

    const socket = Socket.getInstance(store.getState().localConfig.serverUrl);

    const { event, data } = callSOCKET;

    if(!event){
        throw Error('Socket call should have an "event" field.');
    }

    socket.emit(event, data, (ackData) => {
        // TODO: somehow use this to finish call?? E.g. make it as API
        console.log('ACK', ackData);
    });

    // TODO: dunno what to return here yet...
    // Still need to think off how to structure this whole saving through socket thing
    return next({
        type: 'SOCKET_DONE',
    });
};

export default socketMiddleware
