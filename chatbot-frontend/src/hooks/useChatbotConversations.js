// frontend/src/hooks/useChatbotConversations.js
import { useState, useEffect, useRef } from "react";
import { DEFAULT_FIRST_MESSAGE } from "../data/defaultMessages";
import { API_ENDPOINTS } from "../config/api";

export default function useChatbotConversations() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const userId = "2"; // Default userId
    const [_localMessageIds, setLocalMessageIds] = useState(new Set()); // Track optimistically added messages
    const isLoadingConversation = useRef(false); // Track if conversation is being loaded
    const loadedMessageIds = useRef(new Set()); // Track all message IDs to prevent duplicates
    
    // Track if user is in chatbot and if they've asked new questions
    useEffect(() => {
        // Mark that user entered chatbot area
        sessionStorage.setItem(`chatbot_active_${userId}`, 'true');
        
        // Cleanup: Invalidate cache (including group cache) if new questions were asked
        return () => {
            const hasNewQuestions = sessionStorage.getItem(`chatbot_new_questions_${userId}`) === 'true';
            const wasActive = sessionStorage.getItem(`chatbot_active_${userId}`) === 'true';
            
            if (wasActive && hasNewQuestions) {
                // Invalidate both user and group cache asynchronously when leaving chatbot
                fetch(`${API_ENDPOINTS.invalidateCache(userId)}?group=true`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).catch(err => console.warn('Cache invalidation failed:', err));
            }
            
            // Clear session flags
            sessionStorage.removeItem(`chatbot_active_${userId}`);
            sessionStorage.removeItem(`chatbot_new_questions_${userId}`);
        };
    }, [userId]);

    // Fetch conversations from backend on mount
    useEffect(() => {
        fetchConversations();
    }, [userId]);

    const fetchConversations = async (skipAutoLoad = false) => {
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
                
                // Only auto-load if no active conversation and not skipping
                // Skip when user is actively chatting to avoid overwriting message state
                if (!skipAutoLoad && !activeConversationId && formattedConversations.length > 0) {
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
        // Prevent duplicate loads
        if (isLoadingConversation.current) {
            return;
        }
        
        isLoadingConversation.current = true;
        
        try {
            const response = await fetch(`${API_ENDPOINTS.chatbotConversations}/${conversationId}/messages?user_id=${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // Deduplicate messages by ID
                const seenIds = new Set();
                const formattedMessages = data
                    .filter(msg => {
                        if (seenIds.has(msg.id)) {
                            return false;
                        }
                        seenIds.add(msg.id);
                        return true;
                    })
                    .map(msg => ({
                        id: msg.id, // include backend message ID
                        from: msg.sender,
                        text: msg.content,
                        timestamp: new Date(msg.timestamp)
                    }))
                    // Sort by timestamp ascending (oldest first)
                    .sort((a, b) => a.timestamp - b.timestamp);
                
                // Always prepend the welcome message at the start with earliest timestamp
                const welcomeTimestamp = new Date(0); // Epoch time to ensure it's first
                const messagesWithWelcome = [
                    { 
                        id: `welcome-${conversationId}`, 
                        from: "bot", 
                        text: DEFAULT_FIRST_MESSAGE,
                        isDefault: true, // Mark as default message
                        timestamp: welcomeTimestamp
                    },
                    ...formattedMessages
                ];
                
                // Update loaded message IDs
                loadedMessageIds.current = new Set(messagesWithWelcome.map(m => m.id));
                
                setMessages(messagesWithWelcome);
                setLocalMessageIds(new Set());
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            const welcomeMsg = { 
                id: `welcome-${Date.now()}`, 
                from: "bot", 
                text: DEFAULT_FIRST_MESSAGE,
                isDefault: true,
                timestamp: new Date(0)
            };
            loadedMessageIds.current = new Set([welcomeMsg.id]);
            setMessages([welcomeMsg]);
        } finally {
            isLoadingConversation.current = false;
        }
    };

    // Create new conversation (just reset UI state)
    const handleAddConversation = () => {
        setActiveConversationId(null);
        const welcomeMsg = { 
            id: `welcome-new-${Date.now()}`, 
            from: "bot", 
            text: DEFAULT_FIRST_MESSAGE,
            isDefault: true,
            timestamp: new Date(0) // Earliest timestamp to ensure it's first
        };
        loadedMessageIds.current = new Set([welcomeMsg.id]);
        setMessages([welcomeMsg]);
        setLocalMessageIds(new Set());
    };

   // Initial Setup - create first conversation if none exist
    useEffect(() => {
        if (conversations.length === 0 && !activeConversationId) {
            handleAddConversation();
        }
    }, [conversations.length, activeConversationId]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const currentTime = new Date();
        const localMessageId = `local-user-${Date.now()}`;
        const userMsg = { 
            id: localMessageId, 
            from: "user", 
            text: input,
            timestamp: currentTime // Add timestamp for proper ordering
        };
        
        setLocalMessageIds(prev => new Set(prev).add(localMessageId));
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        
        // Mark that new questions were asked for cache invalidation
        sessionStorage.setItem(`chatbot_new_questions_${userId}`, 'true');

        try {
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

            const botMessageId = `bot-${data.chatbot_message_id}`;
            const userMessageId = `user-${data.user_message_id || Date.now()}`;
            const botTimestamp = new Date(); // Bot response timestamp

            // Replace local user message with backend version and add bot response
            // This MUST happen BEFORE updating conversation to prevent race condition
            setMessages((prev) => {
                // Check if bot message already exists in current messages or loaded IDs
                const botExists = prev.some(msg => msg.id === botMessageId) || 
                                 loadedMessageIds.current.has(botMessageId);
                
                // If bot message already exists, don't add it again
                if (botExists) {
                    return prev.map(msg => 
                        msg.id === localMessageId 
                            ? { ...msg, id: userMessageId }
                            : msg
                    );
                }
                
                // Update user message ID and add bot response
                const updated = prev.map(msg => 
                    msg.id === localMessageId 
                        ? { ...msg, id: userMessageId }
                        : msg
                );
                
                const botMsg = { 
                    id: botMessageId,
                    from: "bot", 
                    text: data.response || "Sorry, I encountered an error.",
                    evaluationType: data.evaluation_type,
                    questionId: data.question_id,
                    metadata: data.metadata,
                    timestamp: botTimestamp // Add timestamp for proper ordering
                };
                
                // Track the new message IDs
                loadedMessageIds.current.add(userMessageId);
                loadedMessageIds.current.add(botMessageId);
                
                // Sort messages by timestamp to maintain order
                const allMessages = [...updated, botMsg].sort((a, b) => {
                    const timeA = a.timestamp || new Date(0);
                    const timeB = b.timestamp || new Date(0);
                    return timeA - timeB;
                });
                
                return allMessages;
            });

            // Update conversation ID if it was created by backend
            // Pass skipAutoLoad=true to prevent overwriting our message state
            if (data.conversation_id && data.conversation_id !== activeConversationId) {
                const newConvId = parseInt(data.conversation_id);
                setActiveConversationId(newConvId);
                await fetchConversations(true); // Skip auto-loading messages
            }

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
                text: "⚠️ **Network Error**: Could not connect to the chatbot backend. Please ensure the backend server is running on port 8000.",
                timestamp: new Date() // Add timestamp for proper ordering
            };
            
            setMessages((prev) => {
                const allMessages = [...prev, errorMsg].sort((a, b) => {
                    const timeA = a.timestamp || new Date(0);
                    const timeB = b.timestamp || new Date(0);
                    return timeA - timeB;
                });
                return allMessages;
            });
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
        
        // Don't reload if already active and not loading
        if (id === activeConversationId && !isLoadingConversation.current) {
            return;
        }
        
        setActiveConversationId(id);
        await loadConversationMessages(id);
    };

    return {
        sidebarOpen, setSidebarOpen, activeConversationId, conversations,
        messages, input, isTyping, handleSend, handleConversationClick,
        handleAddConversation, setInput,
    };
}