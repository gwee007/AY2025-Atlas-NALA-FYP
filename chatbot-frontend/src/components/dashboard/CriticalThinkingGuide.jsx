import React, { useState } from 'react';
import { Box, Paper, Typography, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SchoolIcon from '@mui/icons-material/School';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';

export default function CriticalThinkingGuide() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredSection, setHoveredSection] = useState(null);

    const guideSections = [
        {
            id: 'planning',
            title: '1. Planning',
            subtitle: 'Set Your Learning Goals',
            icon: <LightbulbOutlinedIcon />,
            color: '#1976d2',
            summary: 'Review your performance and identify areas needing improvement',
            details: [
                'Look at your topic performance scores - which areas need improvement?',
                'Identify patterns in your mistakes across different topics',
                'Set specific goals: "I will improve my understanding of X by Y"',
                'Prioritize topics based on difficulty and importance'
            ],
            questions: [
                'What topics am I struggling with the most?',
                'Why might I be finding this topic difficult?',
                'What resources should I use?'
            ]
        },
        {
            id: 'monitoring',
            title: '2. Monitoring',
            subtitle: 'Track Your Progress',
            icon: <CheckCircleOutlineIcon />,
            color: '#2e7d32',
            summary: 'Use performance trends to see if you\'re improving',
            details: [
                'Compare your recent scores with earlier attempts',
                'Notice which topics show consistent improvement vs. stagnation',
                'Pay attention to question evaluation scores',
                'Check if your learning strategies are working'
            ],
            questions: [
                'Am I making progress on my weak areas?',
                'Are my learning strategies effective?',
                'Do I need to adjust my approach?'
            ]
        },
        {
            id: 'evaluation',
            title: '3. Evaluation',
            subtitle: 'Reflect on Your Learning',
            icon: <TipsAndUpdatesIcon />,
            color: '#ed6c02',
            summary: 'Analyze your learning patterns and adjust strategies',
            details: [
                'Review the AI-generated summary for insights',
                'Analyze topic relationships - understand how concepts connect',
                'Reflect on both successful and unsuccessful attempts',
                'Consider if you\'re truly understanding or just memorizing'
            ],
            questions: [
                'What learning strategies worked best?',
                'What should I do differently next time?',
                'How can I apply this to new problems?'
            ]
        },
        {
            id: 'dashboard',
            title: '4. Using the Dashboard',
            subtitle: 'Maximize Your Learning Tools',
            icon: <SchoolIcon />,
            color: '#0288d1',
            summary: 'Learn how to effectively navigate and use dashboard features',
            details: [
                'Click on topic bars to filter and see detailed performance',
                'Use the time period selector to compare learning phases',
                'Review recent activities to identify study patterns',
                'Look for correlations between question quality and accuracy'
            ],
            questions: [
                'Which features am I using effectively?',
                'What insights am I gaining from the data?',
                'How can I use this information to improve?'
            ],
            tips: [
                'Regular review beats cramming - check weekly',
                'Focus on understanding WHY, not just scores',
                'Use the chatbot to explore struggling topics',
                'Connect related topics - learning isn\'t isolated!'
            ]
        }
    ];

    return (
        <Paper 
            elevation={3} 
            sx={{ 
                mt: 4, 
                mb: 3,
                overflow: 'hidden',
                borderRadius: 2,
                border: '1px solid #e0e0e0'
            }}
        >
            {/* Collapsible Header */}
            <Box
                sx={{
                    p: 2,
                    backgroundColor: '#f5f7fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: '#e8ecf1'
                    }
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoStoriesIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                            Guide: Self-Regulated Learning Framework
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Learn how to effectively use this dashboard for metacognitive learning
                        </Typography>
                    </Box>
                </Box>
                <IconButton>
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>

            {/* Expandable Content */}
            <Collapse in={isExpanded}>
                <Box sx={{ p: 3, backgroundColor: '#fafafa' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                        💡 Hover over each section to reveal detailed guidance
                    </Typography>

                    {/* Grid of Cards */}
                    <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                        gap: 2
                    }}>
                        {guideSections.map((section) => (
                            <Paper
                                key={section.id}
                                elevation={hoveredSection === section.id ? 4 : 1}
                                onMouseEnter={() => setHoveredSection(section.id)}
                                onMouseLeave={() => setHoveredSection(null)}
                                sx={{
                                    p: 2.5,
                                    borderLeft: `4px solid ${section.color}`,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    backgroundColor: hoveredSection === section.id ? '#ffffff' : '#f9f9f9',
                                    transform: hoveredSection === section.id ? 'translateY(-4px)' : 'translateY(0)',
                                    height: hoveredSection === section.id ? 'auto' : '140px',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Box sx={{ 
                                        color: section.color,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {React.cloneElement(section.icon, { sx: { fontSize: 28 } })}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600} color={section.color}>
                                            {section.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {section.subtitle}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Summary (Always Visible) */}
                                <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                        mb: 2,
                                        fontWeight: hoveredSection === section.id ? 500 : 400
                                    }}
                                >
                                    {section.summary}
                                </Typography>

                                {/* Detailed Content (Revealed on Hover) */}
                                {hoveredSection === section.id && (
                                    <Box sx={{ 
                                        animation: 'fadeIn 0.3s ease-in',
                                        '@keyframes fadeIn': {
                                            from: { opacity: 0 },
                                            to: { opacity: 1 }
                                        }
                                    }}>
                                        {/* Action Items */}
                                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: section.color }}>
                                            ✓ What to do:
                                        </Typography>
                                        <Box component="ul" sx={{ pl: 2, mb: 2, m: 0 }}>
                                            {section.details.map((item, idx) => (
                                                <Typography 
                                                    key={idx}
                                                    component="li" 
                                                    variant="body2" 
                                                    sx={{ mb: 0.5, lineHeight: 1.6 }}
                                                >
                                                    {item}
                                                </Typography>
                                            ))}
                                        </Box>

                                        {/* Reflective Questions */}
                                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: section.color }}>
                                            🤔 Ask yourself:
                                        </Typography>
                                        <Box sx={{ 
                                            backgroundColor: `${section.color}10`,
                                            borderRadius: 1,
                                            p: 1.5,
                                            mb: section.tips ? 2 : 0
                                        }}>
                                            {section.questions.map((q, idx) => (
                                                <Typography 
                                                    key={idx}
                                                    variant="body2" 
                                                    sx={{ 
                                                        mb: idx < section.questions.length - 1 ? 1 : 0,
                                                        fontStyle: 'italic',
                                                        color: 'text.secondary'
                                                    }}
                                                >
                                                    • {q}
                                                </Typography>
                                            ))}
                                        </Box>

                                        {/* Tips (if available) */}
                                        {section.tips && (
                                            <>
                                                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: section.color }}>
                                                    💡 Pro Tips:
                                                </Typography>
                                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                                    {section.tips.map((tip, idx) => (
                                                        <Typography 
                                                            key={idx}
                                                            component="li" 
                                                            variant="body2" 
                                                            sx={{ 
                                                                mb: 0.5, 
                                                                fontStyle: 'italic',
                                                                color: 'text.secondary'
                                                            }}
                                                        >
                                                            {tip}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                )}

                                {/* Hover Hint */}
                                {hoveredSection !== section.id && (
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: 'text.secondary',
                                            fontStyle: 'italic',
                                            display: 'block',
                                            mt: 1
                                        }}
                                    >
                                        Hover to see more...
                                    </Typography>
                                )}
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </Paper>
    );
}
