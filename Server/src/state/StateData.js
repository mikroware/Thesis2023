import State from './State'

// TODO: Same as stateSystem, but for the processing pipeline?
// Or name it stateData? The filter state (for example) should also be somewhere

class StateData extends State {
    constructor(app){
        super(app);

        this.app.connect((state) => ({
            data: state.data,
        }), this.storeChange);

        this.app.connect((state) => ({
            dataset: state.data.dataset,
        }), this.storeChangeDataset);

        this.app.connect((state) => ({
            visuals: state.data.visuals,
        }), this.storeChangeVisuals);

        this.app.connect((state) => ({
            properties: state.data.properties,
        }), this.storeChangeProperties);

        this.app.connect((state) => ({
            filter: state.data.filter,
        }), this.storeChangeFilter);
    }

    storeChange = () => {
        // const state = this.app.store.getState();
        // console.log('Test StateData change');
    }

    storeChangeDataset = (state) => {
        console.log('[StateData] Changing dataset, items:', state.dataset ? `[${state.dataset.map(d => d ? d.count : '-').join(',')}]` : 'NOPE');
        this.app.socket.sendToAll({
            type: 'dataset',
            isLoaded: true,
            dataset: state.dataset,
            // data: state.dataset,
        });
    }

    storeChangeVisuals = (state) => {
        this.app.socket.sendToAll({
            type: 'visuals',
            visuals: state.visuals,
        });
    }

    storeChangeProperties = (state) => {
        this.app.socket.sendToAll({
            type: 'properties',
            properties: state.properties,
        });
    }

    storeChangeFilter = (state) => {
        this.app.socket.sendToAll({
            type: 'filter',
            filter: state.filter,
        });
    }

    // Receive certain socket events and change the filter state
}

export default StateData

const dataReducer = (state = {}, action) => {
    if(action.type === 'DATA_CHANGE' && action.dataset){
        state = {
            ...state,
            dataset: action.dataset,
        };
    }

    if(action.type === 'VISUAL_CHANGE' && action.visuals){
        state = {
            ...state,
            visuals: action.visuals,
        };
    }

    if(action.type === 'PROPERTIES_CHANGE' && action.properties){
        state = {
            ...state,
            properties: action.properties,
        };
    }

    if(action.type === 'FILTER_CHANGE' && action.filter){
        state = {
            ...state,
            filter: action.filter,
        };
    }

    return state;
}

export const stateDataReducer = {
    data: dataReducer,
};
