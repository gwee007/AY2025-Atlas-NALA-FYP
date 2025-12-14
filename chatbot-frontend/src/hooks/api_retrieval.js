const API_BASE_URL = 'http://localhost:5000/api'

export const fetchDashboardStats = async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    else console.log('dashboard stats fetching');
    return response.json();
};

export const fetchUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    else console.log('user data fetching');
    return response.json();
};

export const fetchConversations = async () => {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    else console.log('conversations stats fetching');
    return response.json();
};

export const fetchRecentActivities = async () => {
    const response = await fetch(`${API_BASE_URL}/recent-activities`);
    if (!response.ok) throw new Error('Failed to fetch activities');
    else console.log('fetching recent activities');
    return response.json();
};