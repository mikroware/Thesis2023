import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { CALL_API } from '../setup/api'
import Socket from '../services/Socket'
import { optionsActionUpdate } from '../reducers/optionsReducer'

const updateSystem = (systemUpdate) => ({
    type: 'UPDATE_SYSTEM',
    system: systemUpdate,
});

const updateDataset = (dataset) => ({
    type: 'UPDATE_DATASET',
    dataset: dataset,
});

const replaceConfig = (config) => ({
    type: 'REPLACE_CONFIG',
    config: config,
});

const updateMetrics = (metrics) => ({
    type: 'MERGE_METRICS',
    metrics: metrics,
});

const getSystemState = () => ({
    [CALL_API]: {
        type: 'SYSTEM_STATE',
        endpoint: 'info',
    },
});

class SocketProvider extends Component {
    componentDidMount() {
        const { serverUrl } = this.props;

        const socket = Socket.getInstance(serverUrl);

        if(!socket) throw new Error('No Socket instantiated yet!');

        // socket.socket.on('system', this.handleSystemChange);
        socket.on('open', this.handleConnect);
        socket.on('close', this.handleDisconnect);
        socket.on('error', this.handleError);
        socket.on('message', this.handleMessage);

        socket.on(socket.localEvents.reconnecting, this.handleReconnecting);
        socket.on(socket.localEvents.connecting, this.handleConnecting);
        // socket.socket.on('connect', this.handleConnect);
        // socket.socket.on('disconnect', this.handleDisconnect);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.serverUrl !== this.props.serverUrl){
            Socket.getInstance(this.props.serverUrl);
        }
    }

    handleMessage = (event) => {
        if(!event.data) return;

        const data = JSON.parse(event.data);
        if(!data.type) return;

        switch(data.type){
            case 'system':
                this.handleSystemChange(data.system);
                break;
            case 'init':
            case 'dataset':
                this.handleDatasetChange(data);
                break;
            case 'config':
                this.handleConfigChange(data);
                break;
            case 'options':
                this.handleOptionsChange(data);
                break;
            case 'metrics':
                this.handleMetricsChange(data);
                break;
            default:
                console.log(`Socket event type [${data.type}] not handled.`);
        }
    }

    handleSystemChange = (data) => {
        this.props.updateSystem(data);
    }

    handleDatasetChange = (data) => {
        this.props.updateDataset(data);

        if(data.config){
            this.handleConfigChange(data);
        }

        if(data.options){
            this.handleOptionsChange(data);
        }
    }

    handleConfigChange = (data) => {
        this.props.replaceConfig(data.config);
    }

    handleOptionsChange = (data) => {
        this.props.optionsActionUpdate(data.options);
    }

    handleMetricsChange = (data) => {
        this.props.updateMetrics(data.metrics);
    }

    handleConnect = () => {
        this.props.updateSystem({
            connected: true,
            connectError: false,
        });

        this.props.getSystemState();
    }

    handleDisconnect = () => {
        this.props.updateSystem({
            connected: false,
        });
    }

    handleError = () => {
        this.props.updateSystem({
            connected: false,
            connectError: `Websocket could not connect`,
        });
    }

    handleReconnecting = (state) => {
        this.props.updateSystem({
            reconnecting: state,
        });
    }

    handleConnecting = (state) => {
        this.props.updateSystem({
            connecting: state,
        });
    }

    render(){
        const { children, connected, hasInfoLoaded } = this.props;

        if(!connected) return null;
        if(!hasInfoLoaded) return <div>Loading...</div>; // TODO: add loader

        return children || null;
    }
}

SocketProvider.propTypes = {
    children: PropTypes.node,
};

export default connect(state => ({
    serverUrl: state.localConfig.serverUrl,
    connected: state.system.connected,
    hasInfoLoaded: Boolean(state.dataset.isLoaded && state.config.loaded && Object.keys(state.options).length > 0),
}), {
    updateSystem,
    updateDataset,
    replaceConfig,
    optionsActionUpdate,
    getSystemState,
    updateMetrics,
})(SocketProvider)
