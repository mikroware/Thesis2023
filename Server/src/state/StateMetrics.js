import fs from 'fs'
import moment from 'moment'
import State from './State'

export const stateMetricsActionPipeline = (pipeline, runtime) => ({
    type: 'PIPELINE_STAT',
    pipeline: pipeline,
    runtime: runtime,
});

const stateMetricsActionClients = (clients) => ({
    type: 'METRICS_CLIENTS',
    clients: clients,
});

const stateMetricsActionFps = (client, fps) => ({
    type: 'METRICS_FPS',
    client: client,
    fps: fps,
});

const stateMetricsActionFile = (client, data) => ({
    type: 'METRICS_FILE',
    client: client,
    data: data,
});

const stateMetricsActionVisuals = (client, data) => ({
    type: 'METRICS_VISUALS',
    client: client,
    data: data,
});

const metricsPath = './metrics';
const filename = `session_${moment().format('YYYY-MM-DD_HH-mm')}.json`;
if(!fs.existsSync(metricsPath)){
    fs.mkdirSync(metricsPath);
}

const defaultState = {
    run: 0,
    runs: [],
};

/**
 * @param {SocketClient[]} clients
 */
function getClientStats(clients){
    return {
        gameCount: clients.filter(client => client.isGame).length,
        managerCount: clients.filter(client => client.isManager).length,
    };
}

// This is ran for every run, so just collect the data and use post processing to combine
function storeGraphMetrics(name, state){
    if(!name || !state) return;
    const path = `${metricsPath}/graph-${name}.json`;

    const run = state.runs[state.runs.length - 1];

    function getPipelinesStats(field){
        return run.meta.pipelineData.reduce((count, data) => (
            count + (data?.dataStats?.[field] || 0)
        ), 0);
    }

    const row = {
        run: run.meta.run,
        metrics: {
            vertices: getPipelinesStats('totalPoints'),
            objects: getPipelinesStats('objects'),
            clients: state.clients?.gameCount || 0,
            serverRuntime: run.meta.runtime,
        },
    };

    const prevData = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, { encoding: 'utf8' })) : [];

    fs.writeFile(path, JSON.stringify([...prevData, row]), { encoding: 'utf8' }, () => {
        // Done
    });
}

function storeGraphMetricsClientRuntimeAddToLast(name, clientRuntime){
    if(!name || !clientRuntime) return;
    const path = `${metricsPath}/graph-${name}.json`;

    const prevData = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, { encoding: 'utf8' })) : [];
    if(!prevData || prevData.length === 0) return;

    const prevRuntime = prevData[prevData.length - 1].metrics?.clientRuntime || {};
    prevRuntime[clientRuntime.file] = [...(prevRuntime[clientRuntime.name] || []), clientRuntime.all];
    prevData[prevData.length - 1].metrics.clientRuntime = prevRuntime;

    fs.writeFile(path, JSON.stringify(prevData), { encoding: 'utf8' }, () => {
        // Done
    });
}

function storeGraphMetricsClientRuntimeVisualsAddToLast(name, clientVisuals){
    if(!name || !clientVisuals) return;
    const path = `${metricsPath}/graph-${name}.json`;

    const prevData = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, { encoding: 'utf8' })) : [];
    if(!prevData || prevData.length === 0) return;

    const prevRuntime = prevData[prevData.length - 1].metrics?.clientRuntimeVisuals || [];
    prevRuntime.push(clientVisuals.all);
    prevData[prevData.length - 1].metrics.clientRuntimeVisuals = prevRuntime;

    fs.writeFile(path, JSON.stringify(prevData), { encoding: 'utf8' }, () => {
        // Done
    });
}

let collectGraphStats = false;

class StateMetrics extends State {
    constructor(app){
        super(app);

        collectGraphStats = app.config?.application?.collectGraphStats;

        this.app.connect((state) => ({
            metrics: state.metrics,
        }), this.storeChange);

        this.app.socket.onClient('connection', () => {
            this.app.store.dispatch(stateMetricsActionClients({
                ...getClientStats(this.app.socket.getClients()),
                connected: 1,
            }));
        });

        this.app.socket.onClient('close', () => {
            this.app.store.dispatch(stateMetricsActionClients({
                ...getClientStats(this.app.socket.getClients()),
                disconnected: 1,
            }));
        });

        this.app.socket.onClient('metricsFps', (data, socketClient) => {
            this.app.store.dispatch(stateMetricsActionFps(
                `${socketClient.id}-${socketClient.isVr ? 'vr' : 'desktop'}`,
                data.fps
            ));
        });

        this.app.socket.onClient('metricsFile', (data, socketClient) => {
            this.app.store.dispatch(stateMetricsActionFile(
                `${socketClient.id}-${socketClient.isVr ? 'vr' : 'desktop'}`,
                {
                    file: data.file,
                    fetch: Math.round(data.fetch * 10000) / 10000,
                    deserialize: Math.round(data.deserialize * 10000) / 10000,
                    all: Math.round(data.all * 10000) / 10000,
                }
            ));
        });

        this.app.socket.onClient('metricsVisuals', (data, socketClient) => {
            this.app.store.dispatch(stateMetricsActionVisuals(
                `${socketClient.id}-${socketClient.isVr ? 'vr' : 'desktop'}`,
                {
                    all: Math.round(data.all * 10000) / 10000,
                }
            ));
        });
    }

