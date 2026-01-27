import { Box, Container, Typography, Grid, Paper, Stack } from '@mui/material';
import { 
  QuestionAnswer, 
  Assessment, 
  Feedback, 
  Psychology, 
  School
} from '@mui/icons-material';

const assessmentSteps = [
  {
    label: 'Ask Your Question',
    description: 'Students submit their questions about Process Control and Dynamics.',
    icon: <QuestionAnswer fontSize="large" />,
    color: '#3b82f6',
  },
  {
    label: 'Question Evaluation using SOLO Taxonomy',
    description: 'NALA evaluates the cognitive complexity of your question using SOLO taxonomy levels.',
    icon: <Psychology fontSize="large" />,
    color: '#8b5cf6',
  },
  {
    label: 'Consult Reference Materials',
    description: 'The chatbot points out relevant reference materials and resources to help you answer your question.',
    icon: <School fontSize="large" />,
    color: '#f59e0b',
  },
  {
    label: 'Submit Your Answer',
    description: 'Provide your answer based on the reference materials and your understanding.',
    icon: <Assessment fontSize="large" />,
    color: '#10b981',
  },
  {
    label: 'Answer Evaluation & Feedback',
    description: 'Receive detailed evaluation against reference material with personalized feedback for improvement.',
    icon: <Feedback fontSize="large" />,
    color: '#ef4444',
  },
];

const AssessmentFlowSection = () => (
  <Box sx={{ bgcolor: '#f8fafc', py: { xs: 6, md: 10 } }}>
    <Container maxWidth="xl">
      <Stack spacing={{ xs: 4, md: 6 }}>
        {/* Header */}
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: '#1e293b',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' },
            }}
          >
            Self-Assessment Flow
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.125rem' }, 
              lineHeight: 1.7,
              maxWidth: { xs: '100%', md: '900px' }
            }}
          >
            Follow our streamlined assessment process to maximize your learning outcomes in just five simple steps.
          </Typography>
        </Box>

        {/* Vertical Step Cards */}
        <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ width: '100%' }}>
          {assessmentSteps.map((step, index) => (
            <Paper
              key={step.label}
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5, lg: 4 },
                borderRadius: { xs: 2, md: 3 },
                border: '2px solid',
                borderColor: '#e2e8f0',
                background: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: step.color,
                  transform: { xs: 'translateY(-4px)', md: 'translateX(8px)' },
                  boxShadow: `0 12px 32px ${step.color}20`,
                },
              }}
            >
              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3, lg: 4 }} alignItems="center">
                {/* Step Icon Circle */}
                <Grid item xs="auto">
                  <Box
                    sx={{
                      width: { xs: 50, sm: 60, md: 80 },
                      height: { xs: 50, sm: 60, md: 80 },
                      borderRadius: '50%',
                      background: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 8px 24px ${step.color}40`,
                      position: 'relative',
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    }}
                  >
                    {step.icon}

                    {/* Step Number Badge */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 900,
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.5rem' },
                        position: 'absolute',
                        top: { xs: -6, md: -8 },
                        right: { xs: -6, md: -8 },
                        width: { xs: 24, md: 32 },
                        height: { xs: 24, md: 32 },
                        borderRadius: '50%',
                        bgcolor: 'white',
                        color: step.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `3px solid ${step.color}`,
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs>
                  <Stack spacing={1}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#1e293b',
                        fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.25rem' },
                      }}
                    >
                      {step.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.7,
                        fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                      }}
                    >
                      {step.description}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Container>
  </Box>
);

export default AssessmentFlowSection;
