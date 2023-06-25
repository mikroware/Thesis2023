import { mapObjIndexed } from 'ramda'

/**
 * @type {Socket}
 */
let instance = null;

class Socket {
    static getInstance(url){
        if(!instance && url){
            instance = new Socket(url);
        }

        else if(url && url !== instance.url){
            instance.changeUrl(url);
        }

        return instance;
    }

    /**
     * @type {WebSocket}
     */
    socket = null;

    /**
     * @type {string|null}
     */
    url = null;

    noReconnect = false;
    attemptCount = 0;
    listeners = {};

    localEvents = {
        reconnecting: 'reconnecting',
        connecting: 'connecting',
    };

    constructor(url){
        this.url = url;
        this.connect();
    }

    changeUrl = (url) => {
        if(this.socket){
            this.socket.close(3001, 'URL changed');
        }

        this.url = url;
        this.connect();

        // TODO: perhaps don't close the socket, but just change the url?
        //  (in that case, don't double add listeners)
    }

    disconnect = () => {
        clearTimeout(this.reconnectTimer);
        this.emitLocal(this.localEvents.reconnecting, false);

        this.noReconnect = true;
        this.socket.close(3002, 'Manual disconnect');
    }

    connect = () => {
        if(!this.url) return console.log('Trying to connect to the socket server without url.');

        this.emitLocal(this.localEvents.connecting, true);

        this.noReconnect = false;
        this.attemptCount += 1;
        this.socket = new WebSocket(`ws://${this.url}/socket?manager=true&subscribe=metrics`)

        this.socket.addEventListener('open', this.onConnect);
        this.socket.addEventListener('close', this.onDisconnect);
        this.socket.addEventListener('message', this.onMessage);

        this.connectAllListeners();
    }

    onMessage = (message) => {
        // console.log('Data from event received: ', JSON.parse(message.data));
    }

    onConnect = () => {
        this.emitLocal(this.localEvents.connecting, false);

        this.attemptCount = 0;
    }

    onDisconnect = () => {
        this.emitLocal(this.localEvents.connecting, false);

        if(this.noReconnect) return;
        if(this.attemptCount > 10) return;

        this.emitLocal(this.localEvents.reconnecting, true);

        this.reconnectTimer = setTimeout(() => {
            this.connect();
            this.emitLocal(this.localEvents.reconnecting, false);
        }, 2000);
    }

    on = (event, cb) => {
        // TODO: change to internal forward calling instead of linking it to the socket
        this.listeners[event] = [
            ...this.listeners[event] || [],
            cb,
        ];

        this.socket.addEventListener(event, cb);
    }

    connectAllListeners = () => {
        // TODO: not needed in case of internal forward calling as mentioned above
        mapObjIndexed((list, event) => {
            list.forEach(cb => {
                this.socket.addEventListener(event, cb);
            });
        }, this.listeners);
    }

    emitLocal = (event, data) => {
        const listeners = this.listeners[event];

        (listeners || []).forEach(cb => {
            cb(data);
        });
    }

    emit = (event, data) => {
        this.socket.emit(event, data);
    }
}

export default Socket
