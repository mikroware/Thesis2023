import { pick } from 'ramda'
import PipelineInterface from './PipelineInterface'
import { runCalculateVisuals } from './threads/calculateVisuals'

class Pipeline2Visuals extends PipelineInterface {
    // Here the visuals are calculated  for the data.dataSet
    // Probably save in data.visuals
    // Everything needs to go by id

    // Probably subscribe to the store too and watch visual config changes
    // BUT how to run the following pipelines in that case
    // Want to somehow build a structure of linking, chaining and processing

    shouldRun = () => {
        return this.didConfigChange(
            undefined,
            this.config.dataSources.map(pick(['visuals']))
        );
    }

    // TODO: find a cleaner way to pass everything along pipelines (aka named arguments)
    process = (data) => {
        return Promise.all(this.config.dataSources.map((source, i) => {
            if(!data.Pipeline1DataSet[i]) return null;

            return runCalculateVisuals({
                data: data.Pipeline1DataSet[i].data,
                visuals: source.visuals,
            });
        }));
    }

    postProcess = (data) => {
        return new Promise(resolve => {
            this.app.store.dispatch({
                type: 'VISUAL_CHANGE',
                visuals: this.getOwnData(data),
            });

            resolve(null);
        });
    }
}

export default Pipeline2Visuals
