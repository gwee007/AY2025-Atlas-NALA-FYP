import { Box, Container, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const CTASection = () => (
  <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0f172a', color: 'white', textAlign: 'center' }}>
    <Container maxWidth="md" sx={{ px: { xs: 3, sm: 4 } }}>
      <Typography 
        variant="h3" 
        sx={{ 
          fontWeight: 800, 
          mb: 3,
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' }
        }}
      >
        Ready to test your knowledge?
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 400, 
          color: '#cbd5e1', 
          mb: 5, 
          lineHeight: 1.6,
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
        }}
      >
        You have learned the content but how deep is your understanding? Challenge yourself with NALA-Assess.
      </Typography>
      <Button
        component={Link}
        to="/chatbot/assess"
        variant="contained"
        size="large"
        disableElevation
        sx={{
          bgcolor: '#6366f1',
          color: 'white',
          px: { xs: 4, sm: 6 },
          py: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1rem', sm: '1.1rem' },
          fontWeight: 700,
          borderRadius: 2,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { xs: '100%', sm: 'none' },
          '&:hover': { 
            bgcolor: '#4f46e5',
            color: 'white',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.4)',
          }
        }}
      >
        Start Assessment Now
      </Button>
    </Container>
  </Box>
);

export default CTASection;
