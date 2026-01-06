import React, { useState, useEffect, useRef, startTransition } from 'react';
// import {fetchDashboardStats, fetchRecentActivities} from '../services/api'
import LineChart from '../components/charts/LineChart';
import ReflectiveBarChart from '../components/charts/ReflectiveBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import TopicGraph from '../components/charts/TopicGraph';
import { Button } from '@mui/material';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';
import ReactMarkdown from 'react-markdown';

// NOT THE ACTUAL DASHBOARD, JUST A PLACEHOLDER

// Responsive Chart Wrapper Component
function ResponsiveReflectiveBarChart({ data, height, onCategoryClick, selectedCategory }) {
    const [width, setWidth] = useState(700);
    const containerRef = useRef(null);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                // Set width to 90% of container width, with minimum of 500px and maximum of 1000px
                const newWidth = Math.max(500, Math.min(1000, containerWidth * 0.9));
                setWidth(newWidth);
            }
        };

        // Initial width calculation
        updateWidth();

        // Update width on window resize
        window.addEventListener('resize', updateWidth);
        
        // Cleanup
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <ReflectiveBarChart 
                data={data}
                width={width} 
                height={height}
                onCategoryClick={onCategoryClick}
                selectedCategory={selectedCategory}
            />
        </div>
    );
}

