import fs from 'fs'
import path from 'path'
import { Server } from 'http'
import { applyMiddleware, createStore, Store } from 'redux'
import reduxThunk from 'redux-thunk'
import api from '../api/api'
import defaultConfig from '../config/defaultConfig'
import Processor from '../processing/Processor'
import connectProvider from '../state/connectProvider'
import loggerMiddleware from '../state/loggerMiddleware'
import rootReducer from '../state/rootReducer'
import StateClients from '../state/StateClients'
import StateConfig, { stateConfigActionReplace } from '../state/StateConfig'
import StateData from '../state/StateData'
import StateMetrics from '../state/StateMetrics'
import StateOptions from '../state/StateOptions'
import StateSystem, { stateSystemActionReady } from '../state/StateSystem'
import Socket from './Socket'

// TODO: make Application class I guess
// Can handle the whole application
// Read the config file and sets up the environment
//  - setting up the environment is running the pipeline with the default settings
//  - need a pipeline with different steps and hooks, passing the data on
// Send progress information to the clients all the time
// Send for example filter information (just ids only, so client knows what to hide/change)

class ServerApplication {
    /**
     * @type Server
     */
    #server = null;

    /**
     * @type Socket
     */
    socket = null;

    /**
     * @type Store
     */
    store = null;

    /**
     * @type connectFunction
     */
    connect = (mapState, onChange) => {};

    /**
     * @type Processor
     */
    processor = null;

    /**
     * @type ConfigSchema
     */
    config = null;

    /**
     * @type {string|null}
     */
    configFile = null;

    /**
     * @type State[]
     */
    states = [];

    constructor(configFile = 'config.json'){
        this.configFile = configFile;

        // Create the store
        this.store = createStore(
            rootReducer, // TODO: Move this.state.push above here and create rootReducer from all state reducers?
            undefined,
            applyMiddleware(reduxThunk, loggerMiddleware)
        );
        this.connect = connectProvider(this.store);

        // Create a server with api and socket
        this.#server = new Server(api(this));
        this.socket = new Socket(this.#server, this);

        // Add a test socket server for real time data
        // TODO: implement this: https://github.com/websockets/ws#multiple-servers-sharing-a-single-https-server
        // socketTestServer(server);

        // Start listening
        this.#server.listen(2345, '0.0.0.0');

        // Init the state classes
        this.states.push(new StateMetrics(this));
        this.states.push(new StateSystem(this));
        this.states.push(new StateData(this));
        this.states.push(new StateConfig(this));
        this.states.push(new StateOptions(this));
        this.states.push(new StateClients(this));

        // Prepare the processor
        this.processor = new Processor(this);

        // Finally, load the config which should start the whole system
        this.loadConfig(true);
        this.watchConfig();

        // Put system in ready state (does not mean processing is done but systems are started)
        this.store.dispatch(stateSystemActionReady());
    }

    closeServer(...args){
        this.watcher?.close?.();
        this.processor?.process?.kill?.();

        this.socket.close(() => {
            console.log('======= CLOSED SOCKET =======');
            this.#server.close(...args);
        });
    }

    loadConfig(firstRun = false){
        fs.promises.readFile(this.configFile).then((data) => {
            try {
                data = JSON.parse(data.toString());
            } catch(e){
                // TODO: Save error: config not parseable
                return;
            }

            this.config = defaultConfig(data);

            if(this.config.application?.cleanCacheOnStart && firstRun){
                console.log('[APPLICATION] Deleting cache on start due to config setting');

                fs.readdir('./cache', (err, files) => {
                    if(err) return console.error('Cannot delete cache', err);

                    files.forEach(file => {
                        if (file === '.gitignore') return;
                        fs.unlinkSync(path.join('./cache', file));
                    });
                });

                console.log('[APPLICATION] Done with deleting cache');
            }

            this.config.loaded = true;
            this.store.dispatch(stateConfigActionReplace(this.config));
        }, (err) => {
            if(err){
                if(err.code === 'ENOENT'){
                    // TODO: Save error: config does not exist
                    console.log('NOT FOUND')
                    return;
                }

                // TODO: Save error: rest
                console.log('REST', err);
            }
        });
    }

    fsWatchWait = false;
    watchConfig = () => {
        this.watcher = fs.watch(this.configFile, (event, filename) => {
            if(filename && event === 'change'){
                if(this.fsWatchWait) return;

                this.fsWatchWait = setTimeout(() => {
                    this.fsWatchWait = false;
                }, 100);

                this.loadConfig();
            }
        });
    }

    saveConfig = (config) => {
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 4));
    }
}

export default ServerApplication
