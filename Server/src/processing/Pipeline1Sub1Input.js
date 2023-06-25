import PipelineInterface from './PipelineInterface'

const getFile = (source) => `source${source}Input`;
const META_FILE = 'sourcesInputMeta';

class Pipeline1Sub1Input extends PipelineInterface {
    subPipelines = [];

    preProcess(data, context) {
        const meta = this.readJsonFile(META_FILE, []);

        return context.config.sources.map((source, i) => {
            return {
                ...meta[i],
                filePath: `${this.cachePath}/${getFile(i)}`,
            };
        });
    }

    process(data, context) {
        return new Promise(resolve => {
            resolve(context.config.sources.map((source, i) => {
                /**
                 * @type {undefined|SourceInputModule}
                 */
                const module = this.getModuleInstance(source.input, ['source', 'input']);

                if(!module) return {
                    ...this.getOwnData(data)[i],
                };

                context.changed.source[i] = module.getChanged();

                return {
                    ...this.getOwnData(data)[i],
                    ...module.run(
                        this.getOwnData(data)[i], context
                    ),
                };
            }));
        });
    }

    postProcess(data, context) {
        return new Promise(resolve => {
            // data.forEach((data, i) => {
            //     this.writeJsonFile(getFile(i), data);
            // });

            // TODO: probably fetch the file stats here and assign - as they are output dependant and have nothing to do with the source

            // TODO: consider giving every pipeline a meta file by default
            //  data should probably only hold meta data, however that means another way should be found to keep the actual data in memory for quick processing
            this.writeJsonFile(META_FILE, this.getOwnData(data));

            resolve();
        })
    }
}

export default Pipeline1Sub1Input
