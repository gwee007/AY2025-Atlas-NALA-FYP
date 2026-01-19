import { Box, IconButton } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

export default function ChatArea({
	messages,
	isTyping,
	input,
	setInput,
	onSend,
	classes,
}) {
	return (
		<>
			<Box sx={classes.messagesBox}>
				{messages.map((msg) => (
					<ChatMessage key={msg.id} from={msg.from} text={msg.text} />
				))}
				{isTyping && <TypingIndicator />}
			</Box>
			<Box sx={classes.inputBox}>
				<Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
					<Box sx={{ flex: 1 }}>
						<ChatInput
							input={input}
							setInput={setInput}
							onSend={onSend}
						/>
					</Box>
					<IconButton
						onClick={onSend}
						disabled={!input.trim()}
						sx={{
							bgcolor: !input.trim() ? "#e0e0e0" : "#667eea",
							color: "#fff",
							p: 1.5,
							borderRadius: 2,
							"&:hover": {
								bgcolor: !input.trim() ? "#e0e0e0" : "#764ba2",
							},
							transition: "background-color 0.3s ease",
						}}
					>
						<SendRoundedIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>
		</>
	);
}
