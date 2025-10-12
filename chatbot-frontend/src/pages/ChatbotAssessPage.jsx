import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	useMediaQuery,
	useTheme,
	IconButton,
} from "@mui/material";
import { ViewSidebar as SidebarIcon } from "@mui/icons-material";
import ChatbotSidebar from "../components/chatbot/ChatbotSidebar";
import ChatInput from "../components/chatbot/ChatInput";
import ChatMessage from "../components/chatbot/ChatMessage";
import TypingIndicator from "../components/chatbot/TypingIndicator";

export default function ChatbotAssessPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [activeConversationId, setActiveConversationId] = useState(null);
	const [conversations, setConversations] = useState([]); // only past conversations with topics

	const [messages, setMessages] = useState([]);
	const [selectedTopicValue, setSelectedTopicValue] = useState("");
	const [selectedTopicLabel, setSelectedTopicLabel] = useState("");
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);

	// on page load, create a new "active conversation" (topic empty)
	useEffect(() => {
		if (!activeConversationId) {
			const newConv = {
				id: Date.now().toString(),
				title: `New Chat`,
				createdAt: new Date(),
				topic: "", // empty topic
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
		}
	}, [activeConversationId]);

	// Send user message
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

			// Save both user and bot messages to the active conversation
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

	// Handle topic selection
	const handleSelectTopic = (value) => {
		if (!activeConversationId) return;

		setSelectedTopicValue(value);

		const formatted = value
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		setSelectedTopicLabel(formatted);

		// Add the active conversation with topic to conversations array
		setConversations((prev) => {
			const existing = prev.find((c) => c.id === activeConversationId);
			if (existing) {
				return prev.map((c) =>
					c.id === activeConversationId ? { ...c, topic: formatted } : c
				);
			} else {
				// This is a new conversation that wasn't in sidebar yet
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

	// Click past conversation
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

	// Add new conversation manually
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

	const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

	return (
		<Box
			sx={{
				display: "flex",
				mt: "64px",
				height: "calc(100vh - 64px)",
			}}
		>
			<ChatbotSidebar
				open={sidebarOpen}
				conversations={conversations}
				activeConversationId={activeConversationId}
				onConversationClick={handleConversationClick}
				onToggleSidebar={handleToggleSidebar}
				onAddConversation={handleAddConversation}
			/>

			{/* Chat area */}
			<Box
				sx={{
					flexGrow: 1,
					display: "flex",
					flexDirection: "column",
					width: {
						xs: "100%",
						sm: "100%",
						md: `calc(100% - ${sidebarOpen ? "280px" : "60px"})`,
					},
					position: "absolute",
					right: 0,
					transition:
						"width 0.3s ease, background-color 0.3s ease",
					bgcolor: "#f5f5f5",
					height: "100%",
					overflow: "hidden",
				}}
			>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1,
						px: 3,
						py: 2,
						borderBottom: "1px solid #ddd",
						bgcolor: "#fff",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						{isMobile && (
							<IconButton
								onClick={handleToggleSidebar}
								sx={{ color: "gray" }}
							>
								<SidebarIcon fontSize="large" />
							</IconButton>
						)}
						<Typography
							variant="h5"
							sx={{
								fontWeight: 700,
								color: "#1976d2",
								fontFamily: "Inter",
							}}
						>
							NALA-Assess
						</Typography>
					</Box>

					{!selectedTopicLabel ? (
						<FormControl
							size="small"
							fullWidth
							variant="filled"
							error={!selectedTopicValue}
							sx={{
								border: "1px solid #ddd",
								borderRadius: "8px",
								boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
							}}
						>
							<InputLabel sx={{ fontFamily: "Inter" }}>
								Select CH3111 Topic For Assessment
							</InputLabel>
							<Select
								value={selectedTopicValue}
								onChange={(e) =>
									handleSelectTopic(e.target.value)
								}
								sx={{ fontFamily: "Inter" }}
							>
								<MenuItem value="data-structures">
									Data Structures
								</MenuItem>
								<MenuItem value="algorithms">Algorithms</MenuItem>
								<MenuItem value="machine-learning">
									Machine Learning
								</MenuItem>
								<MenuItem value="databases">Databases</MenuItem>
							</Select>
						</FormControl>
					) : (
						<Typography
							sx={{
								fontWeight: "bold",
								color: "green",
								fontFamily: "Inter",
							}}
						>
							Selected Topic: {selectedTopicLabel}
						</Typography>
					)}
				</Box>

				{/* Messages */}
				<Box
					sx={{
						flexGrow: 1,
						p: 2,
						overflowY: "auto",
						border: "2px solid #888",
						borderRadius: 6,
						mx: 3,
						my: 2,
						bgcolor: "#fff",
					}}
				>
					{messages.map((msg, i) => (
						<ChatMessage key={i} from={msg.from} text={msg.text} />
					))}
					{isTyping && <TypingIndicator />}
				</Box>

				{/* Chat Input */}
				<Box sx={{ px: 3, pb: 2 }}>
					<ChatInput
						input={input}
						setInput={setInput}
						onSend={handleSend}
						disabled={!selectedTopicLabel}
					/>
				</Box>
			</Box>
		</Box>
	);
}
