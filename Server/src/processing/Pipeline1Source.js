import Pipeline1Sub1Input from './Pipeline1Sub1Input'
import Pipeline1Sub2Normalize from './Pipeline1Sub2Normalize'
import PipelineInterface from './PipelineInterface'

const FILE = 'sourcesMeta';

class Pipeline1Source extends PipelineInterface {
    subPipelines = [
        Pipeline1Sub1Input,
        Pipeline1Sub2Normalize,
    ];

    preProcess(data, context) {
        return this.readJsonFile(FILE);
    }

    process(data, context) {
        return new Promise(resolve => {
            context.forceRerun = this.getOwnData(data)?.sourceCount !== this.config.sources.length;

            resolve({
                ...this.getOwnData(data),
                sourceCount: this.config.sources.length,
            });
        });
    }

    postProcess(data, context) {
        return new Promise(resolve => {
            this.writeJsonFile(FILE, this.getOwnData(data));

            resolve({});
        });
    }
}

export default Pipeline1Source
