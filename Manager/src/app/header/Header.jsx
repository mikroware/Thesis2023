import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import React, { useCallback, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import { Home, Insights, Menu } from '@mui/icons-material'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Socket from '../../services/Socket'

const Header = () => {
    const name = useSelector(state => state?.config?.application?.name);
    const system = useSelector(state => state.system);

    const handleDisconnect = useCallback(() => {
        Socket.getInstance()?.disconnect();
    }, []);

    const [open, setOpen] = useState(false);
    const toggleDrawer = useCallback(() => {
        setOpen(open => !open);
    }, []);

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        sx={{ mr: 2 }}
                        color="inherit"
                        aria-label="menu"
                        onClick={toggleDrawer}
                    >
                        <Menu />
                    </IconButton>
                    <Typography variant="h6">
                        {name}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                        {system.processing && (
                            <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center', ml: 2 }}>
                                <CircularProgress size="2em" color="inherit" sx={{ mr: 2 }} />
                                {system.currentTask}
                            </Box>
                        )}
                    </Box>
                    <Button color="inherit" onClick={handleDisconnect}>
                        disconnect
                    </Button>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={open}
                onClose={toggleDrawer}
            >
                <Box sx={{ width: 250 }} onClick={toggleDrawer}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/">
                                <ListItemIcon>
                                    <Home />
                                </ListItemIcon>
                                <ListItemText primary="Home" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                            <ListItemButton component={Link} to="/metrics">
                                <ListItemIcon>
                                    <Insights />
                                </ListItemIcon>
                                <ListItemText primary="Metrics" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </>
    )
}

export default Header
