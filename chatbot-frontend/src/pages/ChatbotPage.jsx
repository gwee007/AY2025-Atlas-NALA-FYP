// src/pages/ChatbotPage.jsx
// user selects which chatbot feature to use: NALA-Learn or NALA-Assess
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CardActionArea,
  Grid,
  Typography,
  Button,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

export default function ChatbotPage() {
  return (
    <Box sx={{ 
      pt: { xs: 8, md: 10 }, 
      maxWidth: 1200, 
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 }
    }}>
      <Typography
        variant="h4"
        align="left"
        sx={{
          mt: { xs: 2, md: 3 }, 
          mb: { xs: 2, md: 4 },
          fontFamily: 'Inter',
          fontWeight: 700,
          color: '#1976d2',
          fontSize: { xs: '1.6rem', md: '2.1rem' }
        }}
      >
        Welcome to NALA Chatbot
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} display="flex" justifyContent="center">
          <Card
            sx={{
              width: { xs: '96%', md: 480, lg: 520 },
              maxWidth: 500,
              borderRadius: 2,
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardActionArea>
              <CardMedia
                component="img"
                height="180"
                image="/nala_learn_logo.jpg"
                alt="NALA Learn"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', md: '1.08rem' } 
                  }}
                >
                  NALA-Learn
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: { xs: '0.78rem', md: '0.85rem' } 
                  }}
                >
                  Looking for a learning companion? NALA-Learn provides instant answers, guidance, interactive discussions, and AI-generated questions to test your understanding.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ mt: 'auto', p: 2 }}>
              <Button
                variant="contained"
                size="medium"
                href="/chatbot/learn"
                endIcon={<PlayArrow />}
                sx={{
                  textTransform: 'none',
                  ":hover": { backgroundColor: '#4caf50', color: 'white' },
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                Start Learning
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card 2 */}
        <Grid item xs={12} md={6} sx={{ mb: { xs: 2, md: 0 }, display: "flex", justifyContent: "center" }}>
          <Card
            sx={{
              width: { xs: '96%', md: 480, lg: 520 },
              maxWidth: 500,
              borderRadius: 2,
              boxShadow: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardActionArea>
              <CardMedia
                component="img"
                height="180"
                image="/nala_assess_logo.jpg"
                alt="NALA Assess"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                  <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 700,
                    fontSize: { xs: '0.95rem', md: '1.08rem' } 
                  }}
                  >
                    NALA-Assess
                  </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: { xs: '0.78rem', md: '0.85rem' } 
                  }}
                >
                  Want to create your own exam questions and challenge yourself? Try out NALA self-assessment feature, sharpen your critical thinking, and receive personalised feedback.
                </Typography>
              </CardContent>
            </CardActionArea>
            <CardActions sx={{ mt: 'auto', p: 2 }}>
              <Button
                variant="contained"
                size="medium"
                href="/chatbot/assess"
                endIcon={<PlayArrow />}
                sx={{
                  textTransform: 'none',
                  ":hover": { backgroundColor: '#4caf50', color: 'white' },
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                Start Assessment
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}