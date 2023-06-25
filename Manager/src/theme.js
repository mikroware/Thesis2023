import { mapObjIndexed } from 'ramda'
import { createTheme } from '@mui/material/styles'

const defaultTheme = createTheme();

const theme = {
    typography: {
        htmlFontSize: 16,
        fontSize: 14,
        h1: {
            fontSize: '3rem',
        },
        h2: {
            fontSize: '2.4rem',
        },
        h3: {
            fontSize: '1.8rem',
        },
        h4: {
            fontSize: '1.4rem',
        },
    },
    palette: {

    },
    shape: {
        borderRadius: 2,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '1rem',
                    overflowY: 'scroll',
                },
                p: {
                    ...defaultTheme.typography.body1,
                },
            },
        },
    },
};

export default theme
