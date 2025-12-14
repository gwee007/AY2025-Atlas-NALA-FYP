// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export const API_ENDPOINTS = {
    // Send help please
    health: `${API_BASE_URL}/api/health`,
    dashboardStats: `${API_BASE_URL}/api/dashboard-stats`,
    users: `${API_BASE_URL}/api/users`,
    conversations: `${API_BASE_URL}/api/conversations`,
    topics: `${API_BASE_URL}/api/topics`,
    questions: `${API_BASE_URL}/api/questions`,
    recentActivities: `${API_BASE_URL}/api/recent-activities`,
    generateSummary: `${API_BASE_URL}/api/generate-summary`,
    individualStatistics: `${API_BASE_URL}/api/individual-statistics`,
    groupStatistics: `${API_BASE_URL}/api/group-statistics`,
    topicDependencies: `${API_BASE_URL}/api/topic-dependencies`,
};

export default API_BASE_URL;
