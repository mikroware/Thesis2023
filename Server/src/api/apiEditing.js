import fs from 'fs'
import { point } from '@turf/helpers'

/**
 *
 * @param {Express} api
 * @param {ServerApplication} app
 */
function apiEditing(api, app){
    api.post('/editing/add', (req, res) => {
        const { layerIndex, position } = req.body;

        /**
         * @type {LayersItemSpec}
         */
        const layerConfig = app.config.layers[layerIndex];
        if(!layerConfig) return res.status(400).json({
            error: `Given layer index (${layerIndex}) does not exist in the config.`,
        });

        if(!layerConfig.editable) return res.status(400).json({
            error: 'Given layer is not editable.',
        });

        const sourceIndex = layerConfig.source;
        if(!sourceIndex && sourceIndex !== 0) return res.status(400).json({
            error: 'Given layer has no usable source assigned.',
        });

        console.log(`Go request to add for layer ${layerIndex}, position:`);
        console.log(position);

        // TODO: somehow decide which file to update

        // TODO: need a more generic way for this in combination with multi config setup, should be in Application
        // const cacheFile = `./cache/data${sourceIndex}.json`; // Pretend it is pure input file for now
        const cacheFile = `./testData/testEditing.geojson`;

        const json = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : [];

        // Add the new point to it
        json.push(point(position, {
            someInfo: 1,
        }));

        // Save it
        fs.writeFileSync(cacheFile, JSON.stringify(json), {
            encoding: 'utf8',
        });

        // Run the processor with details about the change
        app.processor.run(/** @type {PipelineContextInvokeDetails} */{
            sourceChanged: sourceIndex,
        });

        res.json({
            success: false,
            todo: true,
        });
    });
}

export default apiEditing
