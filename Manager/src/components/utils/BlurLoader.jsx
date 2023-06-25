import { Box, styled } from '@mui/material'
import React from 'react'
import PropTypes from 'prop-types'
import CircularProgress from '@mui/material/CircularProgress'

const RootDiv = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: 'rgba(150, 150, 150, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
}));

const BlurLoader = ({ children, text }) => {
    return (
        <RootDiv>
            <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size="3em" />
                {text && (
                    <Box sx={{ mt: 1, color: 'text.secondary' }}>
                        <em>{text}</em>
                    </Box>
                )}
                {children}
            </Box>
        </RootDiv>
    );
}

BlurLoader.propTypes = {
    text: PropTypes.string,
    children: PropTypes.node,
};

BlurLoader.defaultProps = {
    text: null,
    children: null,
};

export default BlurLoader
