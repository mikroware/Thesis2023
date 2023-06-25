import ws from 'ws'

const totalClients = 1;

function createClient(){
    const url = '10.0.0.113:2345';
    const socket = new ws(`ws://${url}/socket?unity=true`);

    socket.on('open', () => {});
    socket.on('close', () => {});
    socket.on('message', () => {});

    return socket;
}

/**
 * @type {WebSocket[]}
 */
const sockets = [];

for(let i = 0; i < totalClients; i++){
    sockets.push(createClient());
}


process.on('SIGINT', () => {
    console.log("======= EXITING =======");

    const closing = sockets.map(socket => {
        return new Promise((resolve) => {
            socket.close();
            resolve();
        });
    });

    Promise.all(closing).then(() => {
        console.log('Closed sockets');
        process.exit(0);
    });
});
