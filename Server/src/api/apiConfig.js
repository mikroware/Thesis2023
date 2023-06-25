import { clone } from 'ramda'
import modules from '../modules'

/**
 *
 * @param {Express} api
 * @param {ServerApplication} app
 */
function apiConfig(api, app){
    api.patch('/config/visual', (req, res) => {
        const { sourceIndex, visualize, config } = req.body;

        const newConfig = clone(app.store.getState().config);

        const dataSource = newConfig?.dataSources?.[sourceIndex];
        if(!dataSource) return res.status(400).json({
            error: 'Data source was not found.',
        });

        const visual = dataSource.visuals.find(
            visual => visual.visualize === visualize
        );
        if(!visual) return res.status(400).json({
            error: 'Visual was not found in the data source.',
        });

        const module = modules.encoding?.[visual.visualize]?.[visual.type];
        if(!module) return res.status(400).json({
            error: `Visualization module for visualization '${visual.visualize}' and type '${visual.type}' cannot be found.'`,
        });

        const validation = module?.validate(config);
        if(!validation || !validation.valid) return res.status(400).json({
            error: 'Validation for this module failed.',
            errors: validation.errors,
        });

        if(!module?.configure(visual, config)) return res.status(400).json({
            error: 'Cannot update the configuration for this module.',
        });

        app.saveConfig(newConfig);

        res.json({
            success: true,
        });
    });

    api.patch('/config/filter', (req, res) => {
        const { filterIndex, config } = req.body;

        const newConfig = clone(app.store.getState().config);

        const filter = newConfig?.filters?.[filterIndex];
        if(!filter) return res.status(400).json({
            error: 'Filter was not found.',
        });

        // TODO: not hardcode this filter
        const module = modules.filter.range;

        if(!module?.configure(filter, config)) res.status(400).json({
            error: 'Cannot update the configuration for this module.',
        });

        app.saveConfig(newConfig);

        res.json({
            success: true,
        });
    });
}

export default apiConfig
