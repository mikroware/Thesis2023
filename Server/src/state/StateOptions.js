import State from './State'
import { mapObjIndexed } from 'ramda'
import { Modules } from '../modules'

// TODO: what does this state do? Or is this WIP to get the module options to the clients?
//  in that case, probably rename it to something like StateModuleOptions

function recursiveBuildOptions(obj){
    return mapObjIndexed((module) => {
        if(module && module.name){
            return {
                _name: module.name,
                ...module.schema,
            };
        }else{
            return recursiveBuildOptions(module);
        }
    }, obj);
}

const defaultTestOptions = recursiveBuildOptions(Modules);

export const stateOptionsActionUpdate = (options) => ({
    type: 'OPTIONS_UPDATE',
    options: options,
});

class StateOptions extends State {
    constructor(app){
        super(app);

        this.app.connect((state) => ({
            options: state.options,
        }), this.storeChange);
    }

    storeChange = (state) => {
        this.app.socket.sendToAll({
            type: 'options',
            options: state.options,
        });
    }
}

export default StateOptions

const optionsReducer = (state = defaultTestOptions, action) => {
    if(action.type === 'OPTIONS_UPDATE'){
        state = {
            ...action.options,
        };
    }

    return state;
}

export const stateOptionsReducer = {
    options: optionsReducer,
};
