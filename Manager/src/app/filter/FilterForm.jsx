import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import { mapObjIndexed } from 'ramda'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import BlurLoader from '../../components/utils/BlurLoader'
import withFormData from '../../modules/formData/withFormData'
import { CALL_API } from '../../setup/api'

const ApiAction = (filterIndex, config) => ({
    [CALL_API]: {
        type: 'PATCH_CONFIG_FILTER',
        endpoint: 'config/filter',
        method: 'PATCH',
        body: {
            filterIndex,
            config,
        },
    },
});

const FilterForm = ({ filterId, filter, properties, formSaving, formError, formSuccess, watchSubmit }) => {
    const availableProperties = properties[filter.sourceIndex];

    const [values, setValues] = useState(null);

    const editFilter = useMemo(() => ({
        ...filter,
        ...values,
    }), [filter, values]);

    const handleChangeField = useCallback((e) => {
        const val = e.target.value;
        setValues(values => ({
            ...values,
            field: val,
        }));
    }, [setValues]);

    const handleChangeRange = useCallback((e) => {
        const name = e.target.name;
        const val = parseFloat(e.target.value) || e.target.value;

        setValues(values => ({
            ...values,
            range: name === 'min'
                ? [val, editFilter.range[1]]
                : [editFilter.range[0], val]
        }));
    }, [setValues, editFilter]);

    const handleApply = useCallback(() => {
        watchSubmit(ApiAction(filterId, values));
    }, [filterId, values, watchSubmit]);

    const lastSuccess = useRef(false);
    useEffect(() => {
        if(formSuccess && !lastSuccess.current){
            setValues(null);
        }

        lastSuccess.current = formSuccess;
    }, [formSuccess, setValues]);

    return (
        <Grid container spacing={2}>
            {formSaving && (
                <BlurLoader />
            )}
            {formError && (
                <Grid item xs={12}>
                    <Alert color="error">
                        {formError.error || formError.message}
                    </Alert>
                </Grid>
            )}
            {formSuccess && values === null && (
                <Grid item xs={12}>
                    <Alert color="success">
                        Filter was successfully applied.
                    </Alert>
                </Grid>
            )}

            <Grid item xs={12}>
                <TextField
                    select fullWidth
                    label="Property field"
                    value={editFilter.field}
                    onChange={handleChangeField}
                >
                    {Object.values(mapObjIndexed((meta, p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                    ), availableProperties))}
                </TextField>
            </Grid>
            <Grid item xs={12}>
                <em>Minimum value: {availableProperties[editFilter.field]?.min}, maximum value: {availableProperties[editFilter.field]?.max}</em>
            </Grid>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    label="Range minimum"
                    name="min"
                    value={editFilter.range[0]}
                    onChange={handleChangeRange}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    fullWidth
                    label="Range maximum"
                    name="max"
                    value={editFilter.range[1]}
                    onChange={handleChangeRange}
                />
            </Grid>
            {values !== null && (
                <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleApply} disabled={formSaving}>
                        Apply filter changes
                    </Button>
                </Grid>
            )}
        </Grid>
    )
};

FilterForm.propTypes = {
    filterId: PropTypes.number.isRequired,
    filter: PropTypes.object.isRequired,
    properties: PropTypes.array.isRequired,
};

export default withFormData({
    customId: () => 'filterForm',
})(FilterForm)
