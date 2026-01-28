import React, { useState, useEffect, useRef, startTransition } from 'react';
// import {fetchDashboardStats, fetchRecentActivities} from '../services/api'
import LineChart from '../components/charts/LineChart';
import ReflectiveBarChart from '../components/charts/ReflectiveBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import TopicGraph from '../components/charts/TopicGraph';
import CriticalThinkingGuide from '../components/dashboard/CriticalThinkingGuide';
import MarkdownTooltip from '../components/dashboard/MarkdownTooltip';
import { Button, Tabs, Tab, Box, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';
import ReactMarkdown from 'react-markdown';

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
    const [hoveredGrade, setHoveredGrade] = useState(null);
    

    // State to control which page for earlier is visible because of tabulation requirements
    const [currentTab, setCurrentTab] = useState(0); // Default value should be zero.
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

   // const [selectedTopic, setselectedTopic] = useState(null); // For filtering charts by topic
    const [searchTerm, setSearchTerm] = useState('');
    // LLM-generated summary - fetched from API
    const [llmSummary, setLlmSummary] = useState('Loading summary...');
    const [summaryLoading, setSummaryLoading] = useState(true);
    
    const [page,setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const USER_ID = '2'; // We're centralising it here
    
    // State for all chart data
    const [interactionChartData, setInteractionChartData] = useState({ individual: [], average: [] });
    const [durationChartData, setDurationChartData] = useState({ individual: [], average: [] });
    const [gradesChartData, setGradesChartData] = useState({ individual: [], average: [] });
    const [accuracyOverTimeChartData, setAccuracyOverTimeChartData] = useState({ individual: [], average: [] });
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
        avgAnswerAccuracyGPA: null,
        gradeComparison: null  // 'above', 'below', or 'at'
    });

    // For implementing sorting inside the reflective bar chart
    const [sortOption, setSortOption]= useState('ascending');
    const dataAfterFiltering = {
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

   
    const [conversations, setQuestions] = useState([]);
    const [conversationsLoading, setQuestionsLoading] = useState(true);
    const [topicIdMap, setTopicIdMap] = useState({}); // Map topic names to IDs
    const [topicNameToIdMap, setTopicNameToIdMap] = useState({}); // Map topic names to IDs for filtering
    const [showAnsweredOnly, setShowAnsweredOnly] = useState(false); // Filter for answered questions

    
   
    const [dataLoading, setDataLoading] = useState(true);
    
    // Store raw stats for filtering
    const [rawIndividualStats, setRawIndividualStats] = useState(null);
    const [rawGroupStats, setRawGroupStats] = useState(null);
    
    // State for topic dependencies
    const [topicDependencies, setTopicDependencies] = useState([]);
    const [dependenciesLoading, setDependenciesLoading] = useState(false);
    
    // State for time filter in Detailed Analytics (past-3-days, past-week, all-time)
    const [timeFilter, setTimeFilter] = useState('all-time');
    const [topicGraphResetFn, setTopicGraphResetFn] = useState(null);
    
    // Raw time-series SOLO data for bar chart time filtering
    const [rawSoloTimeSeries, setRawSoloTimeSeries] = useState({
        questions: { individual: [], average: [] },
        accuracy: { individual: [], average: [] }
    });

    // Fetch summary from API on component mount
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await fetch(API_ENDPOINTS.generateSummary, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ user_id: USER_ID})
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch summary');
                }
                
                const data = await response.json();
                setLlmSummary(data.summary);
                
                // Update overall grades with grade comparison status
                if (data.grade_comparison) {
                    setOverallGrades(prev => ({
                        ...prev,
                        gradeComparison: data.grade_comparison
                    }));
                }
            } catch (error) {
                console.error('Error fetching summary:', error);
                setLlmSummary('Failed to load summary. Please try again later.');
            } finally {
                setSummaryLoading(false);
            }
        };
        
        fetchSummary();
    }, []);

    // Helper function to fill missing dates in time series data
    const fillMissingDates = (data) => {
        if (!data || data.length === 0) return [];
        
        // Get min and max dates
        const dates = data.map(d => d.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        // Create a map of existing data by date string
        const dataByDate = new Map();
        data.forEach(d => {
            const dateStr = d.date.toISOString().split('T')[0];
            dataByDate.set(dateStr, d);
        });
        
        // Fill in all dates between min and max
        const filledData = [];
        let currentDate = new Date(minDate);
        
        while (currentDate <= maxDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            if (dataByDate.has(dateStr)) {
                filledData.push(dataByDate.get(dateStr));
            } else {
                // Add null placeholder for missing date
                filledData.push({
                    date: new Date(currentDate),
                    interactions: null,  // Null value will cause gap in line chart
                    topic: data[0]?.topic || null
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return filledData;
    };

// Fetch all statistics data from API
    useEffect(() => {
        // 1. Define the async wrapper function
        const fetchAllData = async () => {
            try {
                // Fetch individual statistics
                const individualResponse = await fetch(API_ENDPOINTS.individualStatistics, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: USER_ID })
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
                
                // Create topic name to ID mapping
                const topicMap = {};
                if (individualStats.grades_by_topic) {
                    individualStats.grades_by_topic.forEach(item => {
                        if (item.topic_name && item.topic_id) {
                            topicMap[item.topic_name] = item.topic_id;
                        }
                    });
                }
                setTopicNameToIdMap(topicMap);
                
                // Transform data (will be re-filtered when topic is selected)
                transformAndSetChartData(individualStats, groupStats, null);
                
            } catch (error) {
                console.error('Error fetching statistics:', error);
            } finally {
                setDataLoading(false);
            }
        };
        
        // 2. Call the async function immediately
        fetchAllData();
    }, []);
 // Sorting logic
    const getSortedChartData = () => {
        // Clone the categories array to avoid mutating state directly
        let sortedDataCategories = [...dataAfterFiltering.categories]; // Spread
        const getValue = (catName) => {
            const item = dataAfterFiltering.leftData.find(d => d.category === catName);
            return item ? item.value : 0;
        };
        
        // Helper to get grade from rawIndividualStats
        const getGrade = (catName) => {
            // Check if rawIndividualStats exists (it might not during initial render)
            try {
                if (!rawIndividualStats || !rawIndividualStats.grades_by_topic) return 0;
                const topic = rawIndividualStats.grades_by_topic.find(t => t.topic_name === catName);
                if (!topic || !topic.avg_grade_points) return 0;
                const gradeValue = Number(topic.avg_grade_points);
                // Debug: log to verify grades are being retrieved
                // if (sortOption.startsWith('grade-')) {
                //     console.log(`Topic: ${catName}, Grade Points: ${gradeValue}`);
                // }
                return gradeValue;
            } catch (e) {
                // During initial render, rawIndividualStats might not be accessible
                return 0;
            }
        };
        
        if (sortOption === 'alphabetical') {
            sortedDataCategories.sort((a, b) => a.localeCompare(b));
        } else if (sortOption === 'ascending') {
            sortedDataCategories.sort((a, b) => getValue(a) - getValue(b));
        } else if (sortOption === 'descending') {
            sortedDataCategories.sort((a, b) => getValue(b) - getValue(a));
        } else if (sortOption === 'grade-high-low') {
            sortedDataCategories.sort((a, b) => getGrade(b) - getGrade(a));
        } else if (sortOption === 'grade-low-high') {
            sortedDataCategories.sort((a, b) => getGrade(a) - getGrade(b));
        }
        return {
            ...dataAfterFiltering,
            categories: sortedDataCategories
        };
    };
    const processedChartData = getSortedChartData();

    const finalChartData = getSortedChartData();
    
    // Get time-filtered chart data for Detailed Analytics (line charts only)
    const getTimeFilteredChartData = (chartData) => {
        const filterByTimeRange = (data, timeFilter) => {
            if (timeFilter === 'all-time') return data;
            
            const now = new Date();
            now.setHours(23, 59, 59, 999);
            
            let cutoffDate;
            if (timeFilter === 'past-3-days') {
                cutoffDate = new Date(now);
                cutoffDate.setDate(cutoffDate.getDate() - 3);
                cutoffDate.setHours(0, 0, 0, 0);
            } else if (timeFilter === 'past-week') {
                cutoffDate = new Date(now);
                cutoffDate.setDate(cutoffDate.getDate() - 7);
                cutoffDate.setHours(0, 0, 0, 0);
            } else {
                return data;
            }
            
            return data.filter(item => {
                const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
                return itemDate >= cutoffDate && itemDate <= now;
            });
        };
        
        return {
            individual: filterByTimeRange(chartData.individual, timeFilter),
            average: filterByTimeRange(chartData.average, timeFilter)
        };
    };

    // Function to transform and filter chart data based on selected topic
    const transformAndSetChartData = (individualStats, groupStats, filterTopicName) => {
                // Transform interactions over time data
                let interactionIndividual = (individualStats.interactions_over_time_by_topic || [])
                    .filter(item => item.date && item.interaction_count != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.interaction_count) || 0,
                        topic: item.topic_name
                    }));
                
                let interactionAverage = (groupStats.avg_interactions_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_interaction_count != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_interaction_count) || 0,
                        topic: item.topic_name
                    }));
                
                // If no topic filter, aggregate by date (sum all topics per day)
                if (!filterTopicName) {
                    const aggregateByDate = (data) => {
                        const dateMap = new Map();
                        data.forEach(item => {
                            const dateKey = item.date.toISOString().split('T')[0];
                            if (!dateMap.has(dateKey)) {
                                dateMap.set(dateKey, { date: item.date, interactions: 0 });
                            }
                            dateMap.get(dateKey).interactions += item.interactions;
                        });
                        return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
                    };
                    interactionIndividual = aggregateByDate(interactionIndividual);
                    interactionAverage = aggregateByDate(interactionAverage);
                }
                
                // Fill missing dates for continuous timeline
                interactionIndividual = fillMissingDates(interactionIndividual);
                interactionAverage = fillMissingDates(interactionAverage);
                
                setInteractionChartData({ individual: interactionIndividual, average: interactionAverage });
                
                // Transform duration over time data
                let durationIndividual = (individualStats.duration_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_duration != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_duration) || 0,
                        topic: item.topic_name
                    }));
                
                let durationAverage = (groupStats.avg_duration_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_duration != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_duration) || 0,
                        topic: item.topic_name
                    }));
                
                // If no topic filter, aggregate by date (average all topics per day)
                if (!filterTopicName) {
                    const aggregateByDate = (data) => {
                        const dateMap = new Map();
                        data.forEach(item => {
                            const dateKey = item.date.toISOString().split('T')[0];
                            if (!dateMap.has(dateKey)) {
                                dateMap.set(dateKey, { date: item.date, interactions: 0, count: 0 });
                            }
                            const entry = dateMap.get(dateKey);
                            entry.interactions += item.interactions;
                            entry.count += 1;
                        });
                        return Array.from(dateMap.values())
                            .map(item => ({ date: item.date, interactions: item.interactions / item.count }))
                            .sort((a, b) => a.date - b.date);
                    };
                    durationIndividual = aggregateByDate(durationIndividual);
                    durationAverage = aggregateByDate(durationAverage);
                }
                
                // Fill missing dates for continuous timeline
                durationIndividual = fillMissingDates(durationIndividual);
                durationAverage = fillMissingDates(durationAverage);
                
                setDurationChartData({ individual: durationIndividual, average: durationAverage });
                
                // Transform grades over time data (NEW)
                let gradesIndividual = (individualStats.grades_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_grade_points != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_grade_points) || 0,
                        topic: item.topic_name
                    }));
                
                let gradesAverage = (groupStats.avg_grades_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_grade_points != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_grade_points) || 0,
                        topic: item.topic_name
                    }));
                
                // If no topic filter, aggregate by date (average all topics per day)
                if (!filterTopicName) {
                    const aggregateByDate = (data) => {
                        const dateMap = new Map();
                        data.forEach(item => {
                            const dateKey = item.date.toISOString().split('T')[0];
                            if (!dateMap.has(dateKey)) {
                                dateMap.set(dateKey, { date: item.date, interactions: 0, count: 0 });
                            }
                            const entry = dateMap.get(dateKey);
                            entry.interactions += item.interactions;
                            entry.count += 1;
                        });
                        return Array.from(dateMap.values())
                            .map(item => ({ date: item.date, interactions: item.interactions / item.count }))
                            .sort((a, b) => a.date - b.date);
                    };
                    gradesIndividual = aggregateByDate(gradesIndividual);
                    gradesAverage = aggregateByDate(gradesAverage);
                }
                
                // Fill missing dates for continuous timeline
                gradesIndividual = fillMissingDates(gradesIndividual);
                gradesAverage = fillMissingDates(gradesAverage);
                
                setGradesChartData({ individual: gradesIndividual, average: gradesAverage });
                
                // Transform accuracy over time data (NEW)
                let accuracyOverTimeIndividual = (individualStats.accuracy_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_accuracy != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_accuracy) || 0,
                        topic: item.topic_name
                    }));
                
                let accuracyOverTimeAverage = (groupStats.avg_accuracy_over_time_by_topic || [])
                    .filter(item => item.date && item.avg_accuracy != null)
                    .filter(item => !filterTopicName || item.topic_name === filterTopicName)
                    .map(item => ({
                        date: new Date(item.date),
                        interactions: Number(item.avg_accuracy) || 0,
                        topic: item.topic_name
                    }));
                
                // If no topic filter, aggregate by date (average all topics per day)
                if (!filterTopicName) {
                    const aggregateByDate = (data) => {
                        const dateMap = new Map();
                        data.forEach(item => {
                            const dateKey = item.date.toISOString().split('T')[0];
                            if (!dateMap.has(dateKey)) {
                                dateMap.set(dateKey, { date: item.date, interactions: 0, count: 0 });
                            }
                            const entry = dateMap.get(dateKey);
                            entry.interactions += item.interactions;
                            entry.count += 1;
                        });
                        return Array.from(dateMap.values())
                            .map(item => ({ date: item.date, interactions: item.interactions / item.count }))
                            .sort((a, b) => a.date - b.date);
                    };
                    accuracyOverTimeIndividual = aggregateByDate(accuracyOverTimeIndividual);
                    accuracyOverTimeAverage = aggregateByDate(accuracyOverTimeAverage);
                }
                
                // Fill missing dates for continuous timeline
                accuracyOverTimeIndividual = fillMissingDates(accuracyOverTimeIndividual);
                accuracyOverTimeAverage = fillMissingDates(accuracyOverTimeAverage);
                
                setAccuracyOverTimeChartData({ individual: accuracyOverTimeIndividual, average: accuracyOverTimeAverage });
                
                // Store raw SOLO time-series data for bar chart time filtering
               // Store raw SOLO time-series data with nested structure
                setRawSoloTimeSeries({
                    questions: individualStats.questions_by_solo_over_time || { all_time: [], past_3_days: [], past_week: [] },
                    accuracy: individualStats.accuracy_by_solo_over_time || { all_time: [], past_3_days: [], past_week: [] }
                });
                
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
                
                // Transform question count by SOLO data - Handle topic filtering
                let questionIndividual, questionAverage;
                
                if (filterTopicName) {
                    // Filter by topic using solo_and_topic breakdown
                    const individualByTopic = (individualStats.questions_by_solo_and_topic || [])
                        .filter(item => item.topic_name === filterTopicName);
                    const averageByTopic = (groupStats.avg_questions_by_solo_and_topic || [])
                        .filter(item => item.topic_name === filterTopicName);
                    
                    questionIndividual = soloCategories.map(cat => {
                        const found = individualByTopic.find(item => item.solo_category === cat);
                        return { category: cat, value: found ? Number(found.question_count) || 0 : 0 };
                    });
                    questionAverage = soloCategories.map(cat => {
                        const found = averageByTopic.find(item => item.solo_category === cat);
                        return { category: cat, value: found ? Number(found.avg_questions_per_user) || 0 : 0 };
                    });
                } else {
                    // Use aggregated category data when no topic filter
                    questionIndividual = soloCategories.map(cat => {
                        const found = (individualStats.questions_by_solo_category || []).find(item => item.solo_category === cat);
                        return { category: cat, value: found ? Number(found.question_count) || 0 : 0 };
                    });
                    questionAverage = soloCategories.map(cat => {
                        const found = (groupStats.avg_questions_by_solo_category || []).find(item => item.solo_category === cat);
                        return { category: cat, value: found ? Number(found.avg_questions_per_user) || 0 : 0 };
                    });
                }
                
                setQuestionCountData({
                    categories: soloCategories,
                    individualData: questionIndividual,
                    averageData: questionAverage,
                    title: 'Number of Questions per Question Category'
                });
                
                // Transform answered questions by topic for reflective bar chart
                const topicCategories = (individualStats.answered_questions_by_topic || [])
                    .filter(t => t.topic_name)
                    .map(t => t.topic_name);
                
                const topicIndividual = (individualStats.answered_questions_by_topic || [])
                    .filter(t => t.topic_name)
                    .map(t => ({
                        category: t.topic_name,
                        value: Number(t.answered_question_count) || 0  // User's answered questions per topic
                    }));
                
                const topicAverage = topicCategories.map(topicName => {
                    const found = (groupStats.answered_questions_by_topic || []).find(t => t.topic_name === topicName);
                    const avgAnswered = found ? (Number(found.avg_answered_per_user) || 0) : 0;
                    return { category: topicName, value: avgAnswered }; // Average answered questions per user
                });
                
                setTopicalPerformanceData({
                    categories: topicCategories,
                    leftData: topicAverage,
                    rightData: topicIndividual,
                    leftLabel: 'Class Average',
                    rightLabel: 'Your Answered Questions',
                    title: 'Answered Questions per Topic'
                });
                
                setOverallGrades({
                    questionQuality: individualStats.overall_average_grade_letter,
                    answerAccuracy: individualStats.average_answer_accuracy, // Note: this will be in the form of float 
                    avgQuestionQuality: groupStats.overall_average_grade_letter || 'N/A',
                    avgAnswerAccuracy: groupStats.overall_average_accuracy || 'N/A', // Float again
                    questionQualityGPA: Number(individualStats.average_question_grade) || null,
                    answerAccuracyGPA: Number(individualStats.average_answer_accuracy) || null,
                    avgQuestionQualityGPA: Number(groupStats.overall_average_grade) || null,
                    avgAnswerAccuracyGPA: Number(groupStats.overall_average_accuracy) || null
                });
    };

    
    
    // Re-filter data when topic filter changes
    useEffect(() => {
        if (rawIndividualStats && rawGroupStats) {
            transformAndSetChartData(rawIndividualStats, rawGroupStats, selectedTopic);
        }
    }, [selectedTopic]);
    
    // Update bar chart data when time filter changes - access pre-aggregated data from backend
    useEffect(() => {
        if (!rawIndividualStats || !rawGroupStats) return;
        
        // Map timeFilter to backend key
        const timeFilterKey = timeFilter === 'past-3-days' ? 'past_3_days' 
            : timeFilter === 'past-week' ? 'past_week' 
            : 'all_time';
        
        const soloCategories = ['Unistructural', 'Multistructural', 'Relational', 'Extended Abstract'];
        
        // Determine filter: topic_id for selected topic, or null for all topics
        const topicFilter = selectedTopic 
            ? (topicNameToIdMap[selectedTopic] || null)
            : null;
        
        // Get pre-aggregated question count data from backend (filtered by topic)
        const questionsData = rawSoloTimeSeries.questions[timeFilterKey] || [];
        const questionsFiltered = questionsData.filter(item => 
            topicFilter === null ? item.topic_id === null : item.topic_id === topicFilter
        );
        const questionIndividual = soloCategories.map(cat => {
            const found = questionsFiltered.find(item => item.solo_category === cat);
            return { category: cat, value: found ? Number(found.question_count) || 0 : 0 };
        });
        
        // Get pre-aggregated group question data (filtered by topic)
        const groupQuestionsKey = `questions_by_solo_over_time`;
        const groupQuestionsData = (rawGroupStats[groupQuestionsKey] && rawGroupStats[groupQuestionsKey][timeFilterKey]) || [];
        const groupQuestionsFiltered = groupQuestionsData.filter(item => 
            topicFilter === null ? item.topic_id === null : item.topic_id === topicFilter
        );
        const questionAverage = soloCategories.map(cat => {
            const found = groupQuestionsFiltered.find(item => item.solo_category === cat);
            return { category: cat, value: found ? Math.round(Number(found.question_count) || 0) : 0 };
        });
        
        setQuestionCountData({
            categories: soloCategories,
            individualData: questionIndividual,
            averageData: questionAverage,
            title: 'Number of Questions per Question Category'
        });
        
        // Get pre-aggregated accuracy data from backend (filtered by topic)
        const accuracyData = rawSoloTimeSeries.accuracy[timeFilterKey] || [];
        const accuracyFiltered = accuracyData.filter(item => 
            topicFilter === null ? item.topic_id === null : item.topic_id === topicFilter
        );
        const accuracyIndividual = soloCategories.map(cat => {
            const found = accuracyFiltered.find(item => item.solo_category === cat);
            return { category: cat, value: found ? Math.round(Number(found.avg_accuracy) || 0) : 0 };
        });
        
        // Get pre-aggregated group accuracy data (filtered by topic)
        const groupAccuracyKey = `accuracy_by_solo_over_time`;
        const groupAccuracyData = (rawGroupStats[groupAccuracyKey] && rawGroupStats[groupAccuracyKey][timeFilterKey]) || [];
        const groupAccuracyFiltered = groupAccuracyData.filter(item => 
            topicFilter === null ? item.topic_id === null : item.topic_id === topicFilter
        );
        const accuracyAverage = soloCategories.map(cat => {
            const found = groupAccuracyFiltered.find(item => item.solo_category === cat);
            return { category: cat, value: found ? Math.round(Number(found.avg_accuracy) || 0) : 0 };
        });
        
        setAccuracyChartData({
            categories: soloCategories,
            individualData: accuracyIndividual,
            averageData: accuracyAverage,
            title: 'Answer Accuracy per Question Category'
        });
    }, [timeFilter, rawSoloTimeSeries, rawGroupStats, rawIndividualStats, selectedTopic, topicNameToIdMap]);

    const handleTopicSelection = React.useCallback((topicName) => {
    // Logic to toggle: if clicking same topic, set to null, else set to new topic
    setSelectedTopic(prev => prev === topicName ? null : topicName);
}, []);
    
    
    // Fetch questions when a topic is selected, else fetch all questions
   useEffect(() => {
        const fetchQuestions = async () => {
            // Only fetch if topic map is ready (or no topic selected)
            if (!selectedTopic || Object.keys(topicIdMap).length > 0) {
                setQuestionsLoading(true);
                try {
                    const topicId = selectedTopic ? topicIdMap[selectedTopic] : '';
                    
                    // REFACTOR 1: Add user_id and page parameters to the URL
                    // We use `per_page=5` to match your log example
                    const queryParams = new URLSearchParams({
                        user_id: USER_ID,
                        page: page,
                        per_page: 4, 
                        ...(topicId && { topic_id: topicId })
                    });

                    const url = `${API_ENDPOINTS.questions}?${queryParams.toString()}`;
                    
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (!response.ok) throw new Error('Failed to fetch question data');
                    
                    const responseData = await response.json();
                    
                    // REFACTOR 2: Handle the { data, pagination } structure
                    // If .data exists, use it. Otherwise check if it's a direct array.
                    const questionsRaw = responseData.data || (Array.isArray(responseData) ? responseData : []);
                    
                    // Update total pages from metadata if available
                    if (responseData.pagination) {
                        setTotalPages(responseData.pagination.total_pages);
                    }
                    
                    // Transform data
                    const transformedData = questionsRaw.map(q => ({
                        id: q.question_id,
                        question: q.content || 'No content',
                        grade: q.grade || 'N/A',
                        reasoning: q.reasoning || 'N/A',
                        soloLevel: q.solo_taxonomy_level || 'N/A',
                        conversation_id: q.conversation_id,
                        timestamp: q.timestamp
                            ? new Date(q.timestamp).toLocaleString('en-US', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit'
                            })
                            : 'N/A',
                        // Answer details (if available)
                        answer: q.answer ? {
                            id: q.answer.answer_id,
                            content: q.answer.content || 'No answer',
                            accuracy: q.answer.accuracy_score,
                            feedback: q.answer.feedback || 'N/A'
                        } : null
                    }));
                    
                    setQuestions(transformedData); // Note: Your state is named 'conversations' in the snippet, ensure this matches
                    
                } catch (error) {
                    console.error('Error fetching questions:', error);
                    setQuestions([]);
                } finally {
                    setQuestionsLoading(false);
                }
            }
        };
        
        fetchQuestions();
    }, [selectedTopic, page]);


            // Fetch topic dependencies when a topic is selected
        useEffect(() => {

            if (!USER_ID) return; // Safety check

            const fetchTopicDependencies = async () => {
                setDependenciesLoading(true);
                try {
                    // 1. Pass user_id to backend (so it injects grades automatically)
                    const response = await fetch(`${API_ENDPOINTS.topicDependencies}?user_id=${USER_ID}`);
                    
                    if (!response.ok) throw new Error('Failed to fetch topic dependencies');
                    
                    const data = await response.json();

                    // 2. Set Data Directly (Backend now handles structure, grades, and types)
                    setTopicDependencies(data);

                    // 3. Condensed Map Logic (Reduced from 10 lines to 5)
                    const idMap = (data.nodes || []).reduce((acc, node) => {
                        if (node.type === 'topic') {
                            const numericId = parseInt(node.id.replace('topic_', '')) || node.id;
                            acc[node.label] = numericId;
                        }
                        return acc;
                    }, {});
                    
                    setTopicIdMap(idMap);

                } catch (error) {
                    console.error('Dependency fetch failed:', error);
                    setTopicDependencies({ nodes: [], links: [] }); // Safe fallback
                } finally {
                    setDependenciesLoading(false);
                }
            };

            fetchTopicDependencies();
        }, [USER_ID]); // <--- IMPORTANT: Re-run this if the user changes

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
        <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", fontFamily: "sans-serif", minHeight: "100vh" }}>
            
            {/* 1. Header & Navigation */}
            <div style={{ marginBottom: "2rem" }}>
              
                <h1 style={{textAlign: "center", paddingTop: 30, marginBottom: 0}}>NALA-Assess Dashboard</h1>
                
                {/* Global Topic Indicator (Always visible so users know what context they are in) */}
                <div style={{ textAlign: "center", margin: "1rem 0.3rem", paddingTop:10}}>
                    <span style={{ 
                        backgroundColor: selectedTopic ? "#e0f2fe" : "#f3f4f6",
                        padding: "0.5rem 1.5rem", 
                        borderRadius: "20px",
                        fontWeight: "bold",
                        color: selectedTopic ? "#0369a1" : "#666"
                    }}>
                        Current Context: {selectedTopic || "All Topics"}
                    </span>
                </div>

                {/* Tab Navigation Layer */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center' }}>
                    <Tabs 
                        value={currentTab} 
                        onChange={handleTabChange} 
                        aria-label="dashboard tabs"
                        sx={{
                            '& .MuiTab-root': { 
                                color: 'text.secondary'
                            },
                            '& .Mui-selected': { 
                                color: 'primary.main' 
                            }
                        }}
                    >
                        <Tab label="Overview & Summary" />
                        <Tab label="Topic Explorer" />
                        <Tab label="Detailed Analytics" />
                    </Tabs>
                </Box>
            </div>

            {/* ================= TAB 1: OVERVIEW ================= */}
            {/* Using display: none keeps the components mounted so they don't lose state/animation when switching */}
            <div role="tabpanel" hidden={currentTab !== 0}>
                {currentTab === 0 && (
                    <>
                        {/* LLM Summary Section (Lines 335-467 in your file) */}
                        <section style={{ marginBottom: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <h2 style={{ textAlign: "center", color: "#858996ff", margin: 0 }}>Learning Progress Summary</h2>
                                <MarkdownTooltip title={`### Learning Progress Summary

This AI-generated summary analyzes your learning patterns across all topics.

**What it shows:**
- Your strongest and weakest areas
- Learning trends over time
- Personalized recommendations

**How to use it:**
Review this regularly to identify areas to start jumping in with NALA-Assess!`}>
                                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                                </MarkdownTooltip>
                            </div>
                            {/* ... Insert your existing LLM Summary JSX here ... */}
                            {summaryLoading ? <div>Loading...</div> : <div><section style={{
                width: "100%",
                marginBottom: "2rem"
            }}>
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
                    // Use gradeComparison status: 'above', 'below', or 'at'
                    const comparison = overallGrades.gradeComparison;
                    let bgColor, borderColor, textColor, shadowColor;
                    
                    if (comparison === 'above') {
                        bgColor = "#f0fdf4";
                        borderColor = "#10b981";
                        textColor = "#10b981";
                        shadowColor = "rgba(16, 185, 129, 0.3)";
                    } else if (comparison === 'below') {
                        bgColor = "#fef2f2";
                        borderColor = "#ef4444";
                        textColor = "#ef4444";
                        shadowColor = "rgba(239, 68, 68, 0.3)";
                    } else {  // 'at' class average
                        bgColor = "#fef3c7";
                        borderColor = "#f59e0b";
                        textColor = "#f59e0b";
                        shadowColor = "rgba(245, 158, 11, 0.3)";
                    }
                    
                    return (
                        <div
                            style={{
                                background: bgColor,
                                gap: "1rem",
                                padding: "1rem",
                                borderRadius: "20px",
                                minWidth: "160px",
                                boxShadow: `0 2px 12px ${shadowColor}`,
                                border: `2px solid ${borderColor}`
                            }}
                        >   
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "0.85rem", textAlign: "left" }}>
                                Overall Estimated Question Quality
                            </div>
                            <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: textColor, textAlign: "center" }}>
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
                                {overallGrades.answerAccuracy != null ? Math.round(overallGrades.answerAccuracy) : 'N/A'}
                            </div>
                            <div style={{ color: "#666", fontWeight:"bold", fontSize: "1rem", textAlign: "right" }}>
                                Average: <span style={{ color: "#888" }}>{overallGrades.avgAnswerAccuracy != null ? Math.round(overallGrades.avgAnswerAccuracy) : 'N/A'}</span>
                            </div>
                        </div>
                    );
                })()}
            </section>
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
                                        // Use gradeComparison status from backend
                                        const comparison = overallGrades.gradeComparison;
                                        let bgColor, borderColor, textColor;
                                        
                                        if (comparison === 'above') {
                                            bgColor = "#f0fdf4";
                                            borderColor = "#10b981";
                                            textColor = "#059669";
                                        } else if (comparison === 'below') {
                                            bgColor = "#fef2f2";
                                            borderColor = "#ef4444";
                                            textColor = "#dc2626";
                                        } else {  // 'at' class average
                                            bgColor = "#fef3c7";
                                            borderColor = "#f59e0b";
                                            textColor = "#d97706";
                                        }
                                        
                                        return (
                                            <div style={{
                                                flex: "1",
                                                minWidth: "280px",
                                                maxWidth: "400px",
                                                backgroundColor: bgColor,
                                                padding: "1.5rem",
                                                borderRadius: "12px",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                                borderLeft: `4px solid ${borderColor}`
                                            }}>
                                                <ReactMarkdown components={{
                                                    ...markdownComponents,
                                                    h2: ({node, ...props}) => <h3 style={{
                                                        fontSize: "1.3rem",
                                                        fontWeight: "bold",
                                                        color: textColor,
                                                        marginTop: 0,
                                                        marginBottom: "0.75rem",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px"
                                                    }} {...props} />,
                                                    strong: ({node, ...props}) => <strong style={{
                                                        fontWeight: "bold",
                                                        color: textColor,
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
            </section></div>}
                        </section>

                        {/* SOLO Taxonomy Rubric Section */}
                        <section style={{ marginBottom: "2rem", marginTop: "2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                                <h2 style={{ textAlign: "center", color: "#858996ff", margin: 0 }}>Question Complexity Rubric (SOLO Taxonomy)</h2>
           
                            </div>
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "3rem",
                                flexWrap: "wrap",
                                maxWidth: "1200px",
                                margin: "0 auto"
                            }}>
                                {/* Grade Boxes Container */}
                                <div style={{
                                    display: "flex",
                                    gap: "2rem",
                                    flexWrap: "wrap",
                                    justifyContent: "center"
                                }}>
                                    {/* Unistructural - C */}
                                    <div 
                                        onMouseEnter={() => setHoveredGrade('C')}
                                        onMouseLeave={() => setHoveredGrade(null)}
                                        style={{
                                            width: "140px",
                                            height: "140px",
                                            borderRadius: "12px",
                                            backgroundColor: "#fef3c7",
                                            border: "3px solid #f59e0b",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "5rem",
                                            fontWeight: "bold",
                                            color: "#f59e0b",
                                            transition: "all 0.3s ease",
                                            boxShadow: hoveredGrade === 'C' ? "0 4px 16px rgba(245, 158, 11, 0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                                            transform: hoveredGrade === 'C' ? "scale(1.08)" : "scale(1)"
                                        }}
                                    >
                                        C
                                    </div>

                                    {/* Multistructural - B */}
                                    <div 
                                        onMouseEnter={() => setHoveredGrade('B')}
                                        onMouseLeave={() => setHoveredGrade(null)}
                                        style={{
                                            width: "140px",
                                            height: "140px",
                                            borderRadius: "12px",
                                            backgroundColor: "#bfdbfe",
                                            border: "3px solid #3b82f6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "5rem",
                                            fontWeight: "bold",
                                            color: "#3b82f6",
                                            transition: "all 0.3s ease",
                                            boxShadow: hoveredGrade === 'B' ? "0 4px 16px rgba(59, 130, 246, 0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                                            transform: hoveredGrade === 'B' ? "scale(1.08)" : "scale(1)"
                                        }}
                                    >
                                        B
                                    </div>

                                    {/* Relational - A */}
                                    <div 
                                        onMouseEnter={() => setHoveredGrade('A')}
                                        onMouseLeave={() => setHoveredGrade(null)}
                                        style={{
                                            width: "140px",
                                            height: "140px",
                                            borderRadius: "12px",
                                            backgroundColor: "#d1fae5",
                                            border: "3px solid #10b981",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "5rem",
                                            fontWeight: "bold",
                                            color: "#10b981",
                                            transition: "all 0.3s ease",
                                            boxShadow: hoveredGrade === 'A' ? "0 4px 16px rgba(16, 185, 129, 0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                                            transform: hoveredGrade === 'A' ? "scale(1.08)" : "scale(1)"
                                        }}
                                    >
                                        A
                                    </div>

                                    {/* Extended Abstract - A+ */}
                                    <div 
                                        onMouseEnter={() => setHoveredGrade('A+')}
                                        onMouseLeave={() => setHoveredGrade(null)}
                                        style={{
                                            width: "140px",
                                            height: "140px",
                                            borderRadius: "12px",
                                            backgroundColor: "#e9d5ff",
                                            border: "3px solid #8b5cf6",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: "4rem",
                                            fontWeight: "bold",
                                            color: "#8b5cf6",
                                            transition: "all 0.3s ease",
                                            boxShadow: hoveredGrade === 'A+' ? "0 4px 16px rgba(139, 92, 246, 0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
                                            transform: hoveredGrade === 'A+' ? "scale(1.08)" : "scale(1)",
                                            letterSpacing: "-2px"
                                        }}
                                    >
                                        A+
                                    </div>
                                </div>

                                {/* Information Box */}
                                <div style={{
                                    width: "450px",
                                    minHeight: "200px",
                                    backgroundColor: hoveredGrade ? "#f9fafb" : "#ffffff",
                                    border: hoveredGrade ? "2px solid #e5e7eb" : "2px dashed #d1d5db",
                                    borderRadius: "12px",
                                    padding: "1.5rem",
                                    boxShadow: hoveredGrade ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                                    transition: "all 0.3s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: hoveredGrade ? "flex-start" : "center",
                                    alignItems: hoveredGrade ? "stretch" : "center"
                                }}>
                                    {!hoveredGrade ? (
                                        <p style={{ 
                                            color: "#9ca3af", 
                                            fontSize: "1rem", 
                                            textAlign: "center",
                                            fontStyle: "italic"
                                        }}>
                                            Hover over a grade to see tips
                                        </p>
                                    ) : (
                                        <>
                                            {hoveredGrade === 'C' && (
                                                <>
                                                    <h3 style={{ margin: "0 0 0.75rem 0", color: "#f59e0b", fontSize: "1.4rem", fontWeight: "bold" }}>
                                                        Unistructural (Grade C)
                                                    </h3>
                                                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#555", lineHeight: "1.5" }}>
                                                        You're asking basic recall questions about single facts or definitions.
                                                    </p>
                                                    <div style={{ 
                                                        backgroundColor: "#fffbeb", 
                                                        padding: "0.75rem", 
                                                        borderRadius: "6px",
                                                        borderLeft: "3px solid #f59e0b",
                                                        marginBottom: "0.75rem"
                                                    }}>
                                                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#78350f", fontWeight: "600" }}>
                                                         To reach Grade B:
                                                        </p>
                                                        <p style={{ margin: "0", fontSize: "0.85rem", color: "#78350f", lineHeight: "1.4" }}>
                                                            Instead of "What is X?", try asking "What are the key components of X and how does each function?"
                                                        </p>
                                                    </div>
                                                    <p style={{ margin: "0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                                                        Ask yourself: "Am I listing multiple related concepts instead of just one?"
                                                    </p>
                                                </>
                                            )}
                                            {hoveredGrade === 'B' && (
                                                <>
                                                    <h3 style={{ margin: "0 0 0.75rem 0", color: "#3b82f6", fontSize: "1.4rem", fontWeight: "bold" }}>
                                                        Multistructural (Grade B)
                                                    </h3>
                                                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#555", lineHeight: "1.5" }}>
                                                        You're describing multiple concepts but they're adjacent to one another in the same topic.
                                                    </p>
                                                    <div style={{ 
                                                        backgroundColor: "#eff6ff", 
                                                        padding: "0.75rem", 
                                                        borderRadius: "6px",
                                                        borderLeft: "3px solid #3b82f6",
                                                        marginBottom: "0.75rem"
                                                    }}>
                                                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#1e3a8a", fontWeight: "600" }}>
                                                            To reach Grade A:
                                                        </p>
                                                        <p style={{ margin: "0", fontSize: "0.85rem", color: "#1e3a8a", lineHeight: "1.4" }}>
                                                            Connect ideas across topics and analyze cause-effect relationships or trade-offs between certain parameters.
                                                        </p>
                                                    </div>
                                                    <p style={{ margin: "0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                                                        Ask yourself: "Am I exploring how changing one parameter impacts others?"
                                                    </p>
                                                </>
                                            )}
                                            {hoveredGrade === 'A' && (
                                                <>
                                                    <h3 style={{ margin: "0 0 0.75rem 0", color: "#10b981", fontSize: "1.4rem", fontWeight: "bold" }}>
                                                        Relational (Grade A)
                                                    </h3>
                                                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#555", lineHeight: "1.5" }}>
                                                        You're analyzing how concepts interact across topics and exploring their relationships.
                                                    </p>
                                                    <div style={{ 
                                                        backgroundColor: "#f0fdf4", 
                                                        padding: "0.75rem", 
                                                        borderRadius: "6px",
                                                        borderLeft: "3px solid #10b981",
                                                        marginBottom: "0.75rem"
                                                    }}>
                                                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#064e3b", fontWeight: "600" }}>
                                                            To reach Grade A+:
                                                        </p>
                                                        <p style={{ margin: "0", fontSize: "0.85rem", color: "#064e3b", lineHeight: "1.4" }}>
                                                            Apply theoretical knowledge to specific real-world scenarios with constraints and multiple variables.
                                                        </p>
                                                    </div>
                                                    <p style={{ margin: "0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                                                        Ask yourself: "Am I applying theory to a specific real-world context with constraints?"
                                                    </p>
                                                </>
                                            )}
                                            {hoveredGrade === 'A+' && (
                                                <>
                                                    <h3 style={{ margin: "0 0 0.75rem 0", color: "#8b5cf6", fontSize: "1.4rem", fontWeight: "bold" }}>
                                                        Extended Abstract (Grade A+)
                                                    </h3>
                                                    <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", color: "#555", lineHeight: "1.5" }}>
                                                        You're integrating concepts with real-world applications and evaluating alternatives.
                                                    </p>
                                                    <div style={{ 
                                                        backgroundColor: "#faf5ff", 
                                                        padding: "0.75rem", 
                                                        borderRadius: "6px",
                                                        borderLeft: "3px solid #8b5cf6",
                                                        marginBottom: "0.75rem"
                                                    }}>
                                                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#581c87", fontWeight: "600" }}>
                                                            Keep excelling:
                                                        </p>
                                                        <p style={{ margin: "0", fontSize: "0.85rem", color: "#581c87", lineHeight: "1.4" }}>
                                                            Explore edge cases, compare multiple solutions, and consider implementation constraints and trade-offs.
                                                        </p>
                                                    </div>
                                                    <p style={{ margin: "0", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                                                        Ask yourself: "Am I comparing alternatives and evaluating trade-offs of different options in realistic scenarios?"
                                                    </p>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Stats Grid (Lines 469-563) */}
                        <section className="dashboard-stats-grid" style={{ display: "flex", justifyContent: "center", gap: "3rem" }}>
                            {/* ... Insert your existing Stats Grid JSX here ... */}
                            
                        </section>
                    </>
                )}
            </div>

            {/* ================= TAB 2: TOPIC EXPLORER ================= */}
            <div role="tabpanel" hidden={currentTab !== 1}>
                {currentTab === 1 && (
                    <section style={{ width: "100%", marginTop: "1rem" }}>
                        <div style={{ 
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gridTemplateRows: "auto auto",
                            gap: "2rem",
                            padding: "0 1rem"
                        }}>
                            
                            {/* Left: Reflective Bar Chart - Row 1, Col 1 */}
                            <div style={{
                        gridRow: "1",
                        gridColumn: "1",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                            <h2 style={{ 
                                textAlign: "center", 
                                margin: 0,
                                color: "#555"
                            }}>
                                Number of Interactions by Topic
                            </h2>
                            <MarkdownTooltip title={`### Topic Interaction Comparison

**Blue bars:** Your conversation count per topic

**Orange bars:** Class average

**How to interpret:**
- Longer bars = more engagement
- Compare your bars to class average
- Click bars to filter detailed analytics

**Tip:** Focus on topics with fewer interactions if they're challenging areas.`}>
                                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                            </MarkdownTooltip>
                        </div>
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
                                <select 
                                    value = {sortOption}
                                    onChange = {(e) => setSortOption(e.target.value)}
                                    style={{ 
                                    padding: "0.5rem", 
                                    borderRadius: "6px", 
                                    border: "1px solid #ccc",
                                    fontSize: "14px"
                                }}> 
                                    <option value="">No sort</option>
                                    <option value="ascending">Questions: Low to High</option>
                                    <option value="descending">Questions: High to Low</option>
                                    <option value="grade-high-low">Grade: High to Low</option>
                                    <option value="grade-low-high">Grade: Low to High</option>
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
                                        ...finalChartData,
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
                            
                        </div>
                    </div>

                            {/* Right: Topic Graph and Question Table - Row 1, Col 2 */}
                            <div style={{
                        gridRow: "1",
                        gridColumn: "2",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem"
                    }}>
                        {/* Topic Graph */}
                        <div style={{
                            backgroundColor: "white",
                            padding: "1rem",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.75rem"
                            }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <h3 style={{ 
                                            color: "#555",
                                            margin: 0,
                                            fontSize: "1.1rem"
                                        }}>
                                            Topic Dependencies: {selectedTopic || "Select a topic"}
                                        </h3>
                                        <MarkdownTooltip title={`### Topic Network

**Node colors (Grade C-A+):**
- **Green:** Excellent understanding - *challenge yourself with edge cases and real-world applications*
- **Blue:** Solid grasp - *make connections between this and related concepts*  
- **Yellow:** Basic knowledge - *ask "why" and "how" to deepen understanding*
- **Grey:** You haven't explored this topic in your interactions with the chatbot!

**Node size:** Larger = topics, Smaller = subtopics

**Tip for yellow topics:** How do I ask better questions to deepen my understanding?

`}>
                                            <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                                        </MarkdownTooltip>
                                    </div>
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
                                        {topicGraphResetFn && (
                                            <Button 
                                                variant="outlined" 
                                                size="small"
                                                onClick={topicGraphResetFn}
                                                style={{
                                                    fontSize: "0.8rem",
                                                    fontWeight: "bold",
                                                    padding: "0.4rem 1rem"
                                                }}
                                            >
                                                Reset Zoom
                                            </Button>
                                        )}
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
                                        {/* Instructional Text */}
                                        <div style={{
                                            backgroundColor: "#f8fafc",
                                            padding: "0.75rem 1rem",
                                            borderRadius: "8px",
                                            border: "1px solid #e2e8f0",
                                            fontSize: "0.85rem",
                                            color: "#64748b",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#3b82f6",
                                                    border: "2px solid #2563eb"
                                                }}></div>
                                                <span>Large circles = Topics</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div style={{
                                                    width: "12px",
                                                    height: "12px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#3b82f6",
                                                    border: "2px solid #2563eb"
                                                }}></div>
                                                <span>Small circles = Subtopics</span>
                                            </div>
                                            <span style={{ marginLeft: "auto", fontStyle: "italic" }}>
                                                Click a topic to view its subtopic grades
                                            </span>
                                        </div>
                                        
                                        <TopicGraph 
                                            selectedTopic={selectedTopic}
                                            onTopicSelect={handleTopicSelection}
                                            width={700}
                                            height={580}
                                            graphData = {topicDependencies}
                                            onResetReady={(resetFn) => setTopicGraphResetFn(() => resetFn)}
                                        />
                                        
                                    </>
                                ) : (
                                    <div style={{
                                        textAlign: "center",
                                        color: "#94a3b8",
                                        fontSize: "0.95rem",
                                        padding: "2rem"
                                    }}>
                                     Click on a topic to visualize dependencies
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>

                            {/* Bottom: Full-width Question Table spanning both columns */}
                            {selectedTopic && (
                                <div style={{
                                    gridRow: "2",
                                    gridColumn: "1 / -1",
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "12px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    display: "flex",
                                    flexDirection: "column",
                                    maxHeight: "500px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <h3 style={{ 
                                                color: "#555",
                                                margin: 0,
                                                fontSize: "1rem"
                                            }}>
                                                Recent Questions
                                            </h3>
                                            <MarkdownTooltip title={`### Recent Interactions

Shows your latest chatbot conversations.

**Each card displays:**
- Question text and timestamp
- AI-evaluated question quality grade
- AI-evaluated answer accuracy grade
- A link where you can visit your conversation in context

**Use this to:**
Reflect on your recent learning patterns and question quality, as well as revisit questions in context.`}>
                                                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                                            </MarkdownTooltip>
                                        </div>
                                        <Button 
                                            variant={showAnsweredOnly ? "contained" : "outlined"}
                                            size="small"
                                            onClick={() => setShowAnsweredOnly(!showAnsweredOnly)}
                                            style={{
                                                fontSize: "0.75rem",
                                                padding: "0.3rem 0.8rem",
                                                textTransform: "none"
                                            }}
                                        >
                                            {showAnsweredOnly ? "Show All" : "Answered Only"}
                                        </Button>
                                    </div>
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
                                                        fontSize: "0.8rem",
                                                        width: "25%"
                                                    }}>Question</th>
                                                    <th style={{ 
                                                        padding: "0.6rem", 
                                                        textAlign: "center",
                                                        borderBottom: "2px solid #e2e8f0",
                                                        color: "#64748b",
                                                        fontWeight: "600",
                                                        width: "60px",
                                                        fontSize: "0.8rem"
                                                    }}>Q Grade</th>
                                                    <th style={{ 
                                                        padding: "0.6rem", 
                                                        textAlign: "left",
                                                        borderBottom: "2px solid #e2e8f0",
                                                        color: "#64748b",
                                                        fontWeight: "600",
                                                        fontSize: "0.8rem",
                                                        width: "25%"
                                                    }}>Answer</th>
                                                    <th style={{ 
                                                        padding: "0.6rem", 
                                                        textAlign: "center",
                                                        borderBottom: "2px solid #e2e8f0",
                                                        color: "#64748b",
                                                        fontWeight: "600",
                                                        width: "60px",
                                                        fontSize: "0.8rem"
                                                    }}>A Grade</th>
                                                    <th style={{ 
                                                        padding: "0.6rem", 
                                                        textAlign: "center",
                                                        borderBottom: "2px solid #e2e8f0",
                                                        color: "#64748b",
                                                        fontWeight: "600",
                                                        width: "120px",
                                                        fontSize: "0.8rem"
                                                    }}>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {conversationsLoading ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                        Loading questions...
                                                    </td>
                                                </tr>
                                            ) : conversations.filter(chat => !showAnsweredOnly || chat.answer !== null).length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                                        {showAnsweredOnly ? 'No answered questions found' : 'No questions found'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                conversations.filter(chat => !showAnsweredOnly || chat.answer !== null).map((chat, index) => (
                                                    <tr key={chat.id} style={{
                                                        backgroundColor: index % 2 === 0 ? "white" : "#f8fafc"
                                                    }}>
                                            <td style={{ 
                                                padding: "0.6rem",
                                                borderBottom: "1px solid #e2e8f0",
                                                color: "#334155",
                                                maxWidth: "250px"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.3rem" }}>
                                                    <span style={{
                                                        flex: 1,
                                                        wordWrap: "break-word",
                                                        overflowWrap: "break-word"
                                                    }}>{chat.question}</span>
                                                    <MarkdownTooltip title={`**Question Details:**\n\n${chat.question}\n\n---\n\n**Reasoning:** ${chat.reasoning}\n\n**SOLO Level:** ${chat.soloLevel}`}>
                                                        <IconButton size="small" style={{ padding: "2px", marginTop: "2px" }}>
                                                            <InfoOutlinedIcon style={{ fontSize: "0.9rem", color: "#64748b" }} />
                                                        </IconButton>
                                                    </MarkdownTooltip>
                                                </div>
                                            </td>
                                            <td style={{ 
                                                padding: "0.6rem",
                                                textAlign: "center",
                                                borderBottom: "1px solid #e2e8f0",
                                                fontWeight: "bold",
                                                color: chat.grade.startsWith('A') ? "#10b981" : "#3b82f6"
                                            }}>{chat.grade}</td>
                                            <td style={{ 
                                                padding: "0.6rem",
                                                borderBottom: "1px solid #e2e8f0",
                                                color: "#334155",
                                                maxWidth: "250px"
                                            }}>
                                                {chat.answer ? (
                                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.3rem" }}>
                                                        <span style={{
                                                            flex: 1,
                                                            wordWrap: "break-word",
                                                            overflowWrap: "break-word"
                                                        }}>{chat.answer.content}</span>
                                                        <MarkdownTooltip title={`**Answer Details:**\n\n${chat.answer.content}\n\n---\n\n**Feedback:** ${chat.answer.feedback}\n\n**Accuracy:** ${chat.answer.accuracy}%`}>
                                                            <IconButton size="small" style={{ padding: "2px", marginTop: "2px" }}>
                                                                <InfoOutlinedIcon style={{ fontSize: "0.9rem", color: "#64748b" }} />
                                                            </IconButton>
                                                        </MarkdownTooltip>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td style={{ 
                                                padding: "0.6rem",
                                                textAlign: "center",
                                                borderBottom: "1px solid #e2e8f0",
                                                fontWeight: "bold",
                                                color: chat.answer ? (
                                                    chat.answer.accuracy >= 80 ? "#10b981" : 
                                                    chat.answer.accuracy >= 60 ? "#f59e0b" : "#ef4444"
                                                ) : "#94a3b8"
                                            }}>{chat.answer ? `${chat.answer.accuracy}%` : '—'}</td>
                                            <td style={{ 
                                                padding: "0.6rem",
                                                textAlign: "center",
                                                borderBottom: "1px solid #e2e8f0",
                                                color: "#64748b",
                                                fontSize: "0.8rem"
                                            }}>{chat.timestamp}</td>
                                                </tr>
                                            ))
                                        )}
                                            </tbody>
                                        </table>
                                <div style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center",
                                    paddingTop: "1rem",
                                    borderTop: "1px solid #e2e8f0"
                                }}>
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        disabled={page === 1 || conversationsLoading}
                                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        Previous
                                    </Button>
                                    
                                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                                    </span>
                                    
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        disabled={page >= totalPages || conversationsLoading}
                                        onClick={() => setPage(prev => prev + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* ================= TAB 3: DETAILED ANALYTICS ================= */}
            <div role="tabpanel" hidden={currentTab !== 2}>
                {currentTab === 2 && (
                    <>
                        {/* Time Filter Controls */}
                        <div style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "1rem",
                            marginTop: "1.5rem",
                            marginBottom: "1rem"
                        }}>
                            <span style={{ fontWeight: "600", color: "#555" }}>Time Range:</span>
                            <div style={{
                                display: "flex",
                                gap: "0.5rem",
                                backgroundColor: "#f3f4f6",
                                padding: "0.25rem",
                                borderRadius: "8px"
                            }}>
                                {[
                                    { value: 'past-3-days', label: 'Past 3 Days' },
                                    { value: 'past-week', label: 'Past Week' },
                                    { value: 'all-time', label: 'All Time' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setTimeFilter(option.value)}
                                        style={{
                                            padding: "0.5rem 1rem",
                                            borderRadius: "6px",
                                            border: "none",
                                            cursor: "pointer",
                                            fontWeight: timeFilter === option.value ? "600" : "400",
                                            backgroundColor: timeFilter === option.value ? "#3b82f6" : "transparent",
                                            color: timeFilter === option.value ? "white" : "#555",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Bar Charts */}
                        <section style={{ marginTop: "2rem" }}>
                            <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <h3 style={{ 
                                    marginBottom: "0.5rem",
                                    color: "#555",
                                    margin: 0
                                }}>
                                    Answer Accuracy per Question Category
                                    {selectedTopic && (
                                        <span style={{ display: "block", fontSize: "0.75rem", color: "#059669", marginTop: "0.25rem" }}>
                                            Filtered by: {selectedTopic}
                                        </span>
                                    )}
                                </h3>
                                <MarkdownTooltip title={`### Answer Accuracy by Complexity

Shows how accurately you answer questions at different SOLO levels.

**Blue bars:** Your accuracy
**Red bars:** Class average

*Are you answering basic questions more accurately compared to more complex ones, as you should?*`}>
                                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                                </MarkdownTooltip>
                            </div>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem",
                                marginTop: "0.5rem"
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                <h3 style={{ 
                                    marginBottom: "0.5rem",
                                    color: "#555",
                                    margin: 0
                                }}>
                                    Number of Questions per Question Category
                                    {selectedTopic && (
                                        <span style={{ display: "block", fontSize: "0.75rem", color: "#059669", marginTop: "0.25rem" }}>
                                            Filtered by: {selectedTopic}
                                        </span>
                                    )}
                                </h3>
                                <MarkdownTooltip title={`### Question Distribution

Shows how many questions you ask at each complexity level.

**Reflects your critical thinking depth:**
- More unistructural/multistructural questions = more basic factual recall
- More relational and extended abstract questions = analytical and application-based thinking

*Challenge: Ask more higher-level questions*`}>
                                    <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                                </MarkdownTooltip>
                            </div>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem",
                                marginTop: "0.5rem"
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

                        {/* Line Charts */}
                        <section style={{ marginTop: "2rem" }}>
                            <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
                                <div style={{
                        flex: "1 1 450px",
                        maxWidth: "600px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <h2 style={{
                                textAlign: "center",
                                color: "#555",
                                margin: 0
                            }}>
                                Question Grades (GPA) Over Time
                                {selectedTopic && (
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginTop: "0.25rem" }}>
                                        Filtered by: {selectedTopic}
                                    </span>
                                )}
                            </h2>
                            <MarkdownTooltip title={`### Question Quality Trend

Tracks your question complexity over time.

**Blue line:** Your daily average\n
**Red dashed:** Class average

*Is your questioning and reasoning becoming more sophisticated over time in your interactions?*

Tip: Interact daily to prevent gaps in your line chart!`}>
                                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                            </MarkdownTooltip>
                        </div>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <ResponsiveLineChart
                                data={getTimeFilteredChartData(gradesChartData)}
                                height={360}
                                showResetButton={true}
                                yAxisLabel="Grade Points (GPA)"
                            />
                        )}
                        <p style={{
                            fontSize: "0.85rem",
                            color: "#666",
                            textAlign: "center",
                            marginTop: "1rem"
                        }}>
                            Blue line: Your average daily grades | Red dashed: Class average
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
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <h2 style={{
                                textAlign: "center",
                                color: "#555",
                                margin: 0
                            }}>
                                Answer Accuracy Over Time
                                {selectedTopic && (
                                    <span style={{ display: "block", fontSize: "0.8rem", color: "#059669", marginTop: "0.25rem" }}>
                                        Filtered by: {selectedTopic}
                                    </span>
                                )}
                            </h2>
                            <MarkdownTooltip title={`### Understanding Accuracy Trend

Shows how accurately you understand concepts over time.

**Look for:**
- Upward trends = better recall or improving of understanding
- Drops = indicating you need more review time in your topics

*Pair with question quality - high accuracy + complex questions = mastery*

Tip: Interact daily to prevent gaps in your line chart!`}>
                                <IconButton size="small"><InfoOutlinedIcon fontSize="small" /></IconButton>
                            </MarkdownTooltip>
                        </div>
                        {dataLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading chart data...</div>
                        ) : (
                            <ResponsiveLineChart
                                data={getTimeFilteredChartData(accuracyOverTimeChartData)}
                                height={360}
                                showResetButton={true}
                                yAxisLabel="Accuracy (%)"
                            />
                        )}
                        <p style={{
                            fontSize: "0.85rem",
                            color: "#666",
                            textAlign: "center",
                            marginTop: "1rem"
                        }}>
                            Blue line: Your answer accuracy | Red dashed: Class average
                        </p>
                    </div>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}

// Responsive wrapper for LineChart so it spans the parent container
function ResponsiveLineChart({ data, height, yAxisLabel, xAxisLabel }) {
    const [width, setWidth] = useState(800);
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

    return (
        <div style={{ width: '100%' }}>
            <div ref={containerRef} style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                <LineChart 
                    data={data} 
                    width={width} 
                    height={height} 
                    yAxisLabel={yAxisLabel}
                    xAxisLabel={xAxisLabel}
                />
            </div>
        </div>
    );
}