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
} from '@mui/material';
import {
  PersonOutlined as PersonIcon,
} from '@mui/icons-material';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
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
        setError('User ID not found. Please check your User ID and try again.');
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
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '3rem 2rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
          }}
        >
          {/* Heading */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '0.5rem',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
            }}
          >
            Welcome to
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#6366f1',
              marginBottom: '2rem',
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
            }}
          >
            NALA-Assess
          </Typography>

          {/* Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="User ID"
              variant="outlined"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
              placeholder="Enter your User ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#94a3b8', mr: 1 }} />
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
                  borderRadius: '8px',
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6366f1',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#cbd5e1',
                  opacity: 1,
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
                marginTop: '1rem',
                backgroundColor: '#0f172a',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                textTransform: 'none',
                transition: 'background-color 0.2s ease',
                '&:hover': {
                  backgroundColor: '#1e293b',
                },
                '&:disabled': {
                  backgroundColor: '#cbd5e1',
                  color: '#94a3b8',
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
              marginTop: '2rem',
              color: '#94a3b8',
              fontSize: '0.85rem',
            }}
          >
            NTU NALA CH3111 • Assessment Platform
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
