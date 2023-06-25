import State from './State'

export const stateSystemActionProcessing = (yesOrNo, fromPipeline = false, data = null) => ({
    type: 'DATA_PROCESSING',
    processing: yesOrNo,
    fromPipeline: fromPipeline,
    data: data,
});

export const stateSystemActionReady = () => ({
    type: 'READY',
    ready: true,
});

export const stateSystemActionCurrent = (currentTask) => ({
    type: 'CURRENT',
    currentTask: currentTask,
});

export const stateSystemActionError = (error) => ({
    type: 'SYSTEM_ERROR',
    error: error,
});

const defaultState = {
    ready: false,
    processing: false,
};

class StateSystem extends State {
    constructor(app){
        super(app);

        this.app.connect((state) => ({
            system: state.system,
        }), this.storeChange);
    }

    storeChange = ({ system }) => {
        this.app.socket.sendToAll({
            type: 'system',
            system: system,
        });
    }
}

export default StateSystem

const systemReducer = (state = {...defaultState}, action) => {
    if(action.type === 'READY'){
        state = {
            ...state,
            ready: action.ready,
        };
    }

    if(action.type === 'DATA_PROCESSING'){
        state = {
            ...state,
            processing: action.processing,
        };
    }

    if(action.type === 'CURRENT'){
        state = {
            ...state,
            currentTask: action.currentTask,
        };
    }

    if(action.type === 'SYSTEM_ERROR'){
        state = {
            ...state,
            error: [
                action.error,
                ...state.error || [],
            ],
        };
    }

    return state;
}

export const stateSystemReducer = {
    system: systemReducer,
};
