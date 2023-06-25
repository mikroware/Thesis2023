class SocketClient {
    static nativeEvents = ['message', 'close'];

    /**
     * @type Socket
     */
    #socket = null;
    client = null;

    id = null;
    isGame = false;
    isManager = false;

    /**
     * @type {string[]}
     */
    subscribed = [];

    #typeEvents = {};

    constructor(socket, client, additionalEvents = []){
        this.#socket = socket;
        this.client = client;

        this.id = client.id;
        this.isGame = client.isGame;
        this.isManager = client.isManager;
        this.isVr = client.isVr;
        this.subscribed = client.subscribed;

        this.on('message', this.onMessage);
        // client.on('disconnect', this.onDisconnect); // Socket.io
        this.on('close', this.onDisconnect); // WS

        additionalEvents.forEach((item) => {
            this.on(item.event, item.cb);
        });

        console.log(`[SOCKET CLIENT] Registered events for ${client.id}`, client.eventNames());
    }

    /**
     *
     * @callback SocketClientEventTypeCallback
     * @param {object} data
     * @param {SocketClient} client
     */

    /**
     *
     * @param {string} event
     * @param {SocketClientEventTypeCallback} cb
     */
    on(event, cb){
        // Native event, link directly to the socket
        if(SocketClient.nativeEvents.indexOf(event) > -1){
            this.client.on(event, cb);
            return;
        }

        this.#typeEvents[event] = [
            ...this.#typeEvents[event] || [],
            cb,
        ];
    }

    onMessage = (json) => {
        // console.log(`[SOCKET CLIENT] Received message from client ${this.client.id}, json:`, json);

        const data = JSON.parse(json);
        if(!data.type) return;

        // Call all type event callbacks for this type
        (this.#typeEvents[data.type] || [])
            .forEach(cb => cb(data, this))
    }

    onDisconnect = () => {
        console.log(`[SOCKET CLIENT] Disconnect from ${this.client.id}`);

        this.#socket.onDisconnect(this.client);
    }

    sendEvent = (data) => {
        // this.client.emit('event', data);
        this.client.send(JSON.stringify(data));
    }

    sendToOthers = (data, gameOnly = false) => {
        this.#socket.sendToAll(data, [this], gameOnly);
    }
}

export default SocketClient
