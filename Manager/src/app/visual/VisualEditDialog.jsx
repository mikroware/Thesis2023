import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Alert from '@mui/material/Alert'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import BlurLoader from '../../components/utils/BlurLoader'
import withFormData from '../../modules/formData/withFormData'
import { CALL_API } from '../../setup/api'
import VisualTypeOptions from './VisualTypeOptions'

const ApiAction = (sourceIndex, visualize, config) => ({
    [CALL_API]: {
        type: 'PATCH_CONFIG_VISUAL',
        endpoint: 'config/visual',
        method: 'PATCH',
        body: {
            sourceIndex,
            visualize,
            config,
        },
    },
});

const VisualEditDialog = ({ visual, options, onClose, watchSubmit, formError, formSaving, formSuccess }) => {
    const [values, setValues] = useState({});

    const editVisual = useMemo(() => ({
        ...visual,
        ...values,
    }), [visual, values]);

    const handleChange = useCallback((field, value) => {
        setValues(values => ({
            ...values,
            [field]: value,
        }));
    }, [setValues]);

    const handleSave = useCallback(() => {
        watchSubmit(ApiAction(visual.sourceIndex, visual.visualize, values));
    }, [visual, values, watchSubmit]);

    useEffect(() => {
        if(formSuccess) onClose();
    }, [onClose, formSuccess]);

    const activeVisual = options.encoding[visual.visualize];

    return (
        <Dialog open={true} maxWidth="sm" fullWidth onClose={onClose} scroll="paper">
            {formSaving && (
                <BlurLoader text="Saving config" />
            )}
            <DialogTitle>
                {visual.set.name} - {visual.visualize}
            </DialogTitle>
            <DialogContent>
                {formError && (
                    <Alert color="warning">
                        {formError.error}
                    </Alert>
                )}
                {formSuccess && (
                    <Alert color="success">
                        Config was successfully saved.
                    </Alert>
                )}

                {activeVisual ? (
                    <VisualTypeOptions
                        visual={editVisual}
                        typeOptions={activeVisual}
                        onChange={handleChange}
                    />
                ) : (
                    <Alert color="info">
                        No options available for this visual.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" color="error" onClick={onClose} disabled={formSaving}>
                    Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={formSaving}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    )
};

VisualEditDialog.propTypes = {
    visual: PropTypes.object.isRequired,
    options: PropTypes.object,
    onClose: PropTypes.func.isRequired,
};

export default withFormData({
    customId: () => 'visualEditDialog',
})(VisualEditDialog)
