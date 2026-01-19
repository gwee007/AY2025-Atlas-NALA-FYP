import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Card,
  CardContent,
  useTheme,
  Avatar,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  PlayArrow,
  QuestionAnswer,
  Assessment,
  Feedback,
  Psychology,
  AutoAwesome,
  TrendingUp,
  School,
  ArrowForward,
  CheckCircle,
  EmojiObjects,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const assessmentSteps = [
  {
    label: 'Ask Your Question',
    description: 'Students submit their questions about Process Control and Dynamics.',
    icon: <QuestionAnswer fontSize="large" />,
    color: '#667eea',
  },
  {
    label: 'Question Evaluation using SOLO Taxonomy',
    description: 'NALA evaluates the cognitive complexity of your question using SOLO taxonomy levels.',
    icon: <Psychology fontSize="large" />,
    color: '#764ba2',
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

const soloLevels = [
  {
    level: 'Unistructural',
    grade: 'C',
    color: '#ff9800',
    gradient: 'linear-gradient(135deg, #ff9800 0%, #fb8c00 100%)',
    description: 'Asks about a fact or definition of a single concept.',
  },
  {
    level: 'Multistructural',
    grade: 'B',
    color: '#2196f3',
    gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    description: 'Asks about listing or describing multiple concepts of the same topic.',
  },
  {
    level: 'Relational',
    grade: 'A',
    color: '#4caf50',
    gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
    description: 'Asks about causes, compares, analyzes, or integrates concepts from different topics.',
  },
  {
    level: 'Extended Abstract',
    grade: 'A+',
    color: '#9c27b0',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
    description: 'Generalizes or hypothesizes topic concepts to real-life industrial applications.',
  },
];

export default function ChatbotPage() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#fafbfc' }}>
      {/* Enhanced Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Chip
                  label="AI-Powered Learning Assessment"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    width: 'fit-content',
                    backdropFilter: 'blur(10px)',
                  }}
                  icon={<AutoAwesome sx={{ color: 'white !important' }} />}
                />
                
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.5rem', md: '3.75rem', lg: '4.5rem' },
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  NALA-Assess
                  <br />
                  <Box component="span" sx={{ color: '#ffd54f' }}>
                    Chatbot
                  </Box>
                </Typography>
                
                <Typography
                  variant="h5"
                  sx={{
                    opacity: 0.95,
                    fontWeight: 400,
                    lineHeight: 1.6,
                    maxWidth: '650px',
                    fontSize: { xs: '1.1rem', md: '1.35rem' },
                  }}
                >
                  Revolutionize your self-learning with reverse assessment using SOLO taxonomy — Ask questions, receive personalized feedback, and enhance your critical thinking skills.
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    component={Link}
                    to="/chatbot/assess"
                    variant="contained"
                    size="large"
                    endIcon={<PlayArrow />}
                    sx={{
                      px: 5,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      bgcolor: '#ffd54f',
                      color: '#1a1a1a',
                      textTransform: 'none',
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(255, 213, 79, 0.4)',
                      '&:hover': {
                        bgcolor: '#ffcc02',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(255, 213, 79, 0.5)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Start Assessment
                  </Button>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '400px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp sx={{ fontSize: '10rem', opacity: 0.8 }} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Assessment Flow Section */}
      <Box sx={{ bgcolor: 'white', py: 10 }}>
        <Container maxWidth="xl">
          <Stack spacing={6}>
            <Box sx={{ maxWidth: '800px' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  color: '#1e293b',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Reverse Assessment Flow
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', lineHeight: 1.7 }}>
                Follow our streamlined assessment process to maximize your learning outcomes in just five simple steps.
              </Typography>
            </Box>

            {/* Vertical Step Cards */}
            <Stack spacing={3} sx={{ mt: 4 }}>
              {assessmentSteps.map((step, index) => (
                <Paper
                  key={step.label}
                  elevation={0}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: '#e2e8f0',
                    background: 'white',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: step.color,
                      transform: 'translateX(8px)',
                      boxShadow: `0 12px 32px ${step.color}20`,
                    },
                  }}
                >
                  <Grid container spacing={3} alignItems="center">
                    {/* Step Number Circle */}
                    <Grid item xs="auto">
                      <Box
                        sx={{
                          width: { xs: 60, md: 80 },
                          height: { xs: 60, md: 80 },
                          borderRadius: '50%',
                          background: step.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: `0 8px 24px ${step.color}40`,
                          position: 'relative',
                        }}
                      >
                        {/* Step Number */}
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 900,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 32,
                            height: 32,
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
                        {step.icon}
                      </Box>
                    </Grid>

                    <Grid item xs>
                      <Stack spacing={1}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                          }}
                        >
                          {step.label}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            lineHeight: 1.7,
                            fontSize: { xs: '0.85rem', md: '0.9rem' },
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

      {/* SOLO Taxonomy Section */}
      <Box sx={{ bgcolor: '#f8fafc', py: 10 }}>
        <Container maxWidth="xl">
          <Stack spacing={6}>
            <Box sx={{ maxWidth: '900px' }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                }}
              >
                Understanding SOLO Taxonomy
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', lineHeight: 1.7, mb: 2 }}>
                NALA-Assess uses the Structure of Observed Learning Outcomes (SOLO) taxonomy to evaluate the cognitive complexity of your questions and responses.
              </Typography>
              <Chip
                label="Currently Used for CH3111 Process Control and Dynamics Only"
                sx={{
                  bgcolor: '#667eea',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
                icon={<EmojiObjects sx={{ color: 'white !important' }} />}
              />
            </Box>

            {/* SOLO Level Cards */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {soloLevels.map((level, index) => (
                <Grid item xs={12} sm={6} lg={3} key={level.level}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      height: '280px', // Fixed height for uniformity
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: level.color,
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${level.color}30`,
                      },
                    }}
                  >
                    {/* Colored header */}
                    <Box
                      sx={{
                        background: level.gradient,
                        p: 3,
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <Chip
                        label={`Level ${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          color: 'white',
                          fontWeight: 700,
                          backdropFilter: 'blur(10px)',
                          width: 'fit-content',
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {level.level}
                        </Typography>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 900, 
                            fontSize: '2rem',
                            opacity: 0.9
                          }}
                        >
                          {level.grade}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: 'text.secondary' }}>
                        {level.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Box
        sx={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
          color: 'white',
          py: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={4} alignItems="center" textAlign="center">
            
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                maxWidth: '700px',
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              ✨ Ready to Level Up Your Understanding?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                opacity: 0.9,
                maxWidth: '600px',
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              You have learned the content but how deep is your understanding? Challenge yourself with NALA-Assess!
            </Typography>

            <Button
              component={Link}
              to="/chatbot/assess"
              variant="contained"
              size="large"
              endIcon={<PlayArrow />}
              sx={{
                mt: 2,
                px: 6,
                py: 2.5,
                fontSize: '1.2rem',
                fontWeight: 700,
                bgcolor: '#ffd54f',
                color: '#1a1a1a',
                borderRadius: 50,
                boxShadow: '0 8px 32px rgba(255, 213, 79, 0.4)',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#ffcc02',
                  transform: 'scale(1.05)',
                  boxShadow: '0 12px 40px rgba(255, 213, 79, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Assessment Now
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}