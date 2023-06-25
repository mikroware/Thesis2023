import CssBaseline from '@mui/material/CssBaseline'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import configureStore from './setup/store'
import theme from './theme'

// Create the application data store
const store = configureStore({
    localConfig: {
        serverUrl: process.env.REACT_APP_SERVER_URL || 'localhost:2345',
    },
});

// Create the theme
const finalTheme = createTheme(theme);

// Find the potential production base name to insert into the router
const basename = process.env.PUBLIC_URL ? (new URL(process.env.PUBLIC_URL)).pathname : undefined;

const root = createRoot(document.getElementById('root'));

root.render(
    <ThemeProvider theme={finalTheme}>
        <Provider store={store}>
            <BrowserRouter basename={basename}>
                <CssBaseline />
                <App />
            </BrowserRouter>
        </Provider>
    </ThemeProvider>
);
