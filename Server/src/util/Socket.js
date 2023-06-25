import url from 'url'
import SocketClient from './SocketClient'
import WebSocket from 'ws'

class Socket {
    #io = null;
    #additionalEvents = [];
    #idNext = 1;

    /**
     * @type {Object<number, SocketClient>}
     */
    clients = {};

    /**
     * @type {ServerApplication}
     */
    app = null;

    constructor(server, app){
        this.app = app;

        this.#io = new WebSocket.Server({
            server,
            path: '/socket',
            clientTracking: true,
        });
        this.#io.on('connection', this.onConnection);
    }

    onConnection = (client, request) => {
        // If no client id (in case of WS), assign one
        if(!client.id){
            client.id = this.#idNext++;
        }

        // Determine which kind of client this is
        const params = url.parse(request.url, true).query;
        client.isGame = params['unity'] === 'true';
        client.isManager = params['manager'] === 'true';
        client.isVr = params['vr'] === 'true';
        client.subscribed = params['subscribe'] ? params['subscribe'].split(',') : [];

        console.log(`[SOCKET] Received connection, id: ${client.id}, type: ${this.clientType(client)} (total connected: ${this.connectionCount() + 1})`);

        // Create the client wrapper
        this.clients[client.id] = new SocketClient(this, client, this.#additionalEvents.filter(item => item.event !== 'connection'));

        // Send connection event internally
        this.#additionalEvents.filter(item => item.event === 'connection').forEach(item => {
            item.cb({}, this.clients[client.id]);
        });

        // Let the client know the dataset state
        const state = this.app.store.getState();
        const dataset = state.data.dataset;
        this.clients[client.id].sendEvent({
            type: 'init',
            isLoaded: dataset && dataset.filter(set => set && !set.cached).length === 0,
            dataset: dataset,
            visuals: state.data.visuals,
            properties: state.data.properties,
            filter: state.data.filter,
            config: state.config,
            options: state.options,
        });

        // Test emit, let everyone know there is a new connection
        this.sendToAll({
            type: 'clientConnected',
            connected: client.id,
            connectionCount: this.connectionCount(),
        });
    }

    onDisconnect = (client) => {
        delete this.clients[client.id];

        console.log(`[SOCKET] Client ${client.id} disconnected (connected: ${this.connectionCount()})`);

        this.sendToAll({
            type: 'clientDisconnected',
            client: client.id,
            disconnected: client.id,
            connectionCount: this.connectionCount(),
        });
    }

    /**
     *
     * @param {object} data
     * @param {(SocketClient|int)[]} except
     * @param {boolean} gameOnly
     * @param {undefined|string} [onlySubscribed]
     */
    sendToAll = (data, except = [], gameOnly = false, onlySubscribed = undefined) => {
        this.getClients().filter(client => {
            return (
                except.indexOf(client) === -1 && except.indexOf(client.id) === -1
            ) && (!gameOnly || client.isGame);
        }).filter(client => (
            !onlySubscribed || client.subscribed.includes(onlySubscribed)
        )).forEach(client => {
            client.sendEvent(data);
        });

        // this.io.emit(event || 'event', data);
    }

    /**
     *
     * @param {string} event
     * @param {SocketClientEventTypeCallback} cb
     */
    onClient = (event, cb) => {
        console.log(`[SOCKET] Additional event "${event}" registered for all clients.`);

        this.#additionalEvents.push({
            event: event,
            cb: cb,
        });

        if(event === 'connection') return;

        Object.values(this.clients).forEach(client => {
            client.client.on(event, cb);
        });
    }

    connectionCount = () => {
        return Object.keys(this.clients).length;
    }

    /**
     * @returns {SocketClient[]}
     */
    getClients = () => {
        return Object.values(this.clients);
    }

    clientType = (client) => {
        if(client.isGame) return 'game';
        if(client.isManager) return 'manager';

        return 'unknown';
    }

    close = (cb) => {
        this.#io.close(cb);
    }
}

export default Socket
