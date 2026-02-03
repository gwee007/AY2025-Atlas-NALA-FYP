import * as React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import {
    Menu as MenuIcon,
    DashboardRounded as DashboardRoundedIcon,
    AssistantRounded as AssistantRoundedIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const pages = [
    { name: 'Dashboard', path: '/dashboard', icon: <DashboardRoundedIcon /> },
    { name: 'Chatbot', path: '/chatbot', icon: <AssistantRoundedIcon /> }
];

function Navbar() {
    const [anchorElNav, setAnchorElNav] = React.useState(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleOpenNavMenu = (event) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };
    const handleLogout = () => {
        logout();
        // Force immediate navigation to login
        navigate('/login', { replace: true });
        // Force page reload to clear any cached state (optional but extra secure)
        window.location.href = '/login';
    };

    return (
        <AppBar position="fixed">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Typography
                        variant="h6"
                        noWrap
                        component={RouterLink}
                        to="/dashboard"
                        sx={{
                            mr: 2,
                            display: { xs: 'none', md: 'flex' },
                            fontFamily: 'Inter',
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                            fontSize: '1.2rem',
                            lineHeight: 1.75,
                            '&:hover': {
                                color: 'rgb(211, 211, 211)'
                            }
                        }}
                    >
                        NALA-Assess CH3111
                    </Typography>

                    {/* Mobile menu button and title container */}
                    <Box sx={{ 
                        display: { xs: 'flex', md: 'none' }, 
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <IconButton
                            size="large"
                            aria-label="navigation menu"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* Mobile logo */}
                        <Typography
                            variant="h5"
                            noWrap
                            component={RouterLink}
                            to="/dashboard"
                            sx={{
                                display: { xs: 'flex', md: 'none' },
                                fontFamily: 'Inter',
                                fontWeight: 700,
                                fontSize: '1.4rem',
                                color: 'inherit',
                                textDecoration: 'none',
                                lineHeight: 1.75,
                                '&:hover': { color: 'rgb(211, 211, 211)' }
                            }}
                        >
                            NALA-Assess CH3111
                        </Typography>

                        {/* Logout button for mobile */}
                        <IconButton
                            onClick={handleLogout}
                            color="inherit"
                            size="small"
                            sx={{ display: { xs: 'flex', md: 'none' } }}
                        >
                            <LogoutIcon />
                        </IconButton>

                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            keepMounted
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{ display: { xs: 'block', md: 'none' } }}
                        >
                            {pages.map((page) => (
                                <MenuItem
                                    key={page.name}
                                    onClick={handleCloseNavMenu}
                                    component={RouterLink}
                                    to={page.path}
                                    sx={{
                                        '&:hover': {
                                            '& .MuiTypography-root': {
                                                color: 'primary.main'
                                            }
                                        }
                                    }}
                                >
                                    <Typography sx={{ textAlign: 'center' }}>{page.name}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box>

                    {/* Empty flex box to push tabs & avatar to the right */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* Desktop tabs on the right */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                        {pages.map((page) => (
                            <Button
                                key={page.name}
                                component={RouterLink}
                                to={page.path}
                                sx={{
                                    mx: 1,
                                    my: 2,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: 'Inter',
                                    '&:hover': { backgroundColor: 'primary.dark', color: 'white' },
                                    borderRadius: 1,
                                    px: 1.5
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                                    {page.icon}
                                </Box>
                                <Typography sx={{ ml: 0 }}>{page.name}</Typography>
                            </Button>
                        ))}

                        {/* Logout button for desktop */}
                        <Button
                            onClick={handleLogout}
                            sx={{
                                ml: 2,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: 'Inter',
                                '&:hover': { backgroundColor: 'error.main', color: 'white' },
                                borderRadius: 1,
                                px: 1.5
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
                                <LogoutIcon />
                            </Box>
                            <Typography>Logout</Typography>
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;
