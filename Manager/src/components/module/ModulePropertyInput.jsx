import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

const ModulePropertyInput = ({ name, propertySchema, value, onChange }) => {
    const handleChange = useCallback((e) => {
        onChange(name, e.target.value);
    }, [name, onChange]);

    const handleChangeRange = useCallback((e) => {
        onChange(name, e.target.name === 'min'
            ? {min: e.target.value, max: value.max}
            : {min: value.min, max: e.target.value});
    }, [name, value, onChange]);

    let control = null;

    // Handle special cases first
    switch(propertySchema['$ref']){
        case '/Range':
            control = (
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            name="min"
                            value={value.min}
                            onChange={handleChangeRange}
                            helperText="The minimum of the range"
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            name="max"
                            value={value.max}
                            onChange={handleChangeRange}
                            helperText="The maximum of the range"
                        />
                    </Grid>
                </Grid>
            );
            break;

        default:
            // Handle the regular types
            switch(propertySchema.type){
                case 'string':
                    // String is an enum, so render a select element
                    if(propertySchema.enum){
                        control = (
                            <TextField
                                select fullWidth
                                value={value}
                                onChange={handleChange}
                            >
                                {propertySchema.enum.map(option => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        );
                        break;
                    }

                    // String without a format, so basic field
                    if(!propertySchema.format){
                        control = (
                            <Alert color="info">
                                No implementation to control basic string type yet.<br/>
                                <em>{propertySchema.type} - {JSON.stringify(value)}</em>
                            </Alert>
                        );

                        break;
                    }

                    // Handle any other string formats
                    switch(propertySchema.format){
                        default:
                            control = (
                                <Alert color="info">
                                    No implementation to control this string format yet.<br/>
                                    <em>{propertySchema.format} - {JSON.stringify(value)}</em>
                                </Alert>
                            );
                    }
                    break;

                default:
                    control = (
                        <Alert color="info">
                            No implementation to control this option type yet.<br/>
                            <em>{JSON.stringify(propertySchema)} - {JSON.stringify(value)}</em>
                        </Alert>
                    );
            }
    }

    return (
        <div>
            <div><strong>{propertySchema.title || name}</strong></div>
            {control}
        </div>
    );
}

ModulePropertyInput.propTypes = {
    name: PropTypes.string.isRequired,
    propertySchema: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
};

export default ModulePropertyInput
