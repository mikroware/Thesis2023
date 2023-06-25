import { pick } from 'ramda'
import PipelineInterface from './PipelineInterface'

class Pipeline2Layers extends PipelineInterface {

    shouldRun = () => {
        return this.didConfigChange(
            undefined,
            this.config.layers.map(pick(['source', 'encoding']))
        );
    }

    // TODO: find a cleaner way to pass everything along pipelines (aka named arguments)
    process = (data) => {
        return Promise.all(this.config.layers.map((layer, i) => {
            // TODO: find a better way to link a source? Using the index could be troublesome
            const sourceData = data.Pipeline1DataSet[layer.source]?.data;
            if(!sourceData){
                this.error(`Source data for layer "${i}" not found.`);
                return {};
            }

            return {
                color: this.runModuleOnDataWithId(sourceData,
                    this.getModuleInstance(layer.encoding.color, ['encoding', 'color'])
                ),
                height: this.runModuleOnDataWithId(sourceData,
                    this.getModuleInstance(layer.encoding.height, ['encoding', 'height'])
                ),
            };
        }));
    }

    postProcess = (data) => {
        return new Promise(resolve => {
            this.dispatch({
                type: 'LAYERS_CHANGE',
                layers: this.getOwnData(data),
            });

            resolve(null);
        });
    }
}

export default Pipeline2Layers
