import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#1a5455', // Matches hsl(180.6 65.6% 31.4%)
            light: '#2a7c7d',
            dark: '#103536',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#e3832d', // Matches hsl(29.5 92.6% 55%)
            light: '#f1a966',
            dark: '#a65d1a',
            contrastText: '#ffffff',
        },
        background: {
            default: '#080c0c', // Matches hsl(180 20% 4%)
            paper: '#0d1414',   // Matches hsl(180 15% 8%)
        },
        text: {
            primary: '#f2f7f7',
            secondary: '#8da6a6',
        },
        divider: 'rgba(141, 166, 166, 0.12)',
    },
    typography: {
        fontFamily: "'Inter', 'Noto Sans Arabic', sans-serif",
        h1: { fontSize: '2.5rem', fontWeight: 700 },
        h2: { fontSize: '2rem', fontWeight: 600 },
        h3: { fontSize: '1.75rem', fontWeight: 600 },
        h4: { fontSize: '1.5rem', fontWeight: 600 },
        h5: { fontSize: '1.25rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarColor: "#1a5455 #080c0c",
                    "&::-webkit-scrollbar": {
                        width: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                        background: "#080c0c",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: "#1a5455",
                        borderRadius: "10px",
                        "&:hover": {
                            background: "#2a7c7d",
                        },
                    },
                },
                'input:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 100px #0d1414 inset !important',
                    WebkitTextFillColor: '#f2f7f7 !important',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    padding: '8px 20px',
                    transition: 'all 0.2s ease-in-out',
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, hsl(180.6 65.6% 31.4%), hsl(180.6 65.6% 25%))',
                    boxShadow: '0 4px 14px 0 rgba(26, 84, 85, 0.39)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, hsl(180.6 65.6% 28%), hsl(180.6 65.6% 20%))',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(141, 166, 166, 0.2)',
                    '&:hover': {
                        borderColor: '#1a5455',
                        backgroundColor: 'rgba(26, 84, 85, 0.04)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(13, 20, 20, 0.7)',
                    backdropFilter: 'blur(20px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                    border: '1px solid rgba(141, 166, 166, 0.1)',
                    boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backgroundColor: 'rgba(13, 20, 20, 0.6)',
                    backdropFilter: 'blur(16px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                    border: '1px solid rgba(141, 166, 166, 0.15)',
                    boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(8, 12, 12, 0.9)',
                    backdropFilter: 'blur(30px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(160%)',
                    backgroundImage: 'none',
                    border: '1px solid rgba(141, 166, 166, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    borderRadius: '16px',
                },
            },
        },
        MuiMenu: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(13, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundImage: 'none',
                    border: '1px solid rgba(141, 166, 166, 0.15)',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiPopover: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(13, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundImage: 'none',
                    border: '1px solid rgba(141, 166, 166, 0.15)',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(8, 12, 12, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                    boxShadow: 'none',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(8, 12, 12, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: 'none',
                    '&.MuiDrawer-paperAnchorLeft': {
                        borderRight: '1px solid rgba(141, 166, 166, 0.1)',
                    },
                    '&.MuiDrawer-paperAnchorRight': {
                        borderLeft: '1px solid rgba(141, 166, 166, 0.1)',
                    },
                    '&.MuiDrawer-paperAnchorTop': {
                        borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                    },
                    '&.MuiDrawer-paperAnchorBottom': {
                        borderTop: '1px solid rgba(141, 166, 166, 0.1)',
                    },
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '2px 8px',
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(26, 84, 85, 0.15)',
                        color: '#1a5455',
                        '&:hover': {
                            backgroundColor: 'rgba(26, 84, 85, 0.2)',
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(141, 166, 166, 0.08)',
                    },
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid rgba(141, 166, 166, 0.08)',
                    padding: '16px',
                },
                head: {
                    backgroundColor: 'rgba(13, 20, 20, 0.4)',
                    color: '#8da6a6', // text.secondary
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    '&.Mui-focused': {
                        backgroundColor: 'rgba(13, 20, 20, 0.6)',
                    },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(13, 20, 20, 0.4)',
                    '& fieldset': {
                        borderColor: 'rgba(141, 166, 166, 0.1)',
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(141, 166, 166, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#1a5455',
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                select: {
                    '&:focus': {
                        backgroundColor: 'transparent',
                    },
                },
            },
        },
        MuiAutocomplete: {
            styleOverrides: {
                paper: {
                    backgroundColor: 'rgba(13, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(141, 166, 166, 0.1)',
                },
            },
        },
        MuiCheckbox: {
            styleOverrides: {
                root: {
                    color: 'rgba(141, 166, 166, 0.4)',
                    '&.Mui-checked': {
                        color: '#1a5455',
                    },
                },
            },
        },
    },
});

export default theme;
