import fs from 'fs'
import Pipeline1Source from './Pipeline1Source'
import Pipeline2Layers from './Pipeline2Layers'
import PipelineInterface from './PipelineInterface'
import Pipeline1DataSet from './Pipeline1DataSet'
import Pipeline2Visuals from './Pipeline2Visuals'
import Pipeline3Filter from './Pipeline3Filter'

class Pipeline extends PipelineInterface {
    subPipelines = [
        Pipeline1Source,
        Pipeline1DataSet,
        Pipeline2Visuals,
        Pipeline2Layers,
        Pipeline3Filter,
    ];

    process(data) {
        if(!fs.existsSync('./cache')){
            fs.mkdirSync('./cache');
        }

        return new Promise(resolve => {
            resolve({
                cachePath: './cache',
            });
        });
    }
}

export default Pipeline
