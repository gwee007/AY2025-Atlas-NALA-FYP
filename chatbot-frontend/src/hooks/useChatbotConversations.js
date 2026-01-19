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
    const [userId] = useState(1);
    const [_localMessageIds, setLocalMessageIds] = useState(new Set()); // Track optimistically added messages

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
                    id: msg.id, // Include backend message ID
                    from: msg.sender,
                    text: msg.content,
                    timestamp: new Date(msg.timestamp)
                }));
                
                // If no messages, add welcome message
                if (formattedMessages.length === 0) {
                    formattedMessages.push({ 
                        id: `welcome-${Date.now()}`, 
                        from: "bot", 
                        text: DEFAULT_FIRST_MESSAGE 
                    });
                }
                
                setMessages(formattedMessages);
                setLocalMessageIds(new Set()); // Reset local message tracking
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([{ 
                id: `welcome-${Date.now()}`, 
                from: "bot", 
                text: DEFAULT_FIRST_MESSAGE 
            }]);
        }
    };

    // Create new conversation
    const handleAddConversation = () => {
        // Start with no active conversation - it will be created on first message
        setActiveConversationId(null);
        setMessages([{ 
            id: `welcome-${Date.now()}`, 
            from: "bot", 
            text: DEFAULT_FIRST_MESSAGE 
        }]);
        setLocalMessageIds(new Set());
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

        // 1. Create unique local ID for optimistic update
        const localMessageId = `local-user-${Date.now()}`;
        const userMsg = { 
            id: localMessageId, 
            from: "user", 
            text: input 
        };
        
        // Track this as a local message
        setLocalMessageIds(prev => new Set(prev).add(localMessageId));
        
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
                id: `bot-${data.chatbot_message_id || Date.now()}`,
                from: "bot", 
                text: data.response || "Sorry, I encountered an error.",
                evaluationType: data.evaluation_type,
                questionId: data.question_id,
                metadata: data.metadata
            };

            // Replace local user message with backend version and add bot response
            setMessages((prev) => {
                const updated = prev.map(msg => 
                    msg.id === localMessageId 
                        ? { ...msg, id: `user-${data.user_message_id || Date.now()}` }
                        : msg
                );
                return [...updated, botMsg];
            });

            // Clear local message tracking
            setLocalMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(localMessageId);
                return newSet;
            });

        } catch (error) {
            console.error("Chat Error:", error);
            
            const errorMsg = { 
                id: `bot-error-${Date.now()}`,
                from: "bot", 
                text: "⚠️ **Network Error**: Could not connect to the chatbot backend. Please ensure the backend server is running on port 8000." 
            };
            
            setMessages((prev) => [...prev, errorMsg]);
            setLocalMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(localMessageId);
                return newSet;
            });
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