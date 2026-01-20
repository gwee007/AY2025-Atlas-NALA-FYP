const API_BASE_URL = 'http://localhost:5000/api'

export const fetchDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

export const fetchUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const fetchConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
};

export const fetchRecentActivities = async () => {
    const response = await fetch(`${API_BASE_URL}/recent-activities`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
};