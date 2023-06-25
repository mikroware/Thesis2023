import fs from 'fs'
import moment from 'moment'
import path from "path"
import { pick } from 'ramda'
import PipelineInterface from './PipelineInterface'
import Pipeline1Sub1Properties from './Pipeline1Sub1Properties'
import { runGetShapeFileAndProcess } from './threads/getShapeFileAndProcess'

function createCache(data){
    fs.writeFile('data.json', JSON.stringify(data), (err) => {
        if(err){
            return console.error(err);
        }

        console.log('Cache file was created');
    });
}

let simplifyTolerance = [];

// TODO: extend some base class?
class Pipeline1DataSet extends PipelineInterface {
    subPipelines = [
        Pipeline1Sub1Properties,
    ];

    shouldRun = () => {
        // TODO: Always run? Make it collect any cache data? Let sub pipelines decide if they want to run again?

        const tempSourceIndex = 3;

        const configChange = this.didConfigChange(
            undefined,
            this.config.dataSources.map(pick(['file', 'simplifyTolerance', 'enabled']))
        );
        // TODO: simplify below, should run more often
        // .. the processing should determine which source should be ran
        // .. question is: how to easily check if a file is changed here as that is outside the config

        const firstSource = this.config.dataSources[tempSourceIndex];
        const dataset = this.app.store.getState().data.dataset;

        const fs0 = fs.openSync(firstSource.file, 'r');
        const stats = fs.fstatSync(fs0);
        fs.close(fs0);

        const source2 = this.config.dataSources[5];
        const exists2 = fs.existsSync(source2.file);
        let stats2 = null;
        if(exists2){
            const fs2 = fs.openSync(source2.file, 'r');
            stats2 = fs.fstatSync(fs2);
            fs.close(fs2);
        }

        // TODO: fix for multiple datasets
        if(!dataset || !dataset[tempSourceIndex] || !dataset[tempSourceIndex].cacheFile || !dataset[tempSourceIndex].cached || simplifyTolerance[tempSourceIndex] !== firstSource.simplifyTolerance) return true;

        // Only run if data source is edited after last cache or config changed
        return configChange
            || moment(stats.mtime).isAfter(moment(dataset[tempSourceIndex].cached))
            || ((exists2 && stats2) && (!dataset[5] || moment(stats2.mtime).isAfter(moment(dataset[5].cached))));
    }

    process = (data) => {
        const cordSystem = this.config.cordSystem;

        return Promise.all(this.config.dataSources.map((source, i) => {
            // TODO: use some deterministic source key probably, because index should not be used
            if(!fs.existsSync(source.file)) return null;

            const cachePath = `${data.Pipeline.cachePath}/data${i}.json`;
            const cachePathStats = `${data.Pipeline.cachePath}/data${i}Stats.json`;

            const fd0 = fs.openSync(source.file, 'r');
            const statsSource = fs.fstatSync(fd0);
            fs.close(fd0);

            const statsCache = fs.existsSync(cachePath) ? (() => {
                const fd1 = fs.openSync(cachePath, 'r');
                const stats = fs.fstatSync(fd1);
                fs.close(fd1);
                return stats;
            })() : false;

            const fd2 = fs.openSync(path.join(__dirname, 'threads', 'getShapeFileAndProcess.js'), 'r');
            const statsThread= fs.fstatSync(fd2);
            fs.close(fd2);

            // TODO: save cached run data somewhere...
            const runOverride = simplifyTolerance[i] && simplifyTolerance[i] !== source.simplifyTolerance;
            simplifyTolerance[i] = source.simplifyTolerance;

            // TODO: change this perhaps? As also the processing can be changed
            if(!runOverride && statsCache && moment(statsSource.mtime).isBefore(moment(statsCache.mtime)) && moment(statsThread.mtime).isBefore(moment(statsCache.mtime))){
                this.log(`[PIPELINE] Resolving Pipeline1DataSet (source: ${i}) with cache`);
                return new Promise(resolve => {
                    resolve({
                        data: JSON.parse(fs.readFileSync(cachePath)),
                        dataStats: JSON.parse(fs.readFileSync(cachePathStats)),
                        cache: true,
                    });
                });
            }

            // TODO: split properties from shape here? Sub pipeline for properties can merge them with existing files perhaps (if edited)

            return runGetShapeFileAndProcess({
                file: source.file,
                simplifyTolerance: source.simplifyTolerance,
                cordSystem: cordSystem,
                cordSystemType: source.cordSystemType,
                idPrefix: `${i}-`,
            });

            // return PipelineInterface.workerPromise('getShapeFileAndProcess', {
            //     file: source.file,
            //     simplifyTolerance: source.simplifyTolerance,
            //     cordSystem: cordSystem,
            //     idPrefix: `${i}-`,
            // });
        }));

        // TODO: check somehow if something changed in the dataSources
        // ... otherwise skip processing (find a way to also skip subPipelines
        // ... probably need an extra optional function shouldRun():boolean
        // ... probably means this class should not be constructed/new every run but init once by the processor

        // And now? Where to store this?
        // Too big for memory? Too big for state at least
        // Store id and properties in state and shapes separately?

        // This is the dataSet, need to remove height and color from it
        // ... because those are visualization properties
    }

    postProcess = (data) => {
        return new Promise(resolve => {
            const datasetInfo = this.getOwnData(data).map((dataset, i) => {
                if(!dataset) return null;

                // (for now) remove the properties from the data
                const json = JSON.stringify(dataset.data);

                // TODO: do not clear properties for now as a next cache run will read and load none
                //  (need another cache and system part for this)
                // .map(item => {
                //     return {
                //         ...item,
                //         properties: undefined,
                //     };
                // }));

                const filename = `data${i}.json`;
                const info = {
                    cacheFile: filename,
                    type: i === 4 ? 'object' : 'geojson', // TODO: make this actually work instead of index based lol
                    cached: (new Date()).toISOString(),
                    simplifyTolerance: simplifyTolerance[i],
                    noDataValue: this.config.dataSources[i].noDataValue,
                    enabled: this.config.dataSources[i].enabled,
                    count: dataset.data.length,
                    size: (Buffer.byteLength(json, 'utf8') / 1024 / 1024).toFixed(2) + 'MB',
                    dataStats: this.config.dataSources[i].enabled ? dataset.dataStats : {
                        objects: 0,
                        shapes: 0,
                        shapePoints: 0,
                        shapeHoles: 0,
                        shapeHolePoints: 0,
                        totalPoints: 0,
                        types: {},
                    },
                    cache: dataset.cache,
                };

                fs.writeFileSync(`${data.Pipeline.cachePath}/${filename}`, json);
                fs.writeFileSync(`${data.Pipeline.cachePath}/data${i}Stats.json`, JSON.stringify(dataset.dataStats));

                return info;
            });

            // TODO: emit some data update, or more like dispatch an action
            this.app.store.dispatch({
                type: 'DATA_CHANGE',
                dataset: datasetInfo, // TODO: send only part of the data?
                // Probably only send metadata off the dataset, data aka shapes are in a cache file
                // The next pipeline should handle the visuals and store those
                // Client will link visuals to ids and does the rendering
            });

            resolve(datasetInfo.map((info, i) => info ? ({
                ...info,
                data: this.getOwnData(data)[i].data,
            }) : null));
        });
    }
}

export default Pipeline1DataSet
