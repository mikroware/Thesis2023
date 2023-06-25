import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import { mapObjIndexed } from 'ramda'
import React from 'react'
import PropTypes from 'prop-types'
import ModulePropertyInput from '../../components/module/ModulePropertyInput'

const VisualTypeOptions = ({ visual, typeOptions, onChange }) => {
    const moduleSchema = typeOptions[visual.type];

    if(!moduleSchema) return (
        <Alert color="info">
            No options available for this visual type.
        </Alert>
    )

    return (
        <div>
            <Typography variant="h6" gutterBottom>
                {moduleSchema._name}
            </Typography>
            <Grid container spacing={3}>
                {Object.values(mapObjIndexed((option, key) => {
                    // Ignore constant properties
                    if(option.const) return false;

                    return (
                        <Grid item xs={12} key={key}>
                            <ModulePropertyInput
                                name={key}
                                propertySchema={option}
                                value={visual[key]}
                                onChange={onChange}
                            />
                        </Grid>
                    );
                }, moduleSchema.properties)).filter(Boolean)}
            </Grid>
        </div>
    )
};

VisualTypeOptions.propTypes = {
    visual: PropTypes.object,
    typeOptions: PropTypes.object,
    onChange: PropTypes.func.isRequired,
}

export default VisualTypeOptions
