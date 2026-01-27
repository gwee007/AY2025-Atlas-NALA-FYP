import { Box, Container, Stack, Typography, Divider } from '@mui/material';
import SectionHeader from './SectionHeader';

// Integrated SOLO Taxonomy Levels - aligned with question_eval.py and answer_eval.py
const soloLevels = [
  {
    level: 'Unistructural',
    questionGrade: 'C',
    color: '#f97316',
    questionDescription: 'Asks about a fact or definition.',
    questionExamples: 'Define, identify, what is',
    answerScoring: '100% (correct answer) or 0% (wrong answer)',
    answerDescription: 'Answer must be factually correct or entirely wrong.',
  },
  {
    level: 'Multistructural',
    questionGrade: 'B',
    color: '#0ea5e9',
    questionDescription: 'Asks about listing or describing multiple concepts of the same topic.',
    questionExamples: 'List, describe, enumerate',
    answerScoring: 'Level 3: Complete and correct | Level 2: Incomplete but shows mastery | Level 1: Wrong and lacks fundamental understanding',
    answerDescription: 'Answer evaluated based on completeness and concept mastery.',
  },
  {
    level: 'Relational',
    questionGrade: 'A',
    color: '#22c55e',
    questionDescription: 'Asks about causes, compares, analyzes, or integrates concepts from different topics.',
    questionExamples: 'Analyze, compare, integrate, explain',
    answerScoring: 'Level 3: Complete and correct | Level 2: Incomplete but shows mastery | Level 1: Wrong and lacks fundamental understanding',
    answerDescription: 'Answer evaluated based on completeness and concept mastery.',
  },
  {
    level: 'Extended Abstract',
    questionGrade: 'A+',
    color: '#a855f7',
    questionDescription: 'Asks about application of topic concepts to appropriate real-world industrial chemical engineering scenarios.',
    questionExamples: 'Apply, hypothesize, evaluate',
    answerScoring: 'Level 3: Correctly synthesises and applies concepts to real-world context | Level 2: Partially synthesizes but lacks contextual depth | Level 1: Fails to synthesize appropriately',
    answerDescription: 'Answer evaluated on synthesis and contextual application.',
  },
];

const SoloTaxonomySection = () => {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#ffffff' }}>
      <Container maxWidth="xl">
        <SectionHeader 
          title="SOLO Taxonomy Grading Framework" 
          subtitle="Structure of Observed Learning Outcomes (SOLO) taxonomy is used to evaluate both questions and answers based on cognitive complexity."
        />

        <Stack spacing={{ xs: 3.5, md: 4 }} sx={{ width: '100%' }}>
          {soloLevels.map((level, index) => (
            <Box
              key={level.level}
              sx={{
                borderLeft: `5px solid ${level.color}`,
                bgcolor: '#f8fafc',
                borderRadius: { xs: 1, md: 2 },
                pl: { xs: 2.5, sm: 3, md: 4 },
                pr: { xs: 2.5, sm: 3, md: 4 },
                py: { xs: 2.5, sm: 3, md: 3.5 },
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: `${level.color}05`,
                  boxShadow: `0 4px 20px ${level.color}15`,
                },
              }}
            >
              {/* Header */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 0.5, sm: 2 }} 
                alignItems={{ xs: 'flex-start', sm: 'baseline' }} 
                sx={{ mb: { xs: 2, md: 2.5 } }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#1e293b',
                    fontSize: { xs: '1.15rem', sm: '1.2rem', md: '1.35rem' },
                    lineHeight: 1.2
                  }}
                >
                  {index + 1}. {level.level}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    color: level.color,
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  Question Grade: {level.questionGrade}
                </Typography>
              </Stack>

              {/* Question Grading */}
              <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase', 
                    fontWeight: 700, 
                    color: '#475569',
                    letterSpacing: '0.8px',
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}
                >
                  Question Criteria
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1e293b', 
                    mt: 1, 
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                    fontWeight: 500
                  }}
                >
                  {level.questionDescription}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#64748b', 
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    Key verbs:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: level.color, 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      fontWeight: 600
                    }}
                  >
                    {level.questionExamples}
                  </Typography>
                </Box>
              </Box>

              {/* Divider */}
              <Divider sx={{ my: { xs: 2, md: 2.5 }, borderColor: '#cbd5e1', borderWidth: 1.5 }} />

              {/* Answer Scoring */}
              <Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    textTransform: 'uppercase', 
                    fontWeight: 700, 
                    color: '#475569',
                    letterSpacing: '0.8px',
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}
                >
                  Answer Scoring Levels
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#1e293b', 
                    mt: 1, 
                    lineHeight: 1.7,
                    fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                    fontWeight: 500,
                    mb: 1.5
                  }}
                >
                  {level.answerDescription}
                </Typography>
                
                {/* Answer Scoring Breakdown */}
                <Box 
                  sx={{ 
                    bgcolor: 'white', 
                    borderRadius: 1.5,
                    p: { xs: 1.5, sm: 2, md: 2.5 },
                    border: `1px solid ${level.color}30`,
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#334155', 
                      lineHeight: 1.8,
                      fontSize: { xs: '0.85rem', sm: '0.9rem', md: '0.95rem' },
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {level.answerScoring.split('|').map((item, i) => (
                      <Box 
                        key={i} 
                        component="span" 
                        sx={{ 
                          display: 'block',
                          mb: i < level.answerScoring.split('|').length - 1 ? 1 : 0,
                          pl: 1,
                          borderLeft: i === 0 ? `3px solid ${level.color}` : 'none'
                        }}
                      >
                        {item.trim()}
                      </Box>
                    ))}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default SoloTaxonomySection;
