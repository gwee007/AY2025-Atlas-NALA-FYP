import { Box, Typography } from '@mui/material';

const SectionHeader = ({ title, subtitle, centered = false }) => (
  <Box sx={{ 
    mb: { xs: 4, md: 6 }, 
    textAlign: centered ? 'center' : 'left',
    maxWidth: centered ? '800px' : '100%',
    mx: centered ? 'auto' : 0
  }}>
    <Typography 
      variant="h4" 
      component="h2" 
      sx={{ 
        fontWeight: 800, 
        color: '#1e293b', 
        mb: 2,
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
      }}
    >
      {title}
    </Typography>
    <Typography 
      variant="body1" 
      sx={{ 
        color: '#64748b', 
        fontSize: { xs: '0.95rem', sm: '1rem', md: '1.125rem' }, 
        lineHeight: 1.6,
        maxWidth: { xs: '100%', md: '900px' }
      }}
    >
      {subtitle}
    </Typography>
  </Box>
);

export default SectionHeader;
