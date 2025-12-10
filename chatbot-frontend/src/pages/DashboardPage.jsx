import React, { useState, useEffect, useRef } from 'react';
import LineChart from '../components/charts/LineChart';
import ReflectiveBarChart from '../components/charts/ReflectiveBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
import TopicGraph from '../components/charts/TopicGraph';
import { Button } from '@mui/material';

// NOT THE ACTUAL DASHBOARD, JUST A PLACEHOLDER
// okay got it 
const stats = [
    { label: "Active Users", value: 1245 },
    { label: "New Signups", value: 87 },
    { label: "Messages Sent", value: 3421 },
    { label: "System Uptime", value: "99.98%" },
];

const recentActivities = [
    { time: "10:05 AM", activity: "User JohnDoe signed in" },
    { time: "09:50 AM", activity: "New message received" },
    { time: "09:30 AM", activity: "User JaneSmith registered" },
    { time: "09:10 AM", activity: "System backup completed" },
];

// MOCK DATA for LineChart - Replace with real API data
const interactionChartData = {
    individual: [
        { date: new Date('2024-10-01'), interactions: 15 },
        { date: new Date('2024-10-02'), interactions: 23 },
        { date: new Date('2024-10-03'), interactions: 18 },
        { date: new Date('2024-10-04'), interactions: 31 },
        { date: new Date('2024-10-05'), interactions: 12 },
        { date: new Date('2024-10-06'), interactions: 28 },
        { date: new Date('2024-10-07'), interactions: 35 },
        { date: new Date('2024-10-08'), interactions: 22 },
        { date: new Date('2024-10-09'), interactions: 19 },
        { date: new Date('2024-10-10'), interactions: 27 },
    ],
    average: [
        { date: new Date('2024-10-01'), interactions: 20 },
        { date: new Date('2024-10-02'), interactions: 22 },
        { date: new Date('2024-10-03'), interactions: 21 },
        { date: new Date('2024-10-04'), interactions: 24 },
        { date: new Date('2024-10-05'), interactions: 18 },
        { date: new Date('2024-10-06'), interactions: 25 },
        { date: new Date('2024-10-07'), interactions: 26 },
        { date: new Date('2024-10-08'), interactions: 23 },
        { date: new Date('2024-10-09'), interactions: 21 },
        { date: new Date('2024-10-10'), interactions: 24 },
    ]
};

// MOCK DATA for SpiderChart - Replace with real assessment data
const bloomsTaxonomyData = {
    categories: [
        { name: 'Remembering', individual: 30, average: 78 },
        { name: 'Understanding', individual: 78, average: 82 },
        { name: 'Applying', individual: 92, average: 75 },
        { name: 'Analyzing', individual: 88, average: 80 },
        { name: 'Evaluating', individual: 76, average: 85 },
        { name: 'Creating', individual: 82, average: 70 }
    ]
};

// MOCK DATA for SOLO Taxonomy Vertical Bar Chart
const soloVerticalChartData = {
    categories: ['Prestructural', 'Unistructural', 'Multistructural', 'Relational', 'Extended Abstract'],
    individualData: [
        { category: 'Prestructural', value: 12 },
        { category: 'Unistructural', value: 35 },
        { category: 'Multistructural', value: 78 },
        { category: 'Relational', value: 92 },
        { category: 'Extended Abstract', value: 67 }
    ],
    averageData: [
        { category: 'Prestructural', value: 18 },
        { category: 'Unistructural', value: 42 },
        { category: 'Multistructural', value: 71 },
        { category: 'Relational', value: 85 },
        { category: 'Extended Abstract', value: 59 }
    ],
    title: 'SOLO Taxonomy Performance'
};

// MOCK DATA for Bloom's Taxonomy Vertical Bar Chart
const bloomsVerticalChartData = {
    categories: ['Prestructural', 'Unistructural', 'Multistructural', 'Relational', 'Extended Abstract'],
    individualData: [
        { category: 'Prestructural', value: 21 },
        { category: 'Unistructural', value: 47 },
        { category: 'Multistructural', value: 63 },
        { category: 'Relational', value: 88 },
        { category: 'Extended Abstract', value: 72 }
    ],
    averageData: [
        { category: 'Prestructural', value: 19 },
        { category: 'Unistructural', value: 41 },
        { category: 'Multistructural', value: 69 },
        { category: 'Relational', value: 84 },
        { category: 'Extended Abstract', value: 66 }
    ],
    title: "Bloom's Taxonomy Performance"
};

