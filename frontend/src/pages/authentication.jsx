import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid'; // Agar ye error de, to: import Grid from '@mui/material/Grid2';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import bgImage from '../assets/bg.jpg';
import Snackbar from '@mui/material/Snackbar';
import { AuthContext } from '../contexts/AuthContext';

const defaultTheme = createTheme();

export default function Authentication() {

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [error, setError] = React.useState("");
    const [message, setMessage] = React.useState("");

    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);


    const { handleRagister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        try {

            if (formState === 0) {
                let result = await handleLogin(username, password);
                setError("");
                setMessage("Login Successful! Redirecting... 🎉");
                setOpen(true);
            }


            if (formState === 1) {

                let result = await handleRagister(name, username, password);
                console.log(result);
                setMessage(result);
                setOpen(true);
                setError("");
                setUsername("");
                setFormState(0);
                setPassword("");
            }

        } catch (err) {
            console.log("🔴 Error Aaya:", err);

            let message = err.response.data.message
            setError(message);
            setMessage(message);
            setOpen(true);
        }
    }
    const handleClose = () => {
        setOpen(false);
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />

                {/* IMAGE GRID */}
                <Grid
                    size={{ xs: 12, sm: 4, md: 7 }} // ✅ Fix 2: 'item' hataya, 'size' use kiya (MUI v6)
                    sx={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        minHeight: '100vh'
                    }}
                />

                {/* FORM GRID */}
                <Grid
                    size={{ xs: 12, sm: 8, md: 5 }} // ✅ Fix: 'size' prop use kiya
                    component={Paper}
                    elevation={6}
                    square
                >
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>

                        <div>
                            <Button variant={formState === 0 ? "contained" : "outlined"} onClick={() => setFormState(0)} sx={{ mr: 1 }}>
                                Sign In
                            </Button>
                            <Button variant={formState === 1 ? "contained" : "outlined"} onClick={() => setFormState(1)}>
                                Sign Up
                            </Button>
                        </div>

                        <Box component="form" noValidate sx={{ mt: 1, width: '100%', maxWidth: { md: '450px' } }}>

                            {/* Sign Up Fields */}
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="fullName"
                                    label="Full Name"
                                    name="fullName"
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            )}

                            <TextField
                                margin="normal" required fullWidth
                                id="username" label="Username" name="username"
                                autoFocus={formState === 0}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <TextField
                                margin="normal" required fullWidth
                                name="password" label="Password" type="password" id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {/* Error Message Display */}
                            <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Login" : "Register"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={handleClose}
                message={message}
            />
        </ThemeProvider>
    );
}