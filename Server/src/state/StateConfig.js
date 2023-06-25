import { clone } from 'ramda'
import State from './State'

// TODO: the changing of the config is pretty customized in here
//  this should probably be moved to the modules? So they can check their own config, which makes this a lot more dynamic

export const stateConfigActionReplace = (config) => ({
    type: 'CONFIG_REPLACE',
    config: config,
});

class StateConfig extends State {
    constructor(app){
        super(app);

        this.app.connect((state) => ({
            config: state.config,
        }), this.storeChange);

        this.app.socket.onClient('configChangeSource', this.configChangeSource);
        this.app.socket.onClient('configChangeSourceVisual', this.configChangeSourceVisual);
        this.app.socket.onClient('configChangeFilter', this.configChangeFilter);

        this.app.socket.onClient('updateConfig', this.updateConfig);
    }

    storeChange = (state) => {
        this.app.socket.sendToAll({
            type: 'config',
            config: state.config,
        });
    }

    configChangeSource = (data) => {
        const sourceIndex = data.source;
        const config = data.config;

        if(sourceIndex !== parseInt(sourceIndex) || !config){
            return console.log('[StateConfig] No source or config');
        }

        const newConfig = clone(this.app.store.getState().config);

        function set(key){
            if(config[key] !== undefined){
                newConfig.dataSources[sourceIndex][key] = config[key];
            }
        }

        set('name');
        set('enabled');
        set('simplifyTolerance');

        this.app.saveConfig(newConfig);

        return 'TEST'
    }

    configChangeSourceVisual = (data, callback) => {
        const sourceIndex = data.source;
        const config = data.config;

        if(sourceIndex !== parseInt(sourceIndex) || !config){
            return console.log('[StateConfig] No source or config');
        }

        const newConfig = clone(this.app.store.getState().config);
        const visual = newConfig.dataSources[sourceIndex].visuals.find(
            visual => visual.visualize === config.visualize
        );

        if(!visual) return;

        function set(key, val){
            if(config[key] !== undefined || val){
                visual[key] = val || config[key];
            }
        }

        if(visual.visualize === 'color'){
            set('type');

            if(visual.type === 'map'){
                set('field');
                set('range', {
                    min: config.range.min,
                    max: config.range.max,
                });
                set('colorMap', 'blue');
            }

            if(visual.type === 'single'){
                set('singleColor');
            }
        }

        if(visual.visualize === 'height'){
            set('from');
            set('scale');
        }

        this.app.saveConfig(newConfig);

        if(callback) callback({ test: 1337, });
    }

    configChangeFilter = (data) => {
        const sourceIndex = data.sourceIndex;
        const filter = data.filter;

        if(sourceIndex !== parseInt(sourceIndex) || !filter){
            return console.log('[StateConfig] No source or filter');
        }

        const newConfig = clone(this.app.store.getState().config);

        newConfig.filters = [{
            sourceIndex: sourceIndex,
            ...filter,
        }];

        this.app.saveConfig(newConfig);
    }

    updateConfig = (data) => {
        if(!data.switchWifiData && !data.switchWifiLive) return;

        const newConfig = clone(this.app.store.getState().config);

        if(data.switchWifiLive){
            if(!newConfig.sources?.[1]?.input) return;

            newConfig.sources[1].input.live = !newConfig.sources[1].input.live;

            this.app.saveConfig(newConfig);

            return;
        }

        // TODO: nasty way of simulating a property witch for now
        if(!newConfig.dataSources?.[5]?.visuals?.[1]) return;

        newConfig.dataSources[5].visuals[1] = newConfig.dataSources[5].visuals[1].field === 'connected' ? {
            "visualize": "size",
            "field": "status",
            "default": 0,
            "scale": 1,
            "add": 1,
        } : {
            "visualize": "size",
            "field": "connected",
            "default": 5,
            "scale": 0.025,
            "add": 0.5,
        };

        this.app.saveConfig(newConfig);
    }
}

export default StateConfig

const configReducer = (state = {}, action) => {
    if(action.type === 'CONFIG_REPLACE'){
        state = {
            ...action.config,
        };
    }

    return state;
}

export const stateConfigReducer = {
    config: configReducer,
};