// MOCK DATA for Number of Questions per Category
const questionCountChartData = {
    categories: ['Prestructural', 'Unistructural', 'Multistructural', 'Relational', 'Extended Abstract'],
    individualData: [
        { category: 'Prestructural', value: 5 },
        { category: 'Unistructural', value: 12 },
        { category: 'Multistructural', value: 28 },
        { category: 'Relational', value: 35 },
        { category: 'Extended Abstract', value: 20 }
    ],
    averageData: [
        { category: 'Prestructural', value: 8 },
        { category: 'Unistructural', value: 15 },
        { category: 'Multistructural', value: 25 },
        { category: 'Relational', value: 30 },
        { category: 'Extended Abstract', value: 22 }
    ],
    title: 'Number of Questions per Question Category'
};

// MOCK DATA for Topical Performance with Scrollable List
const topicalPerformanceData = {
    categories: [
        'Mathematics', 'Science', 'Literature', 'History', 'Philosophy', 'Economics',
        'Computer Science', 'Psychology', 'Sociology', 'Political Science', 'Art History',
        'Biology', 'Chemistry', 'Physics', 'Statistics', 'Foreign Languages', 'Music Theory',
        'Engineering', 'Business Ethics', 'Environmental Science', 'Anthropology', 'Geography'
    ],
    leftData: [
        { category: 'Mathematics', value: 88 },
        { category: 'Science', value: 76 },
        { category: 'Literature', value: 94 },
        { category: 'History', value: 82 },
        { category: 'Philosophy', value: 91 },
        { category: 'Economics', value: 73 },
        { category: 'Computer Science', value: 95 },
        { category: 'Psychology', value: 87 },
        { category: 'Sociology', value: 79 },
        { category: 'Political Science', value: 84 },
        { category: 'Art History', value: 92 },
        { category: 'Biology', value: 89 },
        { category: 'Chemistry', value: 77 },
        { category: 'Physics', value: 85 },
        { category: 'Statistics', value: 90 },
        { category: 'Foreign Languages', value: 83 },
        { category: 'Music Theory', value: 86 },
        { category: 'Engineering', value: 93 },
        { category: 'Business Ethics', value: 75 },
        { category: 'Environmental Science', value: 88 },
        { category: 'Anthropology', value: 81 },
        { category: 'Geography', value: 78 }
    ],
    rightData: [
        { category: 'Mathematics', value: 79 },
        { category: 'Science', value: 85 },
        { category: 'Literature', value: 81 },
        { category: 'History', value: 88 },
        { category: 'Philosophy', value: 74 },
        { category: 'Economics', value: 86 },
        { category: 'Computer Science', value: 87 },
        { category: 'Psychology', value: 82 },
        { category: 'Sociology', value: 84 },
        { category: 'Political Science', value: 80 },
        { category: 'Art History', value: 76 },
        { category: 'Biology', value: 83 },
        { category: 'Chemistry', value: 85 },
        { category: 'Physics', value: 89 },
        { category: 'Statistics', value: 78 },
        { category: 'Foreign Languages', value: 87 },
        { category: 'Music Theory', value: 79 },
        { category: 'Engineering', value: 91 },
        { category: 'Business Ethics', value: 82 },
        { category: 'Environmental Science', value: 84 },
        { category: 'Anthropology', value: 86 },
        { category: 'Geography', value: 88 }
    ],
    leftLabel: 'Your Performance',
    rightLabel: 'Class Average',
    title: 'Subject Performance Comparison'
};