export default function DashboardPage() {
    const [selectedTopic, setSelectedTopic] = useState(null);

   // const [selectedTopic, setselectedTopic] = useState(null); // For filtering charts by topic
    const [searchTerm, setSearchTerm] = useState('');
    // LLM-generated summary - fetched from API
    const [llmSummary, setLlmSummary] = useState('Loading summary...');
    const [summaryLoading, setSummaryLoading] = useState(true);
    
    // State for all chart data
    const [interactionChartData, setInteractionChartData] = useState({ individual: [], average: [] });
    const [durationChartData, setDurationChartData] = useState({ individual: [], average: [] });
    const [accuracyChartData, setAccuracyChartData] = useState({ categories: [], individualData: [], averageData: [], title: 'Answer Accuracy per Question Category' });
    const [questionCountData, setQuestionCountData] = useState({ categories: [], individualData: [], averageData: [], title: 'Number of Questions per Question Category' });
    const [topicalPerformanceData, setTopicalPerformanceData] = useState({ categories: [], leftData: [], rightData: [], leftLabel: 'Your Conversations', rightLabel: 'Class Average', title: 'Conversations per Topic' });
    const [overallGrades, setOverallGrades] = useState({ 
        questionQuality: 'N/A', 
        answerAccuracy: 'N/A', 
        avgQuestionQuality: 'N/A', 
        avgAnswerAccuracy: 'N/A',
        questionQualityGPA: null,
        answerAccuracyGPA: null,
        avgQuestionQualityGPA: null,
        avgAnswerAccuracyGPA: null
    });

    // Add state for questions (replacing conversations)
    const [conversations, setQuestions] = useState([]);
    const [conversationsLoading, setQuestionsLoading] = useState(true);
    const [topicIdMap, setTopicIdMap] = useState({}); // Map topic names to IDs

    
   
    const [dataLoading, setDataLoading] = useState(true);
    
    // Store raw stats for filtering
    const [rawIndividualStats, setRawIndividualStats] = useState(null);
    const [rawGroupStats, setRawGroupStats] = useState(null);
    
    // State for topic dependencies
    const [topicDependencies, setTopicDependencies] = useState([]);
    const [dependenciesLoading, setDependenciesLoading] = useState(false);

    // Helper function to convert grade points to letter grade
    const pointToGrade = (points) => {
        if (points == null) return 'N/A';
        const p = Number(points);
        if (p >= 4.0) return 'A';
        if (p >= 3.7) return 'A-';
        if (p >= 3.3) return 'B+';
        if (p >= 3.0) return 'B';
        if (p >= 2.7) return 'B-';
        if (p >= 2.3) return 'C+';
        if (p >= 2.0) return 'C';
        if (p >= 1.7) return 'C-';
        if (p >= 1.3) return 'D+';
        if (p >= 1.0) return 'D';
        return 'F';
    };
    // Fetch summary from API on component mount
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.generateSummary, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: 103 })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch summary');
                }
                
                const data = await response.json();
                setLlmSummary(data.summary);
            } catch (error) {
                console.error('Error fetching summary:', error);
                setLlmSummary('Failed to load summary. Please try again later.');
            } finally {
                setSummaryLoading(false);
            }
        };
        
        fetchSummary();
    }, []);
    
    // Fetch all statistics data from API
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch individual statistics
                const individualResponse = await fetch(API_ENDPOINTS.individualStatistics, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: 103 })
                });
                
                // Fetch group statistics
                const groupResponse = await fetch(API_ENDPOINTS.groupStatistics, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!individualResponse.ok || !groupResponse.ok) {
                    throw new Error('Failed to fetch statistics');
                }
                
                const individualStats = await individualResponse.json();
                const groupStats = await groupResponse.json();
                
                console.log('Individual Stats:', individualStats);
                console.log('Group Stats:', groupStats);
                
                // Store raw stats for filtering
                setRawIndividualStats(individualStats);
                setRawGroupStats(groupStats);
                
                // Transform data (will be re-filtered when topic is selected)
                transformAndSetChartData(individualStats, groupStats, null);
                
            } catch (error) {
                console.error('Error fetching statistics:', error);
            } finally {
                setDataLoading(false);
            }
        };
        
        fetchAllData();
    }, []);
    
    // Function to transform and filter chart data based on selected topic
    const transformAndSetChartData = (individualStats, groupStats, filterTopicName) => {
                // Transform interactions over time data
                const interactionIndividual = (individualStats.interactions_over_time_by_topic || [])
                    .filter(item => item.date && item.interaction_count != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.interaction_count) || 0
                    }));
                const interactionAverage = (groupStats.avg_interactions_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_interaction_count != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_interaction_count) || 0
                    }));
                setInteractionChartData({ individual: interactionIndividual, average: interactionAverage });
                
                // Transform duration over time data
                const durationIndividual = (individualStats.duration_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_duration != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_duration) || 0
                    }));
                const durationAverage = (groupStats.avg_duration_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_duration != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_duration) || 0
                    }));
                setDurationChartData({ individual: durationIndividual, average: durationAverage });
                
                // Transform accuracy by SOLO data
                const soloCategories = ['Unistructural', 'Multistructural', 'Relational', 'Extended Abstract'];
                const accuracyIndividual = soloCategories.map(cat => {
                    const items = filterTopicName 
                        ? (individualStats.accuracy_by_solo_and_topic || []).filter(item => item.topic_name === filterTopicName)
                        : (individualStats.accuracy_by_solo_category || []);
                    const found = items.find(item => (item.category || item.solo_category) === cat);
                    return { category: cat, value: found ? Math.round(Number(found.avg_accuracy) || 0) : 0 };
                });
                const accuracyAverage = soloCategories.map(cat => {
                    const items = filterTopicName 
                        ? (groupStats.avg_accuracy_by_solo_and_topic || []).filter(item => item.topic_name === filterTopicName)
                        : (groupStats.avg_accuracy_by_solo_and_topic || []);
                    const found = items.find(item => item.solo_category === cat);
                    return { category: cat, value: found ? Math.round(Number(found.avg_accuracy) || 0) : 0 };
                });
                setAccuracyChartData({
                    categories: soloCategories,
                    individualData: accuracyIndividual,
                    averageData: accuracyAverage,
                    title: 'Answer Accuracy per Question Category'
                });
                
                // Transform question count by SOLO data
                const questionIndividual = soloCategories.map(cat => {
                    const items = filterTopicName 
                        ? (individualStats.questions_by_solo_and_topic || []).filter(item => item.topic_name === filterTopicName)
                        : (individualStats.questions_by_solo_category || []);
                    const found = items.find(item => (item.category || item.solo_category) === cat);
                    return { category: cat, value: found ? (Number(found.question_count) || 0) : 0 };
                });
                const questionAverage = soloCategories.map(cat => {
                    const items = filterTopicName 
                        ? (groupStats.avg_questions_by_solo_and_topic || []).filter(item => item.topic_name === filterTopicName)
                        : (groupStats.avg_questions_by_solo_and_topic || []);
                    const found = items.find(item => item.solo_category === cat);
                    return { category: cat, value: found ? (Number(found.question_count) || 0) : 0 };
                });
                setQuestionCountData({
                    categories: soloCategories,
                    individualData: questionIndividual,
                    averageData: questionAverage,
                    title: 'Number of Questions per Question Category'
                });
                
                // Transform topical performance data - showing conversation/question counts
                const topicCategories = (individualStats.grades_by_topic || [])
                    .filter(t => t.topic_name)
                    .map(t => t.topic_name);
                const topicIndividual = (individualStats.grades_by_topic || [])
                    .filter(t => t.topic_name)
                    .map(t => ({
                        category: t.topic_name,
                        value: Number(t.question_count) || 0  // Show number of questions asked
                    }));
                // Calculate average conversations per topic (total conversations / number of users)
                const numUsers = (groupStats.conversations_per_user || []).length || 1;
                const topicAverage = topicCategories.map(topicName => {
                    const found = (groupStats.conversations_by_topic || []).find(t => t.topic_name === topicName);
                    const totalConversations = found ? (Number(found.conversation_count) || 0) : 0;
                    return { category: topicName, value: Math.round(totalConversations / numUsers) }; // Show average conversations per user
                });
                setTopicalPerformanceData({
                    categories: topicCategories,
                    leftData: topicIndividual,
                    rightData: topicAverage,
                    leftLabel: 'Your Questions',
                    rightLabel: 'Class Conversations',
                    title: 'Topic Activity Comparison'
                });
                
                
                
                // Set overall grades
                setOverallGrades({
                    questionQuality: pointToGrade(individualStats.average_question_grade),
                    answerAccuracy: individualStats.average_answer_accuracy, // Note: this will be in the form of float 
                    avgQuestionQuality: groupStats.overall_average_grade_letter || 'N/A',
                    avgAnswerAccuracy: groupStats.overall_average_accuracy || 'N/A', // Float again
                    questionQualityGPA: Number(individualStats.average_question_grade) || null,
                    answerAccuracyGPA: Number(individualStats.average_question_grade) || null,
                    avgQuestionQualityGPA: Number(groupStats.overall_average_grade) || null,
                    avgAnswerAccuracyGPA: Number(groupStats.overall_average_grade) || null
                });
    };
    
    // Re-filter data when topic filter changes
    useEffect(() => {
        if (rawIndividualStats && rawGroupStats) {
            transformAndSetChartData(rawIndividualStats, rawGroupStats, selectedTopic);
        }
    }, [selectedTopic]);

    const handleTopicSelection = React.useCallback((topicName) => {
    // Logic to toggle: if clicking same topic, set to null, else set to new topic
    setSelectedTopic(prev => prev === topicName ? null : topicName);
}, []);
    
    
    // Fetch questions when a topic is selected, else fetch all questions
   useEffect(() => {
    const fetchQuestions = async () => {
        // Only fetch if we have the topic ID mapping loaded (or no filter selected)
        if (!selectedTopic || Object.keys(topicIdMap).length > 0) {
            setQuestionsLoading(true);
            try {
                // Convert topic name to ID using the mapping
                const topicId = selectedTopic ? topicIdMap[selectedTopic] : null;
                
                console.log('[Debug] Fetching questions:', {
                    selectedTopic,
                    topicId,
                    topicIdMap
                });
                
                // Build URL with optional topic filter using numeric ID
                const url = topicId 
                    ? `${API_ENDPOINTS.questions}?topic_id=${topicId}`
                    : API_ENDPOINTS.questions;
                
                console.log('[Debug] Request URL:', url);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch question data');
                }
                
                const responseData = await response.json();
                console.log('[Debug] Fetched question data:', responseData);
                
                // Questions API returns array directly (not paginated)
                const questionsArray = Array.isArray(responseData) ? responseData : [];
                
                // Transform API data to match table format
                // API returns: { question_id, content, grade, timestamp }
                const transformedData = questionsArray.map(q => ({
                    id: q.question_id,
                    question: q.content || 'No content',
                    grade: q.grade || 'N/A',
                    timestamp: q.timestamp
                        ? new Date(q.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                        : 'N/A'
                }));
                
                setQuestions(transformedData);
                
            } catch (error) {
                console.error('Error fetching questions:', error);
                setQuestions([]);
            } finally {
                setQuestionsLoading(false);
            }
        }
    };
    
    fetchQuestions();
}, [selectedTopic]);


    // Fetch topic dependencies when a topic is selected
    useEffect(() => {
        const fetchTopicDependencies = async () => {

            console.log('proceeding to select ur mom')
            setDependenciesLoading(true);
            try {
                const response = await fetch(API_ENDPOINTS.topicDependencies, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                // just getting everything for now
                
                if (!response.ok) {
                    console.log('is there an error here?',response.status, await response.text());
                    // is this a subtopic? let's check
                    // never mind plan aborted
                    throw new Error('Failed to fetch topic dependencies');
                }
                
                const dependencies = await response.json();
                setTopicDependencies(dependencies);
                console.log('Fetched dependencies:', dependencies);

                // Build topic name -> ID mapping
                const nameToIdMap = {};
                if (dependencies.nodes) {
                    dependencies.nodes.forEach(node => {
                        if (node.type === 'topic' && node.label && node.id) {
                            // Extract numeric ID from prefixed ID (e.g., "topic_5" -> 5)
                            const numericId = parseInt(node.id.replace('topic_', ''));
                            nameToIdMap[node.label] = numericId;
                        }
                    });
                }
                setTopicIdMap(nameToIdMap);
                console.log('Topic ID map:', nameToIdMap);

                // Don't auto-select a topic - let user choose
                // Only set dependencies, user must manually select a topic

            } catch (error) {
                console.error('Error fetching topic dependencies:', error);
                // 
                setTopicDependencies([]);
            } finally {
                setDependenciesLoading(false);
            }
        };
        
        fetchTopicDependencies();
    }, []);

    // Filter topics based on search term
    const filteredTopicalPerformanceData = {
        ...topicalPerformanceData,
        categories: topicalPerformanceData.categories.filter(category => 
            category.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        leftData: topicalPerformanceData.leftData.filter(item => 
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        rightData: topicalPerformanceData.rightData.filter(item => 
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "flex-start",
            minHeight: "100vh", overflowY: "auto", overflowX:"hidden" 
         }}>
             {/* <header class ="header-light-main">
                    <h1>
                        Learning Engagement Analytics
                    </h1>
                </header> */}
            
            <div style={{ padding: "1.2rem", fontSize: "0.7rem", width: "100%", display: "flex", justifyContent: "center" }}>
                <h1 >NALA-Assess Dashboard</h1>
            </div>

            {/* LLM Summary Section */}
            <section style={{
                width: "100%",
                marginBottom: "2rem"
            }}>
                <h2 style={{ 
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    color: "#858996ff",
                    fontSize: "1.3rem"
                }}>
                    Learning Progress Summary
                </h2>
                {summaryLoading ? (
                    <div style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#64748b",
                        backgroundColor: "#f0f7ff",
                        borderRadius: "12px"
                    }}>
                        Loading your personalized summary...
                    </div>
                ) : (
                    <div style={{
                        display: "flex",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                        justifyContent: "center"
                    }}>
                        {(() => {
                            // Split markdown by ## headings
                            const sections = llmSummary.split(/(?=## )/);
                            const strongAreas = sections.find(s => s.includes('## Strong Areas')) || '';
                            const improvement = sections.find(s => s.includes('## Areas for Improvement') || s.includes('## Areas of Improvement')) || '';
                            const peerComparison = sections.find(s => s.includes('## Peer Comparison')) || '';
                            
                            const markdownComponents = {
                                h2: ({node, ...props}) => <h3 style={{
                                    fontSize: "1.1rem",
                                    fontWeight: "bold",
                                    color: "#0c4a6e",
                                    marginTop: 0,
                                    marginBottom: "0.75rem"
                                }} {...props} />,
                                p: ({node, ...props}) => <p style={{
                                    fontSize: "0.9rem",
                                    lineHeight: "1.6",
                                    color: "#1e3a8a",
                                    marginBottom: "0.75rem"
                                }} {...props} />,
                                ul: ({node, ...props}) => <ul style={{
                                    paddingLeft: "1.5rem",
                                    marginBottom: "0.75rem",
                                    color: "#1e3a8a"
                                }} {...props} />,
                                li: ({node, ...props}) => <li style={{
                                    marginBottom: "0.4rem",
                                    lineHeight: "1.5",
                                    fontSize: "0.9rem"
                                }} {...props} />,
                                strong: ({node, ...props}) => <strong style={{
                                    fontWeight: "bold",
                                    color: "#0c4a6e"
                                }} {...props} />
                            };

                            return (
                                <>
                                    {/* Strong Areas */}
                                    <div style={{
                                        flex: "1",
                                        minWidth: "280px",
                                        maxWidth: "400px",
                                        backgroundColor: "#eff6ff",
                                        padding: "1.5rem",
                                        borderRadius: "12px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        borderLeft: "4px solid #3b82f6"
                                    }}>
                                        <ReactMarkdown components={{
                                            ...markdownComponents,
                                            h2: ({node, ...props}) => <h3 style={{
                                                fontSize: "1.3rem",
                                                fontWeight: "bold",
                                                color: "#2563eb",
                                                marginTop: 0,
                                                marginBottom: "0.75rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }} {...props} />,
                                            strong: ({node, ...props}) => <strong style={{
                                                fontWeight: "bold",
                                                color: "#2563eb",
                                                fontSize: "1.05rem"
                                            }} {...props} />
                                        }}>
                                            {strongAreas}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div style={{
                                        flex: "1",
                                        minWidth: "280px",
                                        maxWidth: "400px",
                                        backgroundColor: "#fef3c7",
                                        padding: "1.5rem",
                                        borderRadius: "12px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        borderLeft: "4px solid #f59e0b"
                                    }}>
                                        <ReactMarkdown components={{
                                            ...markdownComponents,
                                            h2: ({node, ...props}) => <h3 style={{
                                                fontSize: "1.3rem",
                                                fontWeight: "bold",
                                                color: "#d97706",
                                                marginTop: 0,
                                                marginBottom: "0.75rem",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }} {...props} />,
                                            strong: ({node, ...props}) => <strong style={{
                                                fontWeight: "bold",
                                                color: "#d97706",
                                                fontSize: "1.05rem"
                                            }} {...props} />
                                        }}>
                                            {improvement}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Peer Comparison */}
                                    {(() => {
                                        // Detect if student is above or below average
                                        const isAboveAverage = peerComparison.toLowerCase().includes('above') || 
                                                             peerComparison.toLowerCase().includes('exceed') ||
                                                             !peerComparison.toLowerCase().includes('below');
                                        
                                        return (
                                            <div style={{
                                                flex: "1",
                                                minWidth: "280px",
                                                maxWidth: "400px",
                                                backgroundColor: isAboveAverage ? "#f0fdf4" : "#fef2f2",
                                                padding: "1.5rem",
                                                borderRadius: "12px",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                borderLeft: `4px solid ${isAboveAverage ? "#10b981" : "#ef4444"}`
                                            }}>
                                                <ReactMarkdown components={{
                                                    ...markdownComponents,
                                                    h2: ({node, ...props}) => <h3 style={{
                                                        fontSize: "1.3rem",
                                                        fontWeight: "bold",
                                                        color: isAboveAverage ? "#059669" : "#dc2626",
                                                        marginTop: 0,
                                                        marginBottom: "0.75rem",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px"
                                                    }} {...props} />,
                                                    strong: ({node, ...props}) => <strong style={{
                                                        fontWeight: "bold",
                                                        color: isAboveAverage ? "#059669" : "#dc2626",
                                                        fontSize: "1.05rem"
                                                    }} {...props} />
                                                }}>
                                                    {peerComparison}
                                                </ReactMarkdown>
                                            </div>
                                        );
                                    })()}
                                </>
                            );
                        })()}
                    </div>
                )}
            </section>

            <section
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    gap: "3rem",
                    marginBottom: "2rem",
                }}
                className="dashboard-stats-grid"
            >
               
                {(() => {
                    // Use actual GPA values for comparison
                    const studentGPA = overallGrades.questionQualityGPA;
                    const avgGPA = overallGrades.avgQuestionQualityGPA;
                    const isAboveAvg = (studentGPA != null && avgGPA != null) ? studentGPA > avgGPA : false;
                    
                    return (
                        <div
                            style={{
                                background: isAboveAvg ? "#f0fdf4" : "#fef2f2",
                                gap: "1rem",
                                padding: "1rem",
                                borderRadius: "20px",
                                minWidth: "160px",
                                boxShadow: isAboveAvg ? "0 2px 12px rgba(16, 185, 129, 0.3)" : "0 2px 12px rgba(239, 68, 68, 0.3)",
                                border: `2px solid ${isAboveAvg ? "#10b981" : "#ef4444"}`
                            }}
                        >   
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "0.85rem", textAlign: "left" }}>
                                Overall Estimated Question Quality
                            </div>
                            <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: isAboveAvg ? "#10b981" : "#ef4444", textAlign: "center" }}>
                                {overallGrades.questionQuality}
                            </div>
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "1rem", textAlign: "right" }}>
                                Average: <span style={{ color: "#888" }}>{overallGrades.avgQuestionQuality}</span>
                            </div>
                        </div>
                    );
                })()}
                {(() => {
                    // Use float values for comparison
                    const studentGPA = overallGrades.answerAccuracyGPA;
                    const avgGPA = overallGrades.avgAnswerAccuracyGPA;
                    const isAboveAvg = (studentGPA != null && avgGPA != null) ? studentGPA > avgGPA : false;
                    
                    return (
                        <div
                            style={{
                                background: isAboveAvg ? "#f0fdf4" : "#fef2f2",
                                padding: "1rem",
                                borderRadius: "20px",
                                minWidth: "160px",
                                boxShadow: isAboveAvg ? "0 2px 12px rgba(16, 185, 129, 0.3)" : "0 2px 12px rgba(239, 68, 68, 0.3)",
                                border: `2px solid ${isAboveAvg ? "#10b981" : "#ef4444"}`
                            }}
                        >   
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "0.85rem", textAlign: "left" }}>
                                Overall Estimated Answer Accuracy
                            </div>
                            <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: isAboveAvg ? "#10b981" : "#ef4444", textAlign: "center" }}>
                                {Math.round(overallGrades.answerAccuracy)}
                            </div>
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "1rem", textAlign: "right" }}>
                                Average: <span style={{ color: "#888" }}>{Math.round(overallGrades.avgAnswerAccuracy)}</span>
                            </div>
                        </div>
                    );
                })()}
                {/* <div
                    style={{
                        background: "#4d51f3",
                        padding: "1.5rem",
                        borderRadius: "20px",
                        minWidth: "160px",
                        boxShadow: "0 2px 8px #e1e1e1",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#e1e1e1" }}>
                        {conversationSessions}
                    </div>
                    <div style={{ color: "#e1e1e1", marginTop: "0.5rem" }}>
                        Conversation Sessions
                    </div>
                </div>
                <div
                    style={{
                        background: "#4d51f3",
                        padding: "1.5rem",
                        borderRadius: "20px",
                        minWidth: "160px",
                        boxShadow: "0 2px 8px #e1e1e1",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#e1e1e1" }}>
                        {topicsDiscussed}
                    </div>
                    <div style={{ color: "#e1e1e1", marginTop: "0.5rem" }}>
                        Topics discussed
                    </div>
                </div>
                <div
                    style={{
                        background: "#4d51f3",
                        padding: "1.5rem",
                        borderRadius: "20px",
                        minWidth: "160px",
                        boxShadow: "0 2px 8px #e1e1e1",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#e1e1e1" }}>
                        {minutesSpent}
                    </div>
                    <div style={{ color: "#e1e1e1",  fontWeight: "normal",  marginTop: "0.5rem" }}>
                        Minutes Spent on Average with Chat
                    </div>
                </div> */}
            </section>

            {/* Scrollable Topical Performance Section - RIGHT AFTER GRADES */}
            <section style={{
                width: "100%",
                marginTop: "2rem",
                marginBottom: "2rem"
            }}>

                
                
                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* Left: Scrollable Subject Performance Chart */}
                    <div style={{
                        flex: "1",
                        minWidth: "450px",
                        maxWidth: "600px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <h2 style={{ 
                            textAlign: "center", 
                            marginBottom: "0.2rem",
                            color: "#555"
                        }}>
                            Overall Interactions by Topic
                        </h2>
                        <div style={{ 
                            display: "flex", 
                            flexDirection: "column",
                            gap: "0.75rem", 
                            marginBottom: "1.5rem" 
                        }}>
                            {/* Search Bar */}
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                width: "100%"
                            }}>
                                <input
                                    type="text"
                                    placeholder="Search topics..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        borderRadius: "6px",
                                        border: "1px solid #ccc",
                                        fontSize: "14px",
                                        width: "80%",
                                        maxWidth: "400px",
                                        outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                                    onBlur={(e) => e.target.style.borderColor = "#ccc"}
                                />
                            </div>
                            
                            {/* Sort and Info */}
                            <div style={{ 
                                display: "flex", 
                                justifyContent: "center", 
                                alignItems: "center", 
                                gap: "1rem"
                            }}>
                                <select style={{ 
                                    padding: "0.5rem", 
                                    borderRadius: "6px", 
                                    border: "1px solid #ccc",
                                    fontSize: "14px"
                                }}> 
                                    <option value="">Sort by performance</option>
                                    <option value="ascending">Ascending</option>
                                    <option value="descending">Descending</option>
                                    <option value="alphabetical">Alphabetical</option>
                                </select>
                                <p style={{ 
                                    fontSize: "0.85rem", 
                                    color: "#666", 
                                    margin: "0"
                                }}>
                                    Click on any bar to view in-depth analytics
                                </p>
                            </div>
                        </div>
                        
                        <div style={{
                            flex: "1",
                            maxHeight: "500px",
                            overflowY: "auto",
                            overflowX: "hidden",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            backgroundColor: "white",
                            padding: "1rem",
                            width: "100%"
                        }}>
                            {dataLoading ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading topic data...</div>
                            ) : (
                                <ResponsiveReflectiveBarChart 
                                    data={{
                                        ...filteredTopicalPerformanceData,
                                        title: "", // Remove title
                                        leftLabel: "", // Remove left label
                                        rightLabel: "" // Remove right label
                                    }} 
                                    height={Math.max(400, filteredTopicalPerformanceData.categories.length * 35)}
                                    onCategoryClick={(category) => handleTopicSelection(category)}
                                    selectedCategory={selectedTopic}
                                />
                            )}
                        </div>
                        
                        <div style={{
                            marginTop: "1rem",
                            textAlign: "center",
                            fontSize: "0.8rem",
                            color: "#666"
                        }}>
                            <p style={{ margin: "0.5rem 0" }}>
                                Blue bars: Your Questions | Red bars: Class Conversations
                            </p>
                            <p style={{ margin: "0.5rem 0" }}>
                                Showing {filteredTopicalPerformanceData.categories.length} of {topicalPerformanceData.categories.length} subjects
                            </p>
                            {selectedTopic && (
                                <div style={{ marginTop: "1rem" }}>
                                    <p style={{ margin: "0.5rem 0", color: "#059669", fontWeight: "bold" }}>
                                        Filtering all charts by: {selectedTopic}
                                    </p>
                                    <button 
                                        onClick={() => {
                                            // setselectedTopic(null);
                                            setSelectedTopic(null);
                                        }}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            fontWeight: "500",
                                            transition: "background-color 0.2s"
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = "#dc2626"}
                                        onMouseOut={(e) => e.target.style.backgroundColor = "#ef4444"}
                                    >
                                        Clear Filter
                                    </button>
                                </div>
                            )}
                            <p style={{ margin: "0.5rem 0", fontSize: "0.75rem", fontStyle: "italic" }}>
                                💡 Click on any topic bar to filter all charts
                            </p>
                        </div>
                    </div>

                    {/* Right: Topic Graph and Chat History */}
                    <div style={{
                        flex: "1",
                        minWidth: "600px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        maxHeight: "820px"
                    }}>
                        {/* Topic Graph */}
                        <div style={{
                            backgroundColor: "white",
                            padding: "1rem",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            flex: "1",
                            minHeight: "0",
                            display: "flex",
                            flexDirection: "column",
                            height:"600px"
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.75rem"
                            }}>
                                <div>
                                    <h3 style={{ 
                                        color: "#555",
                                        margin: 0,
                                        fontSize: "1.1rem"
                                    }}>
                                        Topic Dependencies: {selectedTopic || "Select a topic"}
                                    </h3>
                                    <p style={{
                                        margin: "0.5rem 0 0 0",
                                        fontSize: "0.75rem",
                                        color: "#64748b",
                                        display: "flex",
                                        gap: "1rem",
                                        flexWrap: "wrap"
                                    }}>
                                        <span><span style={{ color: "#3b82f6", fontWeight: "bold" }}>●</span> Selected Topic</span>
                                        <span><span style={{ color: "#8b5cf6", fontWeight: "bold" }}>●</span> Subtopics</span>
                                        <span><span style={{ color: "#10b981", fontWeight: "bold" }}>●</span> Related Topics</span>
                                    </p>
                                </div>
                                {selectedTopic && (
                                    <div style={{
                                        display: "flex",
                                        gap: "0.5rem",
                                        alignItems: "center"
                                    }}>
                                        <div style={{
                                            backgroundColor: "#f0fdf4",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            fontSize: "0.85rem",
                                            color: "#555"
                                        }}>
                                            Grade: <strong style={{ color: "#10b981" }}>A-</strong>
                                        </div>
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            style={{
                                                fontSize: "0.8rem",
                                                fontWeight: "bold",
                                                padding: "0.4rem 1rem"
                                            }}
                                        >
                                            Test Me
                                        </Button>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{
                                flex: "1",
                                minHeight: "0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem"
                            }}>
                                {selectedTopic ? (
                                    <>
                                        <TopicGraph 
                                            selectedTopic={selectedTopic}
                                            onTopicSelect={handleTopicSelection}
                                            width={700}
                                            height={280}
                                            graphData = {topicDependencies}
                                            gradeData={rawIndividualStats?.grades_by_topic} 
                                        />
                                        
                                        {/* Dependencies List
                                        <div style={{
                                            backgroundColor: "#f8fafc",
                                            padding: "1rem",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0"
                                        }}>
                                            <h4 style={{
                                                margin: "0 0 0.75rem 0",
                                                fontSize: "0.9rem",
                                                color: "#475569",
                                                fontWeight: "600"
                                            }}>
                                                Related Topics & Dependencies
                                            </h4>
                                            {dependenciesLoading ? (
                                                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                                                    Loading dependencies...
                                                </div>
                                            ) : topicDependencies.length > 0 ? (
                                                <div style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "0.5rem"
                                                }}>
                                                    {topicDependencies.map((dep, idx) => {
                                                        const isPrerequisite = dep.related_topic_id === selectedTopic;
                                                        const relatedTopic = isPrerequisite ? dep.topic_id : dep.related_topic_id;
                                                        const relationLabel = dep.relation_type || (isPrerequisite ? 'prerequisite' : 'related');
                                                        
                                                        return (
                                                            <div key={idx} style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.75rem",
                                                                padding: "0.5rem 0.75rem",
                                                                backgroundColor: "white",
                                                                borderRadius: "6px",
                                                                border: "1px solid #e2e8f0",
                                                                fontSize: "0.85rem"
                                                            }}>
                                                                <span style={{
                                                                    padding: "0.25rem 0.5rem",
                                                                    backgroundColor: isPrerequisite ? "#fef3c7" : "#dbeafe",
                                                                    color: isPrerequisite ? "#92400e" : "#1e40af",
                                                                    borderRadius: "4px",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: "600",
                                                                    textTransform: "uppercase"
                                                                }}>
                                                                    {relationLabel}
                                                                </span>
                                                                <span style={{ color: "#475569", fontWeight: "500" }}>
                                                                    {relatedTopic}
                                                                </span>
                                                                {isPrerequisite && (
                                                                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#64748b" }}>
                                                                        ← Required before {selectedTopic}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '1rem',
                                                    color: '#94a3b8',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    No dependencies found for this topic
                                                </div>
                                            )}
                                        </div> */}
                                    </>
                                ) : (
                                    <div style={{
                                        textAlign: "center",
                                        color: "#94a3b8",
                                        fontSize: "0.95rem",
                                        padding: "2rem"
                                    }}>
                                        👈 Click on a topic to visualize dependencies
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat History Table */}
                        {selectedTopic && (
                            <div style={{
                                backgroundColor: "white",
                                padding: "1rem",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                maxHeight: "400px",
                                flex: "1",
                                minHeight: "400px",
                                display: "flex",
                                flexDirection: "column"
                            }}>
                                <h3 style={{ 
                                    color: "#555",
                                    marginBottom: "0.75rem",
                                    fontSize: "1rem"
                                }}>
                                    Recent Questions
                                </h3>
                                <div style={{ 
                                    flex: "1",
                                    minHeight: "0",
                                    overflowY: "auto",
                                    overflowX: "auto"
                                }}>
                                    <table style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        fontSize: "0.85rem"
                                    }}>
                                        <thead style={{ position: "sticky", top: 0, backgroundColor: "white", zIndex: 1 }}>
                                            <tr style={{ backgroundColor: "#f8fafc" }}>
                                                <th style={{ 
                                                    padding: "0.6rem", 
                                                    textAlign: "left",
                                                    borderBottom: "2px solid #e2e8f0",
                                                    color: "#64748b",
                                                    fontWeight: "600",
                                                    fontSize: "0.8rem"
                                                }}>Question</th>
                                                <th style={{ 
                                                    padding: "0.6rem", 
                                                    textAlign: "center",
                                                    borderBottom: "2px solid #e2e8f0",
                                                    color: "#64748b",
                                                    fontWeight: "600",
                                                    width: "70px",
                                                    fontSize: "0.8rem"
                                                }}>Grade</th>
                                                <th style={{ 
                                                    padding: "0.6rem", 
                                                    textAlign: "center",
                                                    borderBottom: "2px solid #e2e8f0",
                                                    color: "#64748b",
                                                    fontWeight: "600",
                                                    width: "120px",
                                                    fontSize: "0.8rem"
                                                }}>Date</th>
                                                <th style={{ 
                                                    padding: "0.6rem", 
                                                    textAlign: "center",
                                                    borderBottom: "2px solid #e2e8f0",
                                                    color: "#64748b",
                                                    fontWeight: "600",
                                                    width: "80px",
                                                    fontSize: "0.8rem"
                                                }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {conversationsLoading ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                    Loading questions...
                                                </td>
                                            </tr>
                                        ) : conversations.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                    No questions found
                                                </td>
                                            </tr>
                                        ) : (
                                            conversations.map((chat, index) => (
                                                <tr key={chat.id} style={{
                                                    backgroundColor: index % 2 === 0 ? "white" : "#f8fafc"
                                                }}>
                                        <td style={{ 
                                            padding: "0.6rem",
                                            borderBottom: "1px solid #e2e8f0",
                                            color: "#334155"
                                        }}>{chat.question}</td>
                                        <td style={{ 
                                            padding: "0.6rem",
                                            textAlign: "center",
                                            borderBottom: "1px solid #e2e8f0",
                                            fontWeight: "bold",
                                            color: chat.grade.startsWith('A') ? "#10b981" : "#3b82f6"
                                        }}>{chat.grade}</td>
                                        <td style={{ 
                                            padding: "0.6rem",
                                            textAlign: "center",
                                            borderBottom: "1px solid #e2e8f0",
                                            color: "#64748b",
                                            fontSize: "0.8rem"
                                        }}>{chat.timestamp}</td>
                                        <td style={{ 
                                            padding: "0.6rem",
                                            textAlign: "center",
                                            borderBottom: "1px solid #e2e8f0"
                                        }}>
                                            <Button 
                                                variant="outlined" 
                                                size="small"
                                                style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}
                                            >
                                                Visit
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section style={{
                width: "100%",
                marginTop: "2rem",
                marginBottom: "2rem",
            }}>
                {/* Dynamic Topic Display */}
                <div style={{
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#e0f2fe",
                    borderRadius: "8px",
                    display: "inline-block",
                    margin: "0 auto 1.5rem auto",
                    width: "fit-content",
                    position: "relative",
                    left: "50%",
                    transform: "translateX(-50%)"
                }}>
                    <span style={{
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        color: "#0369a1"
                    }}>
                        Topic: {selectedTopic || "Select a topic"}
                    </span>
                </div>

                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* First chart card */}
                    <div style={{
                        flex: "1 1 450px",
                        maxWidth: "600px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{
                            textAlign: "center",
                            marginBottom: "1rem",
                            color: "#555"
                        }}>
                            Number of Interaction Trends Over Time
                            {selectedTopic && (
                                <span style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginTop: "0.25rem" }}>
                                    📊 Filtered by: {selectedTopic}
                                </span>
                            )}
                        </h2>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <ResponsiveLineChart
                                data={interactionChartData}
                                height={360}
                                showResetButton={true}
                            />
                        )}
                        <p style={{
                            fontSize: "0.85rem",
                            color: "#666",
                            textAlign: "center",
                            marginTop: "1rem"
                        }}>
                            Blue line: Your daily interactions | Red dashed: Class average
                        </p>
                    </div>
                    <div style={{
                        flex: "1 1 450px",
                        maxWidth: "600px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{
                            textAlign: "center",
                            marginBottom: "1rem",
                            color: "#555"
                        }}>
                            Average Duration of Conversation Over Time
                            {selectedTopic && (
                                <span style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginTop: "0.25rem" }}>
                                    Filtered by: {selectedTopic}
                                </span>
                            )}
                        </h2>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <ResponsiveLineChart
                                data={durationChartData}
                                height={360}
                                showResetButton={true}
                                yAxisLabel="Duration (minutes)"
                            />
                        )}
                        <p style={{
                            fontSize: "0.85rem",
                            color: "#666",
                            textAlign: "center",
                            marginTop: "1rem"
                        }}>
                            Blue line: Your duration per conversation | Red dashed: Class average
                        </p>
                    </div>
                </div>
            </section>

            <section style={{
                width: "100%",
                marginTop: "2rem",
                marginBottom: "2rem"
            }}>
                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* Answer accuracy Vertical Bar Chart */}
                    <div style={{
                        flex: "1",
                        minWidth: "500px",
                        maxWidth: "650px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                            <h3 style={{ 
                                marginBottom: "0.5rem",
                                color: "#555"
                            }}>
                                Answer Accuracy per Question Category
                                {selectedTopic && (
                                    <span style={{ display: "block", fontSize: "0.75rem", color: "#059669", marginTop: "0.25rem" }}>
                                        📊 Filtered by: {selectedTopic}
                                    </span>
                                )}
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                Based on SOLO taxonomy levels
                            </p>
                        </div>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <VerticalBarChart 
                                data={accuracyChartData} 
                                width={600} 
                                height={400}
                                xAxisLabel=""
                                yAxisLabel="Accuracy (%)" 
                            />
                        )}
                        <p style={{ 
                            fontSize: "0.85rem", 
                            color: "#666", 
                            textAlign: "center", 
                            marginTop: "1rem" 
                        }}>
                            Blue bars: Individual | Red bars: Class Average
                        </p>
                    </div>

                    {/* Number of Questions per Category Chart */}
                    <div style={{
                        flex: "1",
                        minWidth: "500px",
                        maxWidth: "650px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                            <h3 style={{ 
                                marginBottom: "0.5rem",
                                color: "#555"
                            }}>
                                Number of Questions per Question Category
                                {selectedTopic && (
                                    <span style={{ display: "block", fontSize: "0.75rem", color: "#059669", marginTop: "0.25rem" }}>
                                        📊 Filtered by: {selectedTopic}
                                    </span>
                                )}
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                 Based on SOLO taxonomy levels
                            </p>
                        </div>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <VerticalBarChart 
                                data={questionCountData} 
                                width={600} 
                                height={400}
                                xAxisLabel=""
                                yAxisLabel="Number of Questions" 
                            />
                        )}
                        <p style={{ 
                            fontSize: "0.85rem", 
                            color: "#666", 
                            textAlign: "center", 
                            marginTop: "1rem" 
                        }}>
                            Blue bars: Your Questions | Red bars: Class Average
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Responsive wrapper for LineChart so it spans the parent container
function ResponsiveLineChart({ data, height, showResetButton = false, yAxisLabel, xAxisLabel }) {
    const [width, setWidth] = useState(800);
    const [resetFn, setResetFn] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                // Use 90% of container width to fit within parent
                const newWidth = Math.max(300, containerWidth * 0.9);
                setWidth(newWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const handleResetReady = (resetFunction) => {
        setResetFn(() => resetFunction);
    };

    return (
        <div style={{ width: '100%' }}>
            <div ref={containerRef} style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <LineChart 
                    data={data} 
                    width={width} 
                    height={height} 
                    onResetReady={handleResetReady}
                    yAxisLabel={yAxisLabel}
                    xAxisLabel={xAxisLabel}
                />
            </div>
            {showResetButton && resetFn && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                    <Button 
                        variant="outlined" 
                        size="small"
                        onClick={resetFn}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 1rem' }}
                    >
                        Reset Zoom
                    </Button>
                </div>
            )}
        </div>
    );
}