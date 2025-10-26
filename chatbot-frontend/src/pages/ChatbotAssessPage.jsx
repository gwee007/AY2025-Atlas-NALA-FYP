import { Box, useMediaQuery, useTheme } from "@mui/material";
import ChatbotSidebar from "../components/chatbot/ChatbotSidebar";
import TopicSelector from "../components/chatbot/TopicSelector";
import ChatHeader from "../components/chatbot/ChatHeader";
import ChatArea from "../components/chatbot/ChatArea";
import useChatbotConversations from "../hooks/useChatbotConversations";
import topicList from "../data/topicList";
import useStyles from "../styles/useStyles";

// Utility function for formatting topic
const formatTopic = (value) =>
	value
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

export default function ChatbotAssessPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const {
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
	} = useChatbotConversations();

	const handleToggleSidebar = () => setSidebarOpen((prev) => !prev);

	// Responsive styles
	const classes = useStyles({ sidebarOpen, isMobile });

	return (
		<Box sx={classes.root}>
			<ChatbotSidebar
				open={sidebarOpen}
				conversations={conversations}
				activeConversationId={activeConversationId}
				onConversationClick={handleConversationClick}
				onToggleSidebar={handleToggleSidebar}
				onAddConversation={handleAddConversation}
			/>
			<Box sx={classes.chatContainer}>
				<ChatHeader
					isMobile={isMobile}
					onToggleSidebar={handleToggleSidebar}
				>
					<TopicSelector
						selectedTopicLabel={selectedTopicLabel}
						selectedTopicValue={selectedTopicValue}
						onSelectTopic={(value) => handleSelectTopic(value, formatTopic)}
						topicList={topicList}
					/>
				</ChatHeader>
				<ChatArea
					messages={messages}
					isTyping={isTyping}
					input={input}
					setInput={setInput}
					onSend={handleSend}
					selectedTopicLabel={selectedTopicLabel}
					classes={classes}
				/>
			</Box>
		</Box>
	);
}