    storeChange = ({ metrics }) => {
        this.app.socket.sendToAll({
            type: 'metrics',
            metrics,
        }, [], false, 'metrics');
    }
}

export default StateMetrics

function mergeLastMetricShallow(state, metricStateMerger){
    return {
        ...state,
        runs: state.runs.map((run, i) => {
            if(state.runs.length - 1 === i){
                return {
                    ...run,
                    ...metricStateMerger(run),
                };
            }

            return run;
        }),
    };
}

const metricsReducer = (state = {...defaultState}, action) => {
    if(action.type === 'CONFIG_REPLACE'){
        collectGraphStats = action.config?.application?.collectGraphStats;
    }

    // System is processing, start or end a run
    if(action.type === 'DATA_PROCESSING'){
        // Starting a run, create new run
        if(action.processing){
            state = {
                ...state,
                run: state.run + 1,
                runs: [...state.runs, {
                    meta: {
                        run: state.run + 1,
                        start: moment().toISOString(),
                        runtimeStart: Date.now(),
                        fromPipeline: action.fromPipeline,
                    },
                    pipelines: {},
                }],
            };
        }

        // Ending a run
        else{
            state = mergeLastMetricShallow(state, (run) => ({
                meta: {
                    ...run.meta,
                    end: moment().toISOString(),
                    runtime: (Date.now() - run.meta.runtimeStart) / 1000,
                    pipelineData: action.data,
                },
            }));

            storeGraphMetrics(collectGraphStats, state);

            fs.writeFile(`${metricsPath}/${filename}`, JSON.stringify(state), {
                encoding: 'utf8',
            }, () => {
                // File was written, do nothing
            });
        }
    }

    if(action.type === 'PIPELINE_STAT'){
        // Update run pipeline metrics
        state = mergeLastMetricShallow(state, (run) => ({
            pipelines: {
                ...run.pipelines,
                [action.pipeline]: action.runtime,
            },
        }));

        // Update combined session pipeline metrics
        state = {
            ...state,
            pipelines: {
                ...state.pipelines,
                [action.pipeline]: [
                    ...state.pipelines?.[action.pipeline] || [],
                    action.runtime,
                ],
            },
        };
    }

    if(action.type === 'SYSTEM_ERROR'){
        state = mergeLastMetricShallow(state, (run) => ({
            errors: [
                action.error,
                ...run.errors || [],
            ],
        }));
    }

    if(action.type === 'METRICS_CLIENTS'){
        state = {
            ...state,
            clients: {
                ...state.clients,
                ...action.clients,
                connected: (state.clients?.connected || 0) + (action.clients.connected || 0),
                disconnected: (state.clients?.connected || 0) + (action.clients.connected || 0),
            },
        };
    }

    if(action.type === 'METRICS_FPS'){
        state = {
            ...state,
            fps: {
                ...state.fps || {},
                [action.client]: [...(state?.fps?.[action.client] || []), action.fps],
            },
        };
    }

    if(action.type === 'METRICS_FILE'){
        state = {
            ...state,
            fileLoading: {
                ...state.fileLoading || {},
                [action.client]: [...(state?.fileLoading?.[action.client] || []), action.data],
            },
        };

        // Also add these client metrics to the last run
        state = mergeLastMetricShallow(state, (run) => ({
            clientFileLoading: [
                ...(run.clientFileLoading || []),
                action.data,
            ],
        }));

        storeGraphMetricsClientRuntimeAddToLast(collectGraphStats, action.data);
    }

    if(action.type === 'METRICS_VISUALS'){
        // Also add these client metrics to the last run
        state = mergeLastMetricShallow(state, (run) => ({
            clientVisualsLoading: [
                ...(run.clientVisualsLoading || []),
                action.data,
            ],
        }));

        storeGraphMetricsClientRuntimeVisualsAddToLast(collectGraphStats, action.data);
    }

    return state;
}

export const stateMetricsReducer = {
    metrics: metricsReducer,
};
