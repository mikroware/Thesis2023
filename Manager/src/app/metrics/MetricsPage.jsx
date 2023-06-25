import { Box, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { mapObjIndexed, reverse, sum, times } from 'ramda'
import React, { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

function getIndentStyle(name, pipelines){
    const count = pipelines.filter(pipeline => name.indexOf(pipeline) === 0).length;
    console.log(name, pipelines, count)
    return {
        paddingLeft: (count * 8) + 8,
    };
}

function FpsGraph({ fps }){
    const options = Object.keys(fps);
    const [selected, setSelected] = useState(options[0] || null);

    const data = (selected && fps[selected] || []).map(item => ({
        fps: item,
    }));

    return (
        <>
            <Typography variant="h6" sx={{ mb: 1 }}>
                FPS
                <TextField select onChange={(e) => setSelected(e.target.value)} value={selected} variant="standard" sx={{ ml: 2 }}>
                    {options.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                </TextField>
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
                <ResponsiveContainer width="100%" aspect={3}>
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="fps" name="FPS" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </>
    );
}

function FileLoadingGraph({ fileLoading }){
    const options = Object.keys(fileLoading);
    const [selected, setSelected] = useState(options[0] || null);

    const data = {};
    (selected && fileLoading[selected] || []).forEach(item => {
        data[item.file] = [...(data[item.file] || []), item];
    });

    return (
        <>
            <Typography variant="h6" sx={{ mb: 1 }}>
                File loading times
                <TextField select onChange={(e) => setSelected(e.target.value)} value={selected} variant="standard" sx={{ ml: 2 }}>
                    {options.map(option => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                </TextField>
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
                <ResponsiveContainer width="100%" aspect={3}>
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis />
                        <YAxis />
                        <Tooltip />
                        {Object.keys(data).map(file => (
                            <Line type="monotone" data={data[file]} dataKey="all" name={file} stroke="#8884d8" activeDot={{ r: 8 }} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </>
    );
}

function RunRow({ run, open, onOpen }) {
    const extra = [];

    if(run.meta.fromPipeline) extra.push('internal');
    if(run.errors) extra.push(`${run.errors.length} errors`);

    return (
        <Paper sx={{ p: 1, mb: 0.5, cursor: 'pointer' }} onClick={() => onOpen(run.meta.run)}>
            #{run.meta.run} - {run.meta.runtime}s - {Object.keys(run.pipelines || {}).length} pipelines
            {extra.length > 0 && (
                <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary', display: 'inline-block', ml: 1 }}>({extra.join(', ')})</Box>
            )}
            {open && (
                <div>
                    {run.errors && (
                        <Box sx={{ my: 1 }}>
                            <strong>Errors</strong>
                            {run.errors.map((error, i) => (
                                <div key={i}>{error.message}</div>
                            ))}
                        </Box>
                    )}
                    <Box sx={{ my: 1 }}>
                        <strong>Pipelines</strong>
                        {Object.values(mapObjIndexed((num, key) => (
                            <div key={key}>{key}: {num}s</div>
                        ), run.pipelines))}
                    </Box>
                    {run.meta.pipelineData && (
                        <Box sx={{ my: 1 }}>
                            <strong>Data stats</strong>
                            {run.meta.pipelineData.map((row, i) => row ? (
                                <div key={i}>
                                    #{i} - {row.enabled ? 'enabled' : 'disabled'}{row.cache ? ' + cache' : ''} - {Object.values(mapObjIndexed((num, key) => `${key}:${num}`, row.dataStats?.types)).join(', ')} - totalPoints:{row.dataStats?.totalPoints} - {row.size}
                                </div>
                            ) : (
                                <div key={i}>#{i} - unloaded</div>
                            ))}
                        </Box>
                    )}
                </div>
            )}
        </Paper>
    );
}

const MetricsPage = ({}) => {
    const metrics = useSelector(state => state.metrics);
    const [open, setOpen] = useState(false);

    const handleOpen = useCallback((run) => {
        setOpen(prev => prev === run ? false : run);
    }, []);

    const runs = useMemo(() => (
        reverse(metrics.runs || [])
    ), [metrics.runs]);

    const pipelineAverages = useMemo(() => (
        Object.values(mapObjIndexed((runtimes, pipeline) => ({
            pipeline,
            runtimes,
            runtime: Math.round((sum(runtimes) / runtimes.length) * 1000) / 1000,
        }), metrics.pipelines || {}))
    ), [metrics.pipelines]);

    const pipelines = useMemo(() => (
        Object.keys(metrics.pipelines)
    ), [metrics.pipelines]);

    return (
        <Grid container spacing={2}>
            <Grid item md={8} xs={12}>

                <Grid container spacing={2}>
                    <Grid item md={6} xs={12}>
                        {metrics.fps && (
                            <FpsGraph fps={metrics.fps} />
                        )}
                        {metrics.fileLoading && (
                            <FileLoadingGraph fileLoading={metrics.fileLoading} />
                        )}
                    </Grid>
                    <Grid item md={6} xs={12}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Pipeline</TableCell>
                                    <TableCell>First run</TableCell>
                                    <TableCell>Average</TableCell>
                                    <TableCell>#runs</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pipelineAverages.map((item) => (
                                    <TableRow key={item.pipeline}>
                                        <TableCell>{item.pipeline}</TableCell>
                                        <TableCell>{item.runtimes[0]}s</TableCell>
                                        <TableCell>{item.runtime}s</TableCell>
                                        <TableCell>{item.runtimes.length}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item md={4} xs={12}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Runtimes
                </Typography>

                <Box sx={{ mt: 2, mb: 2 }}>
                    <ResponsiveContainer width="100%" aspect={3}>
                        <LineChart
                            data={metrics.runs}
                            margin={{
                                top: 10,
                                right: 20,
                                left: 10,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="meta.run" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="meta.runtime" name="Runtime" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>

                {runs.map((run, i) => (
                    <RunRow key={i} run={run} open={open === run.meta.run} onOpen={handleOpen} />
                ))}
            </Grid>
        </Grid>
    );
};

export default MetricsPage
