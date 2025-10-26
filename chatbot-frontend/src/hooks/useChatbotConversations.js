import { useState, useEffect } from "react";

export default function useChatbotConversations() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeConversationId, setActiveConversationId] = useState(null);
	const [conversations, setConversations] = useState([]);
	const [messages, setMessages] = useState([]);
	const [selectedTopicValue, setSelectedTopicValue] = useState("");
	const [selectedTopicLabel, setSelectedTopicLabel] = useState("");
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	useEffect(() => {
		if (!activeConversationId) {
			const newConv = {
				id: Date.now().toString(),
				title: `New Chat`,
				createdAt: new Date(),
				topic: "",
				messages: [
					{
						from: "bot",
						text: `Welcome to NALA-Assess!
                        \n\n**_Rules of using NALA-Assess:_**
                        \n1. Ask a question **only related to topic(s) of CH3111, Process Control and Dynamics.**
                        \n2. Do **not** ask admin-related questions.
                        \n3. Do **not** ask questions beyond the scope of CH3111 topics.
                        \n4. The chatbot will **not** give you any answers, instead you should use the provided materials to derive an answer to your question.
                        \n\nReady to ask your first question?`,
					},
				],
			};
			setActiveConversationId(newConv.id);
			setMessages(newConv.messages);
			setSelectedTopicValue("");
			setSelectedTopicLabel("");
		}
	}, [activeConversationId]);

	const handleSend = () => {
		if (!input.trim()) return;
		const newMessage = { from: "user", text: input };
		const botReplies = [
			"What’s your preferred learning style?",
			"How confident are you in this topic?",
			"Would you like me to explain further?",
		];
		setMessages((prev) => [...prev, newMessage]);
		setIsTyping(true);
		setTimeout(() => {
			const nextMsg = botReplies[messages.length % botReplies.length];
			const botMessage = { from: "bot", text: nextMsg };
			setMessages((prev) => [...prev, botMessage]);
			setIsTyping(false);
			setConversations((prev) =>
				prev.map((conv) =>
					conv.id === activeConversationId
						? { ...conv, messages: [...conv.messages, newMessage, botMessage] }
						: conv
				)
			);
		}, 800);
		setInput("");
	};

	const handleSelectTopic = (value, formatTopic) => {
		if (!activeConversationId) return;
		setSelectedTopicValue(value);
		const formatted = formatTopic(value);
		setSelectedTopicLabel(formatted);
		setConversations((prev) => {
			const existing = prev.find((c) => c.id === activeConversationId);
			if (existing) {
				return prev.map((c) =>
					c.id === activeConversationId ? { ...c, topic: formatted } : c
				);
			} else {
				return [
					{
						id: activeConversationId,
						title: `Chat ${prev.length + 1}`,
						createdAt: new Date(),
						topic: formatted,
						messages: messages,
					},
					...prev,
				];
			}
		});
	};

	const handleConversationClick = (id) => {
		const conv = conversations.find((c) => c.id === id);
		if (!conv) return;
		setActiveConversationId(id);
		setMessages(conv.messages || []);
		if (conv.topic) {
			setSelectedTopicLabel(conv.topic);
			setSelectedTopicValue(conv.topic.toLowerCase().replace(/\s+/g, "-"));
		} else {
			setSelectedTopicLabel("");
			setSelectedTopicValue("");
		}
	};

	const handleAddConversation = () => {
		const newConv = {
			id: Date.now().toString(),
			title: `New Chat`,
			createdAt: new Date(),
			topic: "",
			messages: [
				{
					from: "bot",
					text: "Hello! I'm NALA-Assess. How can I assist you today?",
				},
			],
		};
		setActiveConversationId(newConv.id);
		setMessages(newConv.messages);
		setSelectedTopicValue("");
		setSelectedTopicLabel("");
	};

	return {
		sidebarOpen,
		setSidebarOpen,
		activeConversationId,
		conversations,
		messages,
		selectedTopicValue,
		selectedTopicLabel,
		input,
		isTyping,
		handleSend,
		handleSelectTopic,
		handleConversationClick,
		handleAddConversation,
		setInput,
	};
}