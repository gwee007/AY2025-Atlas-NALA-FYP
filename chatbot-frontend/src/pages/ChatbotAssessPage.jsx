import { Box, useMediaQuery, useTheme } from "@mui/material";
import ChatbotSidebar from "../components/chatbot/ChatbotSidebar";
import ChatHeader from "../components/chatbot/ChatHeader";
import ChatArea from "../components/chatbot/ChatArea";
import useChatbotConversations from "../hooks/useChatbotConversations";
import useStyles from "../styles/useStyles";

export default function ChatbotAssessPage() {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	
	const {
		sidebarOpen,
		setSidebarOpen,
		activeConversationId,
		conversations,
		messages,
		input,
		isTyping,
		handleSend,
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
				/>
				<ChatArea
					messages={messages}
					isTyping={isTyping}
					input={input}
					setInput={setInput}
					onSend={handleSend}
					classes={classes}
				/>
			</Box>
		</Box>
	);
}
