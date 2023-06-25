import { styled } from '@mui/material'
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import DashboardPage from './app/DashboardPage'
import MetricsPage from './app/metrics/MetricsPage'
import LoaderOverlay from './app/utils/LoaderOverlay'
import SocketProvider from './app/SocketProvider'
import ConnectionDialog from './app/utils/ConnectionDialog'
import Header from './app/header/Header'

const ContentDiv = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(5),
}));

const App = () => {
    return (
        <div>
            <ConnectionDialog />
            <LoaderOverlay />
            <SocketProvider>
                <Header />

                <ContentDiv>
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/metrics" element={<MetricsPage />} />
                    </Routes>
                </ContentDiv>
            </SocketProvider>
        </div>
    );
};

export default App
