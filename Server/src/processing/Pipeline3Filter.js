import PipelineInterface from './PipelineInterface'
import { runCalculateFilters } from './threads/calculateFilters'

class Pipeline3Filter extends PipelineInterface {


    // Probably subscribe to the store too?
    // It needs to see filter changes
    // And re-run this
    // OR is filter state also saved in the config?

    shouldRun = () => {
        return this.didConfigChange('filters');
    }

    process = (data) => {
        return runCalculateFilters({
            data: data.Pipeline1DataSet,
            filters: this.config.filters,
            sources: this.config.dataSources,
        });
    }

    postProcess = (data) => {
        return new Promise(resolve => {
            this.app.store.dispatch({
                type: 'FILTER_CHANGE',
                filter: this.getOwnData(data),
            });

            resolve(null);
        });
    }

}

export default Pipeline3Filter
