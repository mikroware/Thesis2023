import WebSocket from 'ws'

function generateData(){
    // TODO: generate some data

    return {
        testData: true,
    };
}

function socketTestServer(server, sendEverySeconds = 60){
    const socket = new WebSocket.Server({
        server,
        path: '/test/socket',
        clientTracking: true,
    }, (d) => {
        console.log('HI what is this??', d)
    });

    function sendTestData(){
        const data = JSON.stringify(generateData());
        console.log('Will send', data)
        console.log('Clients', socket.clients)

        socket.clients.forEach(client => {
            client.send(data);
        });

        setTimeout(sendTestData, 1000 * sendEverySeconds);
    }

    sendTestData();
}

export default socketTestServer
