import api from "./authenticatedApi";

// This file contains functions for all endpoints corresponding to /dashboard/ in the backend.
// Each function handles an API request and returns the response data or an error message.
// Refer to the backend documentation for more details on each endpoint.

/**
 * Fetches the main statistics for a given student ID.
 *
 * @async
 * @function [dashboard] getMainStats
 * @param {number|string} id - The ID of the student to fetch the main statistics for.
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the main statistics data if successful, or an error message if an error occurs.
 *          - `data`: The main statistics data if the request is successful.
 *          - `error`: An error message if the request fails.
 *
 */
export const getMainStats = async (id) => {
    try {
        const response = await api.get(`/dashboard/main/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

export const getMainKPI = async () => {
    try {
        const response = await api.get(`/dashboard/kpi/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

export const getFeedbackVotes = async (id) => {
    try {
        const response = await api.get(`/dashboard/feedback-vote/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

/**
 * Fetches the student statistics for a given student ID.
 * 
 * @async
 * @function [dashboard] getStudentStats
 * @param {number|string} id - The ID of the student to fetch the student statistics for.
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the student statistics data if successful, or an error message if an error occurs.
 *          - `data`: The student statistics data if the request is successful.
 *          - `error`: An error message if the request fails.
 * 
 */
export const getStudentStats = async (id) => {
    try {
        const response = await api.get(`/dashboard/student/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

/**
 * Fetches the content statistics for a given student ID.
 *
 * @async
 * @function [dashboard] getContentStats
 * @param {number|string} id - The ID of the student to fetch the content statistics for.
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the content statistics data if successful, or an error message if an error occurs.
 *          - `data`: The content statistics data if the request is successful.
 *          - `error`: An error message if the request fails.
 * 
 */
export const getContentStats = async (id) => {
    try {
        const response = await api.get(`/dashboard/content/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

export const getContentTopicType = async (date_range) => {
    try {
        const response = await api.get(`/dashboard/content-topic-type/${date_range}/`);
        if (response.status !== 200) {
            return { data: null, error: "Failed to fetch content topic type data." };
        }else {
            return { data: response.data, error: null };
        }
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

export const getTopic = async (date_range) => {
    try {
        const response = await api.get(`/dashboard/topic/${date_range}/`);
        if (response.status !== 200) {
            return { data: null, error: "Failed to fetch topic data." };
        }else {
            return { data: response.data, error: null };
        }
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

export const getContentTopicSummary = async (id) => {
    try {
        const response = await api.get(`/dashboard/content-topic-summary/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

/**
 * Fetches the conversation statistics for a given student ID.
 *
 * @async
 * @function [dashboard] getConversationStats
 * @param {number|string} id - The ID of the student to fetch the conversation statistics for.
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the conversation statistics data if successful, or an error message if an error occurs.
 *          - `data`: The conversation statistics data if the request is successful.
 *          - `error`: An error message if the request fails.
 * 
 */
export const getConversationStats = async (id) => {
    try {
        const response = await api.get(`/dashboard/conversation/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

/**
 * Fetches the feedback statistics for a given student ID.
 *
 * @async
 * @function [dashboard] getFeedbackStats
 * @param {number|string} id - The ID of the student to fetch the feedback statistics for.
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the feedback statistics data if successful, or an error message if an error occurs.
 *          - `data`: The feedback statistics data if the request is successful.
 *          - `error`: An error message if the request fails.
 * 
 */
export const getFeedbackStats = async (id) => {
    try {
        const response = await api.get(`/dashboard/feedback/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};

/**
 * Fetches the conversation trend data for a given date range.
 * * @async
 * @function [dashboard] getConversationsTrend
 * @param {string} date_range - The date range to fetch the conversation trend data for (e.g., '7d', '30d').
 * @returns {Promise<{data: Object|null, error: string|null}>} A promise that resolves to an object containing
 *          the conversation trend data if successful, or an error message if an error occurs.
 *          - `data`: The conversation trend data if the request is successful.
 *          - `error`: An error message if the request fails.
 *
 */
export const getConversationsTrend = async (date_range) => {
    try {
        const response = await api.get(`/dashboard/conversation-trend/${date_range}/`);
        if (response.status !== 200) {
            return { data: null, error: "Failed to fetch conversation trend data." };
        }else {
            return { data: response.data, error: null };
        }
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
}

export const getFeedbackSummary = async (id) => {
    try {
        const response = await api.get(`/dashboard/feedback-summary/${id}/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};


export const getSample = async () => {
    try {
        const response = await api.get(`/dashboard/sample/`);
        return { data: response.data, error: null };
    } catch (error) {
        let errorMessage = "An error occurred. Please try again later.";
        if (error.response) {
            errorMessage = error.response.data?.message || errorMessage;
        } else if (error.request) {
            errorMessage = "Server not responding. Please try again later.";
        }
        return { data: null, error: errorMessage };
    }
};