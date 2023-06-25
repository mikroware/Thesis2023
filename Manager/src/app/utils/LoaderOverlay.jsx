import { styled } from '@mui/material'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import BlurLoader from '../../components/utils/BlurLoader'

const RootDiv = styled('div')(({ theme }) => ({
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    fontSize: '1.3em',
    display: 'none',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out 0.3s',
    '&.visible': {
        display: 'block',
    },
    '&.opacity': {
        opacity: 1,
    },
}));

function getLoader(system){
    if(!system.connected) return (
        <BlurLoader text="Server not connected..." />
    );

    if(system.processing) return (
        <BlurLoader text="Server is processing data...">
            <div><br/>{system.currentTask}</div>
        </BlurLoader>
    );

    return <BlurLoader />;
}

const LoaderOverlay = () => {
    const system = useSelector(state => state.system);
    const [visible, setVisible] = useState(false);
    const [opacity, setOpacity] = useState(false);

    useEffect(() => {
        // const newVisible = !!system.processing || !system.connected;
        const newVisible = !system.connected;

        setTimeout(() => {
            setVisible(newVisible);
            setTimeout(() => {
                setOpacity(newVisible);
            }, 100);
        }, 0);
    }, [system]);

    return (
        <RootDiv className={clsx({
            visible,
            opacity,
        })}>
            {getLoader(system)}
        </RootDiv>
    );
}

export default LoaderOverlay
