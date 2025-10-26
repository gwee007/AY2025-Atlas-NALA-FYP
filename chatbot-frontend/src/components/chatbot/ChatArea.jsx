import { Box } from "@mui/material";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

export default function ChatArea({
	messages,
	isTyping,
	input,
	setInput,
	onSend,
	selectedTopicLabel,
	classes,
}) {
	return (
		<>
			<Box sx={classes.messagesBox}>
				{messages.map((msg, i) => (
					<ChatMessage key={i} from={msg.from} text={msg.text} />
				))}
				{isTyping && <TypingIndicator />}
			</Box>
			<Box sx={classes.inputBox}>
				<ChatInput
					input={input}
					setInput={setInput}
					onSend={onSend}
					disabled={!selectedTopicLabel}
				/>
			</Box>
		</>
	);
}
