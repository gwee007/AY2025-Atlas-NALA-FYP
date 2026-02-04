// API Configuration
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export const API_ENDPOINTS = {
  // Chatbot endpoints
  chat: `${API_URL}/api/chat`,
  verifyUser: (userId) => `${API_URL}/api/verify-user/${userId}`,

  // Shared / Dashboard endpoints
  health: `${API_URL}/api/health`,
  dashboardStats: `${API_URL}/api/dashboard-stats`,
  users: `${API_URL}/api/users`,
  conversations: `${API_URL}/api/conversations`,
  topics: `${API_URL}/api/topics`,
  questions: `${API_URL}/api/questions`,
  recentActivities: `${API_URL}/api/recent-activities`,
  generateSummary: `${API_URL}/api/generate-summary`,
  individualStatistics: `${API_URL}/api/individual-statistics`,
  groupStatistics: `${API_URL}/api/group-statistics`,
  topicDependencies: `${API_URL}/api/topic-dependencies`,
  invalidateCache: (userId) => `${API_URL}/api/cache/invalidate/${userId}`,
};

export { API_URL as CHATBOT_API_URL };
export default API_URL;
