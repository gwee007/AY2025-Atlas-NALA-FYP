// src/pages/ChatbotPage.jsx
// user selects which chatbot feature to use: NALA-Learn or NALA-Assess
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CardActionArea,
  Typography,
  Button,
  Grid,
  Box
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

export default function ChatbotPage() {
  return (
    <Box sx={{ pt: { xs: 8, md: 10 } }}> 
      <Typography
        variant="h4"
        align="left"
        sx={{
          mt: { xs: 2, md: 3 }, 
          ml: { xs: 1, md: 3 },
          fontFamily: 'Inter',
          fontWeight: 700,
          color: '#1976d2',
          fontSize: { xs: '1.6rem', md: '2.1rem' }
        }}
      >
        Welcome to NALA Chatbot
      </Typography>
      <Typography
        variant="subtitle1"
        align="left"
        sx={{
          ml: { xs: 1, md: 3 },
          fontFamily: 'Inter',
          color: 'text.primary',
          fontSize: { xs: '0.9rem', md: '1rem' } 
        }}
      >
        Select interactive learning with NALA-Learn or self-assessment with NALA-Assess.
      </Typography>
      <Grid
        container
        spacing={{ xs: 2, md: 4 }}
        sx={{
          p: { xs: 1, md: 3 },
          maxWidth: { xs: '100%', md: '1100px' },
          mx: "auto",
          pb: { xs: 5, md: 0 } // extra bottom padding for small screens
        }}
      >
        <Grid item xs={12} md={6} sx={{ mb: { xs: 2, md: 0 }, display: "flex", justifyContent: "center" }}>
          <Card
            sx={{
              width: { xs: '96%', md: 480, lg: 520 }, 
              maxWidth: '100%',
              borderRadius: 2,
              boxShadow: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardActionArea>
              <CardMedia
                component="img"
                height="180"
                image="/nala_learn_logo.jpg"
                alt="NALA-Learn"
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
                  color="text.primary"
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
            <CardActions>
              <Button
                size="small"
                color="primary"
                href="/chatbot/learn"
                sx={{
                  ":hover": { backgroundColor: '#1565c0', color: 'white' },
                  borderRadius: 2,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.5, md: 1 },
                  transition: 'background 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.5, md: 1 }
                }}
              >
                <PlayArrow sx={{ mr: 0.5, minWidth: 0 }} />
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: { xs: '0.85rem', md: '0.95rem' } 
                  }}
                >
                  Start Learning
                </Typography>
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
          <Card
            sx={{
              width: { xs: '96%', md: 480, lg: 520 }, 
              maxWidth: '100%',
              borderRadius: 2,
              boxShadow: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardActionArea>
              <CardMedia
                component="img"
                height="180"
                image="/nala_assess_logo.jpg"
                alt="NALA-Assess"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    gutterBottom
                    variant="h5"
                    component="div"
                    sx={{
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', md: '1.08rem' }, 
                      mb: 0
                    }}
                  >
                    NALA-Assess
                  </Typography>
                  <Box
                    component="span"
                    sx={{
                      backgroundColor: '#ff1744',
                      color: 'white',
                      fontSize: { xs: '0.62rem', md: '0.7rem' }, // reduced
                      fontWeight: 700,
                      borderRadius: '8px',
                      px: 1.2,
                      py: 0.2,
                      ml: 0.5,
                      letterSpacing: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      lineHeight: 1.4,
                      boxShadow: '0 1px 4px rgba(255,23,68,0.15)'
                    }}
                  >
                    New
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.primary"
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
            <CardActions>
              <Button
                size="small"
                color="primary"
                href="/chatbot/assess"
                sx={{
                  ":hover": { backgroundColor: '#1565c0', color: 'white' },
                  borderRadius: 2,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.5, md: 1 },
                  transition: 'background 0.2s, color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.5, md: 1 }
                }}
              >
                <PlayArrow sx={{ mr: 0.5, minWidth: 0 }} />
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: { xs: '0.85rem', md: '0.95rem' } 
                  }}
                >
                  Start Assessment
                </Typography>
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}