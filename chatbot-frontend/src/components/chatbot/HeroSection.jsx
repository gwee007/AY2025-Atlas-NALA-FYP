import { Box, Container, Typography, Button, Grid, Stack } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const HeroSection = () => (
  <Box
    sx={{
      background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      color: '#1e293b',
      py: { xs: 6, sm: 8, md: 12 },
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid #e2e8f0'
    }}
  >
    <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
      <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem', lg: '4.5rem' },
                lineHeight: 1.1,
                color: '#0f172a',
                letterSpacing: '-0.03em',
              }}
            >
              NALA-Assess
              <Box component="span" sx={{ display: 'block', color: '#6366f1' }}>
                Chatbot
              </Box>
            </Typography>
            
            <Typography
              variant="h5"
              sx={{
                color: '#64748b',
                fontWeight: 400,
                lineHeight: 1.6,
                maxWidth: '650px',
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
              }}
            >
              Revolutionize your self-learning with self-assessment using SOLO taxonomy — Ask questions, receive personalised feedback, and enhance your critical thinking skills.
            </Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}>
              <Button
                component={Link}
                to="/chatbot/assess"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.5, sm: 1.8 },
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  fontWeight: 700,
                  bgcolor: '#0f172a',
                  color: 'white',
                  borderRadius: 2,
                  textTransform: 'none',
                  boxShadow: '0 10px 20px -10px rgba(15, 23, 42, 0.5)',
                  '&:hover': {
                    bgcolor: '#334155',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Start Assessment
              </Button>
            </Stack>
          </Stack>
        </Grid>
        
        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
          <Box
            sx={{
              position: 'relative',
              height: '400px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 50%, #e0e7ff 0%, transparent 70%)',
            }}
          />
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default HeroSection;
