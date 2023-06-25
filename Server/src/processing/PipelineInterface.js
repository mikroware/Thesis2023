// import Pool from 'worker-threads-pool'
// import os from 'os'
// import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { path as objPath } from 'ramda'
import { ConfigSchema } from '../../configSchema'
import modules from '../modules'
import { stateMetricsActionPipeline } from '../state/StateMetrics'
import { stateSystemActionCurrent, stateSystemActionError } from '../state/StateSystem'

// const cpuCount = os.cpus().length;
// const poolCount = Math.max(cpuCount - 1, 1);
// const pool = new Pool({
//     max: poolCount,
// });

// console.log(`[PIPELINE] Starting thread pool with ${poolCount} workers`);


// TODO: and structure...
//  - improve pipeline interface and cashing
//  - Each pipeline defines which order to follow and which Modules to call (interface provides tools)
//    - Some dependency check should be added for Modules, otherwise error whole pipeline for wrong config
//  - For now all these Modules are ran after each other in the order provided
//  - The most important thing now is define when to run which pipeline (and use cashing there)
//    - To help efficiency, enhancement and properties data should be saved id wise in a secondary file, so whole GeoJSON base files don't have to be re-loaded
//
//   [each flow as defined below can cause a change in any of the artifacts]
//   [which can be triggered by a config change]
//    .---  for comparing on refresh   <-.
// input file -> normalized file -> processed file                                  => provides base data (mostly shapes)
//                                     |   |-> properties file                      => provides feature properties (split from the geojson shapes file for easy updating)
//                                     |   '-> enhanced file                        => provides enhanced data
//                                     |---------|-> properties cache and state     => provides property metadata
//                                     |---------|-> layer state                    => basic layer information for rendering
//                                     |         |       '-> layer+encoding state   => layer encoding information for rendering
//                                     '---------'-> filter state                   => filter information for showing/hiding



// TODO: find a better way to cache this probably.....
let previousArgsCache = {};
const configPathCache = {};

/**
 * @interface
 */
class PipelineInterface {
    // Defines how to run a pipeline

    // Abstract method to run a set of pipelines
    // ... also to support sub pipelines

    subPipelines = [];

    /**
     * @type {ConfigSchema}
     */
    config = null;

    /**
     * Dispatch function to send information to the main Application
     * @type {function}
     */
    dispatch = null;

    /**
     * The state of the external Application at the moment of starting this run
     * @type {object}
     */
    externalState = null;

    constructor(config, state, dispatch){
        this.config = config;
        this.dispatch = dispatch;

        // TODO: probably also remove, this is never used
        this.externalState = state;

        // Temp mimic the old application
        this.app = {
            store: {
                dispatch: dispatch,

                // TODO: this one can probably be removed, is only used in Pipeline1DataSet
                //  but is not needed anymore when pipelines/modules can keep their own state
                getState: () => {
                    return state;
                },
            },
        };

        this.run = this.run.bind(this);
        this.process = this.process.bind(this);
        this.postProcess = this.postProcess.bind(this);
    }

    run(runData, context){
        const name = this.constructor.name;
        this.name = name;

        // Save cache path in instance // TODO: move to processor and context
        this.cachePath = runData?.Pipeline?.cachePath;

        // Pre process the pipeline to, amongst others, gather cache run data
        runData[name] = this.preProcess(runData, context);

        if(!this.shouldRun(runData, context)){
            return new Promise(resolve => {
                this.log(`[PIPELINE] Skipping ${this.constructor.name}`);

                // When skipping pipeline, pass cached args from previous run
                // TODO: need named args here to merge with runArgs to prevent data loss if a previous pipeline did run..
                const [first, ...rest] = previousArgsCache[name];
                resolve({
                    ...runData[name],
                    ...first,
                }, ...rest);
            });
        }

        // TODO: maybe run in another thread?
        // But how...?? Worker threads require file imports, cannot just run a function in a thread...
        // Probably this is something the pipelines need to do themselves (can have helper functions here)
        // It maybe could work if this file spawns the classes as workers somehow and the calling logic is changed to worker messaging
        // Nice source: https://medium.com/lazy-engineering/node-worker-threads-b57a32d84845
        // Probably use pool: https://github.com/watson/worker-threads-pool
        return new Promise(resolve => {
            const begin = Date.now();

            this.log(`[PIPELINE] Running ${name}`);
            this.dispatch(stateSystemActionCurrent(
                `Running ${name}`
            ));

            let promise = this.process(runData, context).then(data => {
                return {
                    ...runData,
                    [name]: data,
                };
            });

            this.subPipelines.forEach(pipeline => {
                promise = promise.then(data => {
                    return (new pipeline(this.config, this.externalState, this.dispatch)).run(data, context)
                });
            });

            promise = promise.then(parentData => {
                return this.postProcess(parentData, context).then(data => {
                    // When nothing given, don't assume an object merge
                    if(!data) return parentData;

                    return {
                        ...parentData,
                        [name]: {
                            ...parentData[name],
                            ...data
                        }
                    }
                })
            });

            promise.then((...args) => {
                const runtime = ((Date.now() - begin) / 1000);

                this.log(`[PIPELINE] Finished ${name} (${runtime.toFixed(3)} sec)`);

                this.dispatch(stateSystemActionCurrent(`Finished ${name}`));
                this.dispatch(stateMetricsActionPipeline(name, runtime));

                previousArgsCache[name] = args;
                resolve(...args);
            }).catch((err) => {
                this.error(`[PIPELINE] Some promise in pipeline ${name} gave an error`, err);
            });
        });
    }

