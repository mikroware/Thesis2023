import PipelineInterface from './PipelineInterface'

const getFile = (source) => `source${source}Normalized`;

class Pipeline1Sub2Normalize extends PipelineInterface {
    subPipelines = [];

    preProcess(data, context) {
        return context.config.sources.map((source, i) => {
            return {
                filePath: this.jsonFilePath(getFile(i)),
                data: this.readJsonFile(getFile(i)),
            };
        });
    }

    process(data, context) {
        return new Promise(resolve => {
            resolve(context.config.sources.map((source, i) => {
                return this.getModuleInstance(source.normalize, ['source', 'normalize'])?.run(
                    {
                        // TODO: decide which data is needed for this kind of module
                        sourceData: data.Pipeline1Sub1Input[i],
                        previous: this.getOwnData(data)[i],
                    }, context
                );
            }));
        });
    }

    postProcess(data, context) {
        return new Promise(resolve => {
            this.getOwnData(data).forEach((data, i) => {
                this.writeJsonFile(getFile(i), data);
            });

            resolve();
        })
    }
}

export default Pipeline1Sub2Normalize