// Alternative comparison data for skill mastery
const skillMasteryData = {
    categories: ['Problem Solving', 'Critical Thinking', 'Communication', 'Collaboration', 'Research Skills'],
    leftData: [
        { category: 'Problem Solving', value: 92 },
        { category: 'Critical Thinking', value: 87 },
        { category: 'Communication', value: 78 },
        { category: 'Collaboration', value: 85 },
        { category: 'Research Skills', value: 90 }
    ],
    rightData: [
        { category: 'Problem Solving', value: 84 },
        { category: 'Critical Thinking', value: 80 },
        { category: 'Communication', value: 89 },
        { category: 'Collaboration', value: 82 },
        { category: 'Research Skills', value: 77 }
    ],
    leftLabel: 'Current Semester',
    rightLabel: 'Previous Semester',
    title: 'Skill Development Over Time'
};

const overallEstimatedQuestionQuality = "B+";
const overallEstimatedAnswerAccuracy = "A-"; //maybe include dynamic colour gra
const conversationSessions = 12;
const topicsDiscussed = 5;
const minutesSpent = 47;
const averageAnswerAccuracy = "A";
const averageEstimatedQuestionQuality = "B+";

// MOCK DATA for Chat History - Replace with real API data
const chatHistoryData = [
    { id: 1, question: "What is the difference between inheritance and composition?", grade: "A", timestamp: "2024-10-10 14:30" },
    { id: 2, question: "Explain polymorphism in OOP", grade: "B+", timestamp: "2024-10-09 11:15" },
    { id: 3, question: "How does encapsulation work?", grade: "A-", timestamp: "2024-10-08 16:45" },
    { id: 4, question: "What are design patterns?", grade: "B", timestamp: "2024-10-07 10:20" },
    { id: 5, question: "Describe SOLID principles", grade: "A", timestamp: "2024-10-06 13:00" }
];

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
    const [searchTerm, setSearchTerm] = useState('');
    // LLM-generated summary - can be updated dynamically from API
    const [llmSummary, setLlmSummary] = useState({
        strongTopics: "Computer Science, Engineering, Mathematics - You're performing exceptionally well in these areas with consistent A- to A grades.",
        needsHelp: "Literature, History, Philosophy - These topics show performance below class average. Consider scheduling additional study sessions or seeking tutoring.",
        overallComparison: "You're in the top 25% of your class with an overall grade of A-. Your engagement and interaction rates are 15% higher than the class average."
    });

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
                marginBottom: "2rem",
                padding: "1.5rem",
                backgroundColor: "#f0f7ff",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #2563eb"
            }}>
                <h2 style={{ 
                    marginTop: 0, 
                    marginBottom: "1.5rem",
                    color: "#1e40af",
                    fontSize: "1.3rem"
                }}>
                    Learning Progress Summary
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <h3 style={{ 
                            fontSize: "1rem", 
                            fontWeight: "bold", 
                            color: "#0c4a6e",
                            marginTop: 0,
                            marginBottom: "0.5rem"
                        }}>
                            Strong areas:
                        </h3>
                        <p style={{
                            fontSize: "0.95rem",
                            lineHeight: "1.6",
                            color: "#1e3a8a",
                            margin: 0,
                            paddingLeft: "1rem"
                        }}>
                            {llmSummary.strongTopics}
                        </p>
                    </div>
                    <div>
                        <h3 style={{ 
                            fontSize: "1rem", 
                            fontWeight: "bold", 
                            color: "#0c4a6e",
                            marginTop: 0,
                            marginBottom: "0.5rem"
                        }}>
                            Areas of improvement:
                        </h3>
                        <p style={{
                            fontSize: "0.95rem",
                            lineHeight: "1.6",
                            color: "#1e3a8a",
                            margin: 0,
                            paddingLeft: "1rem"
                        }}>
                            {llmSummary.needsHelp}
                        </p>
                    </div>
                    <div>
                        <h3 style={{ 
                            fontSize: "1rem", 
                            fontWeight: "bold", 
                            color: "#0c4a6e",
                            marginTop: 0,
                            marginBottom: "0.5rem"
                        }}>
                            Peer comparison:
                        </h3>
                        <p style={{
                            fontSize: "0.95rem",
                            lineHeight: "1.6",
                            color: "#1e3a8a",
                            margin: 0,
                            paddingLeft: "1rem"
                        }}>
                            {llmSummary.overallComparison}
                        </p>
                    </div>
                </div>
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
               
                <div
                    style={{
                        background: "#f5f6fa",
                        gap: "1rem",
                        padding: "1rem",
                        borderRadius: "20px",
                        minWidth: "160px",
                        boxShadow: "0 2px 8px #e1e1e1",
                    }}
                >   
                    <div style={{ color: "#888", fontWeight:"bold", fontSize: "small", textAlign: "left" }}>
                        Overall Estimated Question Quality
                    </div>
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#333", textAlign: "center" }}>
                        {overallEstimatedQuestionQuality}
                    </div>
                    <div style={{ color: "#888", fontWeight:"bold", fontSize: "medium", textAlign: "right" }}>
                        Average: {averageEstimatedQuestionQuality}
                    </div>
                </div>
                <div
                    style={{
                        background: "#f5f6fa",
                        padding: "1rem",
                        borderRadius: "20px",
                        minWidth: "160px",
                        boxShadow: "0 2px 8px #e1e1e1",
                    }}
                >   
                    <div style={{ color: "#888", fontWeight:"bold", fontSize: "small", textAlign: "left" }}>
                        Overall Estimated Answer Accuracy
                    </div>
                    <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#333", textAlign: "center" }}>
                        {overallEstimatedAnswerAccuracy}
                    </div>
                    <div style={{ color: "#888", fontWeight:"bold", fontSize: "medium", textAlign: "right" }}>
                        Average: {averageAnswerAccuracy}
                    </div>
                </div>
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
                            <ResponsiveReflectiveBarChart 
                                data={{
                                    ...filteredTopicalPerformanceData,
                                    title: "", // Remove title
                                    leftLabel: "", // Remove left label
                                    rightLabel: "" // Remove right label
                                }} 
                                height={Math.max(400, filteredTopicalPerformanceData.categories.length * 35)}
                                onCategoryClick={(category) => setSelectedTopic(category)}
                                selectedCategory={selectedTopic}
                            />
                        </div>
                        
                        <div style={{
                            marginTop: "1rem",
                            textAlign: "center",
                            fontSize: "0.8rem",
                            color: "#666"
                        }}>
                            <p style={{ margin: "0.5rem 0" }}>
                                Blue bars: Your Performance | Red bars: Class Average
                            </p>
                            <p style={{ margin: "0.5rem 0" }}>
                                Showing {filteredTopicalPerformanceData.categories.length} of {topicalPerformanceData.categories.length} subjects
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
                                <h3 style={{ 
                                    color: "#555",
                                    margin: 0,
                                    fontSize: "1.1rem"
                                }}>
                                    Topic Dependencies: {selectedTopic || "Select a topic"}
                                </h3>
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
                                alignItems: "center",
                                justifyContent: "center"
                            }}>
                                {selectedTopic ? (
                                    <TopicGraph 
                                        selectedTopic={selectedTopic}
                                        onTopicSelect={setSelectedTopic}
                                        width={700}
                                        height={280}
                                    />
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
                                flex: "1",
                                minHeight: "0",
                                display: "flex",
                                flexDirection: "column"
                            }}>
                                <h3 style={{ 
                                    color: "#555",
                                    marginBottom: "0.75rem",
                                    fontSize: "1rem"
                                }}>
                                    Recent Conversations
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
                                            {chatHistoryData.map((chat, index) => (
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
                                            ))}
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
                        Topic: {selectedTopic || "All"}
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
                        </h2>
                        <ResponsiveLineChart
                            data={interactionChartData}
                            height={360}
                            showResetButton={true}
                        />
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
                        </h2>
                        <ResponsiveLineChart
                            data={interactionChartData}
                            height={360}
                            showResetButton={true}
                            yAxisLabel="Duration (minutes)"
                        />
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
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                Based on SOLO taxonomy levels
                            </p>
                        </div>
                        <VerticalBarChart 
                            data={bloomsVerticalChartData} 
                            width={600} 
                            height={400}
                            xAxisLabel=""
                            yAxisLabel="Accuracy (%)" 
                        />
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
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                 Based on SOLO taxonomy levels
                            </p>
                        </div>
                        <VerticalBarChart 
                            data={questionCountChartData} 
                            width={600} 
                            height={400}
                            xAxisLabel=""
                            yAxisLabel="Number of Questions" 
                        />
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