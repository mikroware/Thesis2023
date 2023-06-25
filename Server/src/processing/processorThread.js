import fs from 'fs'
import { mapObjIndexed, omit, pick } from 'ramda'
import WebSocket from 'ws'
import Pipeline from './Pipeline'

if(!process.send){
    throw new Error('processorThread should be ran as a child process through processorThreadStart');
}

let lastConfig = null;
let lastState = null;

const sockets = {};
function createSocket(data){
    // Check if socket already exists
    if(sockets[data.path]) return;

    console.log(`[MODULE] SourceInputSocket - create socket: ${data.path}`);

    sockets[data.path] = new WebSocket(data.path, {
        maxPayload: 104857600 * 100,
    });

    sockets[data.path].onmessage = (event) => {
        process.send({
            type: 'run',
        });

        run(lastConfig, lastState, {
            socketData: {
                [data.path]: event.data,
            },
        });
    };

    sockets[data.path].onclose = () => {
        delete sockets[data.path];
    };

    sockets[data.path].onerror = (err) => {
        console.log(`[MODULE] SourceInputSocket - error creating socket: ${err?.message}`);
    }
}

function closeSocket(data){
    console.log(`[MODULE] SourceInputSocket - close socket: ${data.path}`);

    sockets[data.path]?.close?.();
    delete sockets[data.path];
}

function dispatch(data, type = 'dispatch'){
    // Simply catch socket type here and handle internally
    if(type === 'socket'){
        createSocket(data);
    }else if(type === 'socket-close') {
        closeSocket(data);
    }else{
        process.send({
            type: type,
            data: data,
        });
    }
}

let running = false;
const runQueue = [];
function run(config, state, invokeDetails){
    const context = {
        config: config,
        invokeDetails: invokeDetails,
        forceRerun: false,
        changed: {
            source: {},
        },
    };

    if(running){
        runQueue.push(invokeDetails);
        return;
    }

    running = true;
    // TODO: Probably not re-create the Pipeline everytime, but just update the details
    (new Pipeline(config, state, dispatch)).run({}, context).then((args) => {
        process.send({
            type: 'done',
            data: Object.values(mapObjIndexed((num) => num ? (
                pick(['enabled', 'cache', 'size', 'dataStats'], num)
            ) : null, args.Pipeline1DataSet)),
        });
        running = false;

        const queueRun = runQueue.shift();
        if(queueRun){
            run(lastConfig, lastState, queueRun);
        }

        // Save data of latest run, omit all actual data
        fs.writeFile(`./metrics/lastRunData.json`, JSON.stringify({
            ...args,
            Pipeline1DataSet: mapObjIndexed((num) => (
                omit(['data'], num)
            ), args.Pipeline1DataSet),
        }), {
            encoding: 'utf8',
        }, () => {
            // File was written, do nothing
        });
    });
}

process.on('message', (msg) => {
    switch(msg.type){
        case 'run':
            lastConfig = msg.config;
            lastState = msg.state;

            run(msg.config, msg.state, msg.invokeDetails);

            break;
    }
});
