import path from 'path'
import cp, { ChildProcess } from 'child_process'
import { stateSystemActionProcessing } from '../state/StateSystem'

class Processor {
    /**
     * @type {ServerApplication}
     */
    app = null;

    /**
     * @type {ChildProcess}
     */
    process = null;

    /**
     * @type {boolean}
     */
    workerStarted = false;

    /**
     * @type {PipelineContextInvokeDetails[]}
     */
    runQueue = [];

    constructor(app) {
        this.app = app;

        // Subscribe to config changes
        this.app.connect((state) => ({
            config: state.config,
        }), this.storeChange);

        // Create the worker
        this.createWorker();
    }

    storeChange = ({ config }) => {
        this.log('[PROCESSOR] Config changed, running again');
        this.run();
    };

    createWorker() {
        this.process = cp.fork(path.join(__dirname, 'processorThreadStart.js'));

        this.process.on('message', this.workerMessage);
        this.process.on('error', this.workerError);

        this.process.on('exit', (code, signal) => {
            this.log(`[PROCESSOR] Pipeline worker exited with code ${code} and signal ${signal}, restarting`);
            this.workerStarted = false;
            // TODO: for now don't restart a new worked, as it prevents fully exiting
            // this.createWorker();
        });
    }

    workerMessage = (msg) => {
        switch(msg.type){
            case 'dispatch':
                this.app.store.dispatch(msg.data);
                break;
            case 'done':
                this.done(msg.data);
                break;
            case 'run':
                // The pipeline started itself (socket, new data)
                this.app.store.dispatch(stateSystemActionProcessing(true, true));
                this.log('[PROCESSOR] Pipeline worker running (self-called from pipeline)');
                break;
        }
    };

    workerError = (err) => {
        console.error('[PROCESSOR] Pipeline worker error');
        console.error(err);
    };

    /**
     * @param {PipelineContextInvokeDetails} contextInvokeDetails
     * @param {boolean} [fromQueue]
     */
    run = (contextInvokeDetails, fromQueue = false) => {
        // TODO: Is this the best way? Can also get it from the state
        const config = this.app.config;
        if(!config || !config.loaded) return;

        const state = this.app.store.getState();

        if(state.system.processing){
            if(fromQueue){
                // If it comes from the queue and can still not start, put back in the front
                this.runQueue.unshift(contextInvokeDetails);
            }else{
                // Otherwise, push it to end of the queue
                this.runQueue.push(contextInvokeDetails);
            }

            return this.log('[PROCESSOR] Already processing, run will be queued for later');
        }

        this.app.store.dispatch(stateSystemActionProcessing(true));

        this.log('[PROCESSOR] Pipeline worker running');
        this.process.send({
            type: 'run',
            config: config,
            state: state,
            invokeDetails: contextInvokeDetails,
        });
    };

    done = (data) => {
        this.app.store.dispatch(stateSystemActionProcessing(false, false, data));
        this.log('[PROCESSOR] Pipeline worker finished');
        this.log('================================================================================');

        // Run the oldest queued run conversation
        const delayedRun = this.runQueue.shift();
        if(delayedRun){
            this.log('[PROCESSOR] Re-trying queued run');
            this.run(delayedRun);
        }
    };

    log = (msg) => {
        if(this.app.config && this.app.config.verbose){
            console.log(msg);
        }
    }
}

export default Processor
