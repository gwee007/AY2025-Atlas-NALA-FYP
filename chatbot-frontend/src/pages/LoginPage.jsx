import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  PersonOutlined as PersonIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [showUserId, setShowUserId] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.verifyUser(userId.trim()));
      const data = await response.json();

      if (response.ok && data.exists) {
        login(userId.trim());
        navigate('/dashboard');
      } else {
        setError('User ID not found. Failed to login.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to verify User ID. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 20s infinite ease-in-out',
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-20px, -20px)' },
        },
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: { xs: '2.5rem 1.5rem', sm: '3.5rem 3rem' },
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Logo/Icon Area */}
          <Box
            sx={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            }}
          >
            <PersonIcon sx={{ fontSize: '2.5rem', color: 'white' }} />
          </Box>

          {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: '#1a202c',
              marginBottom: '0.5rem',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
            }}
          >
            NALA-Assess
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#718096',
              marginBottom: '2.5rem',
              fontSize: '0.95rem',
            }}
          >
            Sign in to continue your learning journey
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  '& .MuiAlert-icon': {
                    color: '#dc2626',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="User ID"
              variant="outlined"
              type={showUserId ? 'text' : 'password'}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
              placeholder="Enter your User ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#a0aec0' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle user id visibility"
                      onClick={() => setShowUserId(!showUserId)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      sx={{
                        color: '#a0aec0',
                        '&:hover': {
                          color: '#667eea',
                        },
                      }}
                    >
                      {showUserId ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                'aria-label': 'User ID',
              }}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleLogin(e);
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  borderRadius: '12px',
                  backgroundColor: '#f7fafc',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                    borderWidth: '2px',
                  },
                  '&:hover': {
                    backgroundColor: '#edf2f7',
                    '& fieldset': {
                      borderColor: '#cbd5e0',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#718096',
                  '&.Mui-focused': {
                    color: '#667eea',
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                marginTop: '0.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.05rem',
                padding: '0.875rem',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#a0aec0',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Signing in...
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              marginTop: '2.5rem',
              color: '#a0aec0',
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            FOR PROCESS CONTROL AND DYNAMICS (CH3111)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
