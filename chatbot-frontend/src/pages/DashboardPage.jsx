import React, { useState, useEffect, useRef } from 'react';
import LineChart from '../components/charts/LineChart';
import ReflectiveBarChart from '../components/charts/ReflectiveBarChart';
import VerticalBarChart from '../components/charts/VerticalBarChart';
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

    return (
        <div style={{ padding: "3rem", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ padding: "1.2rem", fontSize: "0.7rem", width: "100%", display: "flex", justifyContent: "center" }}>
                <h1 >NALA-Assess Dashboard</h1>
            </div>

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
                <h2 style={{ 
                    textAlign: "center", 
                    marginBottom: "2rem",
                    color: "#333"
                }}>
                    Detailed Subject Performance
                </h2>
                
                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* Scrollable Subject Performance Chart */}
                    
                    <div style={{
                        flex: "2",
                        minWidth: "700px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
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
                            justifyContent: "center", 
                            alignItems: "center", 
                            gap: "1rem", 
                            marginBottom: "1.5rem" 
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
                                Click on any bar to view study advice
                            </p>
                        </div>
                        
                        <div style={{
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
                                    ...topicalPerformanceData,
                                    title: "", // Remove title
                                    leftLabel: "", // Remove left label
                                    rightLabel: "" // Remove right label
                                }} 
                                height={Math.max(400, topicalPerformanceData.categories.length * 35)}
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
                                Showing {topicalPerformanceData.categories.length} subjects total
                            </p>
                        </div>
                    </div>

                    {/* Additional Analytics Placeholder */}
                    <div style={{
                        flex: "1",
                        minWidth: "400px",
                        backgroundColor: "#f0f4f8",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "500px"
                    }}>
                            
                        <h2 style={{ 
                            textAlign: "center", 
                            marginBottom: "-0.5rem",
                            color: "#555"
                        }}>
                            Topic dependencies
                        </h2>
                        <p style={{ 
                                fontSize: "1rem", 
                                color: "#64748b", 
                                marginBottom: "1rem" 
                            }}>
                                Explore fundamentals that build the foundation for advanced topics
                            </p>
                        <div style={{
                            backgroundColor: "#e2e8f0",
                            padding: "2rem",
                            borderRadius: "8px",
                            textAlign: "center",
                            width: "100%"
                        }}>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "1rem",
                                marginTop: "2rem"
                            }}>
                                <div>
                                    <h2>
                                        Selected topic
                                    </h2>
                                   <div style={{
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                }}>
                                    
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>
                                        {selectedTopic || "Select a topic"}
                                    </div>
                                <div
                                    style={{
                                        display:"grid",
                                        gridTemplateColumns: "1fr 1fr"
                                    }}>
                                        <div style={{
                                    backgroundColor: "#bcffde",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    textAlign: "left"
                                }}>
                                     <div style={{ fontSize: "0.8rem", color: "#666", marginBottom:"-0.3rem" }}>Your Grade</div>
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>A-</div>
                                    <div style={{ fontSize: "0.8rem",color: "black",fontWeight:"bold" }}>Average: B+</div>
                                </div>
                                    <div style={{
                                    gap: "0.5rem",
                                    display: "grid",
                                    gridTemplateColumns: "1fr"
                                    }}>
                                        <Button variant="contained">
                                            <div style={{fontWeight:"bold" ,fontSize: "0.7rem", width:"full"}}>Test Me</div>
                                        </Button>
                                        <Button variant="contained" >
                                            <div style={{fontWeight:"bold",fontSize: "0.7rem"}}>Chat History</div>
                                        </Button>
                                    </div>
                                </div>
                                
                                </div> 
                                </div>
                                <div>
                                    <h2>
                                        Prerequisite topics
                                    </h2>
                                       <div style={{
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                }}>
                                    
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>Subtopic 0</div>
                                <div
                                    style={{
                                        display:"grid",
                                        gridTemplateColumns: "1fr 1fr"
                                    }}>
                                        <div style={{
                                    backgroundColor: "#bcffde",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    textAlign: "left"
                                }}>
                                     <div style={{ fontSize: "0.8rem", color: "#666", marginBottom:"-0.3rem" }}>Your Grade</div>
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>A-</div>
                                    <div style={{ fontSize: "0.8rem",color: "black",fontWeight:"bold" }}>Average: B+</div>
                                </div>
                                    <div style={{
                                    gap: "0.5rem",
                                    display: "grid",
                                    gridTemplateColumns: "1fr"
                                    }}>
                                        <Button variant="contained">
                                            <div style={{fontWeight:"bold" ,fontSize: "0.7rem", width:"full"}}>Test Me</div>
                                        </Button>
                                        <Button variant="contained" >
                                            <div style={{fontWeight:"bold",fontSize: "0.7rem"}}>Chat History</div>
                                        </Button>
                                        <Button variant="contained" >
                                            <div style={{fontWeight:"bold",fontSize: "0.7rem"}}>Select topic</div>
                                        </Button>
                                    </div>
                          
                                
                                </div>
                                
                                </div> 
                                <div style={{
                                    backgroundColor: "white",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                }}>
                                    
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>Subtopic 1</div>
                                <div
                                    style={{
                                        display:"grid",
                                        gridTemplateColumns: "1fr 1fr"
                                    }}>
                                        <div style={{
                                    backgroundColor: "#bcffde",
                                    padding: "1rem",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                    textAlign: "left"
                                }}>
                                     <div style={{ fontSize: "0.8rem", color: "#666", marginBottom:"-0.3rem" }}>Your Grade</div>
                                    <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>A-</div>
                                    <div style={{ fontSize: "0.8rem",color: "black",fontWeight:"bold" }}>Average: B+</div>
                                </div>
                                    <div style={{
                                    gap: "0.5rem",
                                    display: "grid",
                                    gridTemplateColumns: "1fr"
                                    }}>
                                        <Button variant="contained">
                                            <div style={{fontWeight:"bold" ,fontSize: "0.7rem", width:"full"}}>Test Me</div>
                                        </Button>
                                        <Button variant="contained" >
                                            <div style={{fontWeight:"bold",fontSize: "0.7rem"}}>Chat History</div>
                                        </Button>
                                        <Button variant="contained" >
                                            <div style={{fontWeight:"bold",fontSize: "0.7rem"}}>Select topic</div>
                                        </Button>
                                    </div>
                          
                                
                                </div>
                                
                                </div> 
                                </div>
                        </div>
                    </div>
                </div>
                </div>
            </section>

            <section style={{
                display: "grid",
                width: "100%",
                marginTop: "2rem",
                marginBottom: "2rem",
            }}>
                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* First chart card */}
                    <div style={{
                        flex: "1 1 520px",
                        width: "100%",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{
                            textAlign: "center",
                            marginBottom: "0.2rem",
                            color: "#555"
                        }}>
                            Daily Interaction Trends Over Time
                        </h2>
                        <h4 style={{
                            textAlign: "center",
                            marginBottom: "1rem",
                            color: "#555"
                        }}>
                            Filter by topic below
                        </h4>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", borderRadius: "1rem" }}>
                            <select style={{ textAlign: "center", padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}>
                                <option value="">--All topics--</option>
                                <option value="programming">Programming</option>
                                <option value="web_design">Web Design</option>
                                <option value="databases">Databases</option>
                                <option value="networking">Networking</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", width: "100%", justifyContent: "center" }}>
                            <ResponsiveLineChart
                                data={interactionChartData}
                                height={360}
                            />
                        </div>
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
                        flex: "1 1 520px",
                        minWidth: "520px",
                        backgroundColor: "#f9f9f9",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                        <h2 style={{
                            textAlign: "center",
                            marginBottom: "0.2rem",
                            color: "#555"
                        }}>
                            Duration of conversation over time
                        </h2>
                        <h4 style={{
                            textAlign: "center",
                            marginBottom: "1rem",
                            color: "#555"
                        }}>
                                                        Filter by topic below
                        </h4>
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem", borderRadius: "1rem" }}>
                            <select style={{ textAlign: "center", padding: "0.4rem", borderRadius: "6px", border: "1px solid #ccc" }}>
                                <option value="">--All topics--</option>
                                <option value="programming">Programming</option>
                                <option value="web_design">Web Design</option>
                                <option value="databases">Databases</option>
                                <option value="networking">Networking</option>
                            </select>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <ResponsiveLineChart
                                data={interactionChartData}
                                height={360}
                            />
                        </div>
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
                <h2 style={{ 
                    textAlign: "center", 
                    marginBottom: "2rem",
                    color: "#333"
                }}>
                    Taxonomy Performance Overview
                </h2>
                
                <div style={{
                    display: "flex",
                    gap: "2rem",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "flex-start"
                }}>
                    {/* SOLO Taxonomy Vertical Bar Chart */}
                    <div style={{
                        flex: "1",
                        minWidth: "600px",
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
                                Question categories based on SOLO Taxonomy
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                Based on reverse assessment
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                                <select style={{ 
                                    textAlign: "center", 
                                    padding: "0.4rem", 
                                    borderRadius: "6px", 
                                    border: "1px solid #ccc",
                                    fontSize: "14px"
                                }}>
                                    <option value="">--All topics--</option>
                                    <option value="programming">Programming</option>
                                    <option value="web_design">Web Design</option>
                                    <option value="databases">Databases</option>
                                    <option value="networking">Networking</option>
                                </select>
                            </div>
                        </div>
                        <VerticalBarChart 
                            data={soloVerticalChartData} 
                            width={600} 
                            height={400} 
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

                    {/* Answer accuracy Vertical Bar Chart */}
                    <div style={{
                        flex: "1",
                        minWidth: "600px",
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
                                Answer accuracy per question category
                            </h3>
                            <p style={{ 
                                fontSize: "0.8rem", 
                                color: "#666",
                                marginBottom: "1rem"
                            }}>
                                Based on reverse assessment
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                                <select style={{ 
                                    textAlign: "center", 
                                    padding: "0.4rem", 
                                    borderRadius: "6px", 
                                    border: "1px solid #ccc",
                                    fontSize: "14px"
                                }}>
                                    <option value="">--All topics--</option>
                                    <option value="programming">Programming</option>
                                    <option value="web_design">Web Design</option>
                                    <option value="databases">Databases</option>
                                    <option value="networking">Networking</option>
                                </select>
                            </div>
                        </div>
                        <VerticalBarChart 
                            data={bloomsVerticalChartData} 
                            width={600} 
                            height={400} 
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
                </div>
            </section>
        </div>
    );
}

// Responsive wrapper for LineChart so it spans the parent container
function ResponsiveLineChart({ data, height }) {
    const [width, setWidth] = useState(800);
    const containerRef = useRef(null);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                // Use full container width with sensible min/max bounds
                const newWidth = Math.max(300, Math.min(1600, containerWidth));
                setWidth(newWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%' }}>
            <LineChart data={data} width={width} height={height} />
        </div>
    );
}