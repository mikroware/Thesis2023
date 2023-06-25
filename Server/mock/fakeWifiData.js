import WebSocket from 'ws'

const wss = new WebSocket.Server({
    port: 8001,
    clientTracking: true,
    maxPayload: 104857600 * 100,
});

function sendDataToClients(data){
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
            // client.send(JSON.stringify(data.map(item => item.meta.status)));
        }
    });
}

const data = [];

function generateCampusCords(){
    // 52.002768369425574,4.370511403158703
    return [
        52.002 + ((Math.random() - 0.5) / 100),
        4.371 + ((Math.random() - 0.5) / 100),
    ];
}

function generatePoints(amount){
    for(let i = 0; i < amount; i++){
        data[i] = {
            cords: generateCampusCords(),
            bias: Math.random(),
            meta: {
                connected: 0,
                status: 0,
                lastStatusChange: Math.floor(new Date().getTime() / 1000),
            },
        };
    }
}

function isRandomChance(factor){
    return Math.random() < factor;
}

function updateDataItem(item){
    if(isRandomChance(0.8)) return;

    const diff = ((Math.random() - 0.5) * item.bias * 100);

    item.meta.connected += diff < 0 ? Math.floor(diff) : Math.ceil(diff);
    item.meta.connected = Math.max(Math.min(item.meta.connected, 150), 0); // Clamp

    if(isRandomChance(0.2)){
        // Reset the bias sometimes
        // Small items get extra bias to grow quick till the next reset
        item.bias = Math.random() + (item.meta.connected < 20 ? 0.4 : 0);
    }

    // Status may change every 30 seconds
    const currentTime = Math.floor(new Date().getTime() / 1000);
    if(item.meta.lastStatusChange < (currentTime - 30) && isRandomChance(0.2)){
        item.meta.lastStatusChange = currentTime;

        if(isRandomChance(0.5)){
            item.meta.status = 0;
        }else{
            item.meta.status = Math.floor(Math.random() * 4);
        }
    }
}

function run(){
    data.forEach((val) => updateDataItem(val));

    sendDataToClients(data);

    setTimeout(run, 5000);
}

generatePoints(300);
run();
