import { styled } from '@mui/material'
import Divider from '@mui/material/Divider'
import React, { useState } from 'react'
import Grid from '@mui/material/Grid'
import { connect } from 'react-redux'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CardActions from '@mui/material/CardActions'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { ArrowRightAlt, VisibilityOff } from '@mui/icons-material'
import ListSubheader from '@mui/material/ListSubheader'
import Chip from '@mui/material/Chip'
import ListItemText from '@mui/material/ListItemText'
import { mapObjIndexed } from 'ramda'
import FilterForm from './filter/FilterForm'
import VisualEditDialog from './visual/VisualEditDialog'

const ColorIndicator = styled(({ color, ...rest }) => {
    return (
        <span {...rest} style={{
            backgroundColor: color,
        }} />
    );
})(( { theme }) => ({
    display: 'inline-block',
    width: '1em',
    height: '1em',
    borderRadius: '50%',
}));

function getVisualTypeName(visual, options){
    return options?.[visual.visualize]?.[visual.type]?._name || visual.type;
}

function buildOptionsViewerList(visual, options){
    if(!options[visual.visualize]) return false;

    options = options[visual.visualize][visual.type];
    if(!options) return false;

    return Object.values(mapObjIndexed((option, key) => {
        if(key.indexOf('_') === 0) return false;
        if(visual[key] === undefined) return false;

        if(!visual[key]) return <span>{key}: no</span>;

        if(option.indexOf('color') === 0) return <ColorIndicator color={visual[key]} />;
        if(option.indexOf('range') === 0) return <span>{key}: {visual[key].min}-{visual[key].max}</span>;

        // TODO: implement more option field types

        return <span>{key}: {visual[key]}</span>;
    }, options)).filter(Boolean);
}

const CLASS = 'DashboardPage';
const classes = {
    title: `${CLASS}-title`,
    arrowRight: `${CLASS}-arrowRight`,
    optionsList: `${CLASS}-optionsList`,
    divider: `${CLASS}-divider`,
};

const RootDiv = styled('div')(({ theme }) => ({
    [`& .${classes.title}`]: {
        display: 'flex',
        alignItems: 'center',
        '& > div:first-of-type': {
            flex: 1,
        },
    },
    [`& .${classes.arrowRight}`]: {
        margin: theme.spacing(0, 2),
        verticalAlign: '-0.3em',
    },
    [`& .${classes.optionsList}`]: {
        '& > span + span::before': {
            display: 'inline-block',
            content: '"|"',
            margin: theme.spacing(0, 1),
        },
    },
    [`& .${classes.divider}`]: {
        margin: theme.spacing(5, 0),
    },
}));

const DashboardPage = ({ dataset, config, options }) => {
    const [editVisual, setEditVisual] = useState(null);

    const handleConfigureVisual = (set, visual, sourceIndex) => {
        setEditVisual({...visual, set, sourceIndex});
    };

    const handleClose = () => {
        setEditVisual(null);
    };

    return (
        <RootDiv>
            {editVisual && (
                <VisualEditDialog visual={editVisual} options={options} onClose={handleClose} />
            )}
            <Grid container spacing={2}>
                {config.dataSources.map((set, id) => (
                    <Grid item md={4} xs={12} key={id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="h2" className={classes.title}>
                                    <div>{set.name}</div>
                                    {!set.enabled && (
                                        <Chip
                                            variant="outlined" color="error" size="small" label="disabled"
                                            icon={<VisibilityOff/>}
                                        />
                                    )}
                                </Typography>
                                <Typography color="textSecondary">
                                    {set.file} | simplify: {set.simplifyTolerance}
                                </Typography>
                            </CardContent>
                            <List subheader={
                                <ListSubheader>Visuals</ListSubheader>
                            }>
                                {set.visuals.map(visual => {
                                    const optionsList = buildOptionsViewerList(visual, options.encoding);

                                    return (
                                        <ListItem key={visual.visualize} divider button onClick={() => handleConfigureVisual(set, visual, id)}>
                                            <ListItemText
                                                primary={<>
                                                    {visual.visualize} <ArrowRightAlt className={classes.arrowRight} /> {getVisualTypeName(visual, options.encoding)}
                                                </>}
                                                secondary={(
                                                    <span className={classes.optionsList}>
                                                        {optionsList ? optionsList.map((Item, i) => (
                                                            React.cloneElement(Item, {key: i})
                                                        )): undefined}
                                                    </span>
                                                )}
                                            />
                                        </ListItem>
                                    )
                                })}
                            </List>
                            <CardActions>
                                <Button>
                                    Edit source
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Divider className={classes.divider} />
            <Grid container spacing={2}>
                {config.filters.map((filter, id) => (
                    <Grid item md={4} xs={12} key={id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="h2" className={classes.title}>
                                    <div>Filter on {config.dataSources?.[filter.sourceIndex]?.name || 'UNKNOWN'}</div>
                                </Typography>
                            </CardContent>
                            <CardContent>
                                <FilterForm
                                    filterId={id}
                                    filter={filter}
                                    properties={dataset.properties}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </RootDiv>
    );
};

export default connect(state => ({
    dataset: state.dataset,
    config: state.config,
    options: state.options,
}))(DashboardPage)