    log = (...log) => {
        if(this.config.application.verbose){
            console.log(...log);
        }
    }

    error = (...log) => {
        console.log(...log);

        this.dispatch(stateSystemActionError({
            message: log[0],
            meta: log.slice(1),
        }));

        return undefined;
    }

    /**
     *
     * @param {any} data
     * @param {PipelineContext} context
     * @returns {boolean}
     */
    shouldRun(data, context){
        return true;
    }

    /**
     *
     * @param {any} data
     * @param {PipelineContext} context
     * @returns {Promise<any, {}>} - data for this Pipeline, overwrites previous data
     */
    process(data, context){
        this.log(`[PIPELINE] Empty process of ${this.constructor.name}`);
        return new Promise(resolve => {
            resolve(this.getOwnData(data) || null);
        });
    }

    /**
     *
     * @param {any} data
     * @param {PipelineContext} context
     * @returns {any} - data for this Pipeline, overwrites previous data
     */
    preProcess(data, context){
        this.log(`[PIPELINE] Empty pre-process of ${this.constructor.name}`);

        // By default, return the already present data
        return this.getOwnData(data) || null;
    }

    /**
     *
     * @param {any} data
     * @param {PipelineContext} context
     * @returns {Promise<{any}>} - object to merge with Pipeline data
     */
    postProcess(data, context){
        this.log(`[PIPELINE] Empty post-process of ${this.constructor.name}`);
        return new Promise(resolve => {
            resolve(null);
        });
    }

    getOwnData(data){
        return data[this.constructor.name];
    }

    /**
     *
     * @param {any} moduleData
     * @param {string[]} modulePath
     * @returns {undefined|Module}
     */
    getModuleInstance(moduleData, modulePath = []){
        if(!moduleData) return undefined;

        const type = moduleData.type;
        if(!type) return this.error(`No data type found in config for module path ${modulePath.join('->')} in pipeline ${this.constructor.name}`);

        const module = objPath([...modulePath, type], modules);

        if(!module) return this.error(`Module for ${modulePath.join('->')} of type "${type}" was not found.`);

        // TODO: find a way to build up the instance tree so they don't have to be re-created
        return new module(moduleData, this.dispatch);
    }

    /**
     *
     * @param {{}[]} dataList
     * @param {Module} module
     * @returns {*}
     */
    runModuleOnDataWithId(dataList, module){
        if(!module) return undefined;

        return dataList.reduce((obj, feature) => {
            obj[feature.id] = module.run(feature);
            return obj;
        }, {});
    }

    // noinspection JSUnusedGlobalSymbols
    isCacheKeySame(key){
        const fileKey = `${this.constructor.name}.key`;
        const hash = crypto.createHash('md5').update(key).digest('hex');

        return fs.readFileSync(fileKey).toString() === hash;
    }

    // noinspection JSUnusedGlobalSymbols
    writeCacheData(key, data){
        const fileData = `${this.constructor.name}.cache`;
        const fileKey = `${this.constructor.name}.key`;

        const hash = crypto.createHash('md5').update(key).digest('hex');

        fs.writeFile(fileData, data, () => {});
        fs.writeFile(fileKey, hash, () => {});
    }

    didConfigChange(keyPath, customKeyObj = undefined){
        // Create the key and hash from it
        const key = customKeyObj !== undefined
            ? JSON.stringify(customKeyObj)
            : JSON.stringify(objPath(keyPath.split('.'), this.config));
        const hash = crypto.createHash('md5').update(key).digest('hex');

        // Make sure cache for this class exists
        if(!configPathCache[this.constructor.name]){
            configPathCache[this.constructor.name] = {};
        }

        // Get the cache for this class
        const classCache = configPathCache[this.constructor.name];

        // See if the cache exists and is the same
        const same = Boolean(classCache) && Boolean(classCache[keyPath]) && classCache[keyPath] === hash;

        // Store the new cache
        configPathCache[this.constructor.name][keyPath] = hash;

        // Return the cache check results
        return !same;
    }

    jsonFilePath(name){
        return `${this.cachePath}/${name}.json`
    }

    writeJsonFile(name, dataObj){
        fs.writeFileSync(this.jsonFilePath(name), JSON.stringify(dataObj), {
            encoding: 'utf8',
        });
    }

    readJsonFile(name, defaultValue = false){
        const path = this.jsonFilePath(name);

        if(!fs.existsSync(path)) return defaultValue;

        try {
            return JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch(e){
            this.error(`Cannot parse json file ${path} in pipeline ${this.name} for some reason...`);

            return null;
        }
    }

    // static workerPromise(scriptFilename, data){
    //     return new Promise((resolve, reject) => {
    //         // TODO: find a way to share the workerData instead of having the worker clone it
    //         // One option might be to start using a redis database, though not sure if that will be faster
    //         pool.acquire(path.join(__dirname, 'threads', `${scriptFilename}.js`), {
    //             workerData: data,
    //         }, (err, worker) => {
    //             if(err) return reject(err);
    //
    //             worker.once('message', resolve);
    //             worker.once('error', reject);
    //         });
    //     });
    // }
}

export default PipelineInterface
