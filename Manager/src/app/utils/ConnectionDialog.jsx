import React, { useCallback, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import DialogActions from '@mui/material/DialogActions'
import BlurLoader from '../../components/utils/BlurLoader'
import Socket from '../../services/Socket'

const updateLocalConfig = (data) => ({
    type: 'UPDATE_LOCAL_CONFIG',
    localConfig: data,
});

const ConnectionDialog = ({ connected, connectError, reconnecting, connecting, serverUrl, updateLocalConfig }) => {
    const [ val, setVal ] = useState(serverUrl);

    useEffect(() => {
        setVal(serverUrl);
    }, [setVal, serverUrl]);

    const handleChange = useCallback((e) => {
        setVal(e.target.value);
    }, [setVal]);

    const handleConnect = useCallback(() => {
        if(serverUrl === val){
            Socket.getInstance()?.connect();
        }else{
            updateLocalConfig({
                serverUrl: val,
            })
        }
    }, [updateLocalConfig, serverUrl, val]);

    const handleDisconnect = useCallback(() => {
        Socket.getInstance()?.disconnect();
    }, []);

    if(connected) return null;

    return (
        <Dialog open={true} maxWidth="sm" fullWidth disableScrollLock>
            {(reconnecting || connecting) && (
                <BlurLoader text={connecting ? 'Connecting' : 'Attempting to reconnect'}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleDisconnect}
                        sx={{ mt: 3 }}
                    >
                        Stop connecting
                    </Button>
                </BlurLoader>
            )}
            <DialogTitle>
                 Connect to a server
            </DialogTitle>
            <DialogContent>
                {connectError && (
                    <Alert color="error">
                        {connectError}
                    </Alert>
                )}

                <TextField
                    label="Server URL"
                    value={val}
                    onChange={handleChange}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConnect}
                >
                    Connect
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default connect(state => ({
    connected: state.system.connected,
    connectError: state.system.connectError,
    reconnecting: state.system.reconnecting,
    connecting: state.system.connecting,
    serverUrl: state.localConfig.serverUrl,
}), {
    updateLocalConfig,
})(ConnectionDialog)
