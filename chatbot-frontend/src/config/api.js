// API Configuration
// Dashboard backend (python-backend)
const DASHBOARD_API_URL = import.meta.env.VITE_DASHBOARD_API_URL || 'http://127.0.0.1:5000';

// Chatbot backend (chatbot-backend)
const CHATBOT_API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
    // Chatbot endpoints (chatbot-backend on port 8000)
    chatbotHealth: `${CHATBOT_API_URL}/api/health`,
    chat: `${CHATBOT_API_URL}/api/chat`,
    chatbotConversations: `${CHATBOT_API_URL}/api/conversations`,
    
    // Dashboard endpoints (python-backend on port 5000)
    health: `${DASHBOARD_API_URL}/api/health`,
    dashboardStats: `${DASHBOARD_API_URL}/api/dashboard-stats`,
    users: `${DASHBOARD_API_URL}/api/users`,
    conversations: `${DASHBOARD_API_URL}/api/conversations`,
    topics: `${DASHBOARD_API_URL}/api/topics`,
    questions: `${DASHBOARD_API_URL}/api/questions`,
    recentActivities: `${DASHBOARD_API_URL}/api/recent-activities`,
    generateSummary: `${DASHBOARD_API_URL}/api/generate-summary`,
    individualStatistics: `${DASHBOARD_API_URL}/api/individual-statistics`,
    groupStatistics: `${DASHBOARD_API_URL}/api/group-statistics`,
    topicDependencies: `${DASHBOARD_API_URL}/api/topic-dependencies`,
};

export { CHATBOT_API_URL };
export default DASHBOARD_API_URL;
