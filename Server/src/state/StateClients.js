import State from './State'

export const stateClientsActionUpdate = (client) => ({
    type: 'CLIENT_UPDATE',
    client: client,
});

class StateClients extends State {
    constructor(app){
        super(app);

        // this.app.connect((state) => ({
        //     config: state.config,
        // }), this.storeChange);

        this.app.socket.onClient('clientSync', (data, socketClient) => {
            // TODO: collect from multiple clients and send at once
            socketClient.sendToOthers({
                type: 'clientSync',
                client: socketClient.id,
                meta: data,
            }, true);

            // TODO: update local client state,
            //  or use a separate handler to avoid constant state changes?
            //  Aka, wait/collect for about 500ms and only after that update the state
        });

        this.app.socket.onClient('mapSync', (data, socketClient) => {
            socketClient.sendToOthers({
                type: 'mapSync',
                client: socketClient.id,
                meta: data,
            }, true);

            // TODO: maybe later sync this to the state for data handling
        });
    }
}

export default StateClients

const clientsReducer = (state = {}, action) => {
    if(action.type === 'CLIENT_UPDATE' && action.client){
        const id = action.client.id;
        state = {
            ...state.clients,
            [id]: {
                ...state.clients[id],
                ...action.client,
            },
        };
    }

    return state;
}

export const stateClientsReducer = {
    clients: clientsReducer,
};
