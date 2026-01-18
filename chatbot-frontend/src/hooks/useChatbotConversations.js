// frontend/src/hooks/useChatbotConversations.js
import { useState, useEffect } from "react";
import { DEFAULT_FIRST_MESSAGE } from "../data/defaultMessages";
import { API_ENDPOINTS } from "../config/api"; 

export default function useChatbotConversations() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [userId] = useState(1); // Can be made dynamic later

    // Fetch conversations from backend on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.chatbotConversations}?user_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const formattedConversations = data.map(conv => ({
                    id: conv.id,
                    title: conv.title,
                    lastAccessed: new Date(conv.last_accessed),
                    messages: [] // Messages loaded on demand
                }));
                setConversations(formattedConversations);
                
                // If no active conversation and conversations exist, set the first one
                if (!activeConversationId && formattedConversations.length > 0) {
                    const firstConv = formattedConversations[0];
                    setActiveConversationId(firstConv.id);
                    await loadConversationMessages(firstConv.id);
                }
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const loadConversationMessages = async (conversationId) => {
        try {
            const response = await fetch(`${API_ENDPOINTS.chatbotConversations}/${conversationId}/messages`);
            if (response.ok) {
                const data = await response.json();
                const formattedMessages = data.map(msg => ({
                    from: msg.sender,
                    text: msg.content,
                    timestamp: new Date(msg.timestamp)
                }));
                
                // If no messages, add welcome message
                if (formattedMessages.length === 0) {
                    formattedMessages.push({ from: "bot", text: DEFAULT_FIRST_MESSAGE });
                }
                
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([{ from: "bot", text: DEFAULT_FIRST_MESSAGE }]);
        }
    };

    // Create new conversation
    const handleAddConversation = () => {
        // Start with no active conversation - it will be created on first message
        setActiveConversationId(null);
        setMessages([{ from: "bot", text: DEFAULT_FIRST_MESSAGE }]);
    };

    // Initial Setup - create first conversation if none exist
    useEffect(() => {
        if (conversations.length === 0 && !activeConversationId) {
            handleAddConversation();
        }
    }, [conversations.length, activeConversationId]);

    // --- UPDATED SEND LOGIC ---
    const handleSend = async () => {
        if (!input.trim()) return;

        // 1. Optimistically add user message
        const userMsg = { from: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // 2. Call the Backend
            const response = await fetch(API_ENDPOINTS.chat, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: userMsg.text,
                    conversation_id: activeConversationId,
                    user_id: userId
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 3. Update conversation ID if it was created by backend
            if (data.conversation_id && data.conversation_id !== activeConversationId) {
                const newConvId = parseInt(data.conversation_id);
                setActiveConversationId(newConvId);
                
                // Refetch conversations to get the new one from backend
                await fetchConversations();
            }

            // 4. Process Response
            const botMsg = { 
                from: "bot", 
                text: data.response || "Sorry, I encountered an error.",
                evaluationType: data.evaluation_type,
                questionId: data.question_id,
                metadata: data.metadata
            };

            setMessages((prev) => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, { 
                from: "bot", 
                text: "⚠️ **Network Error**: Could not connect to the chatbot backend. Please ensure the backend server is running on port 8000." 
            }]);
        } finally {
            setIsTyping(false);
        }
    };
    // ---------------------------

    const handleConversationClick = async (id) => {
        const conv = conversations.find((c) => c.id === id);
        if (!conv) return;
        setActiveConversationId(id);
        
        // Load messages from backend
        await loadConversationMessages(id);
    };

    return {
        sidebarOpen, setSidebarOpen, activeConversationId, conversations,
        messages, input, isTyping, handleSend, handleConversationClick,
        handleAddConversation, setInput,
    };
}