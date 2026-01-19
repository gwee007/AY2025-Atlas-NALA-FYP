import { Box, TextField } from "@mui/material";

export default function ChatInput({ input, setInput, onSend, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        fullWidth
        variant="outlined"
        size="medium"
        placeholder="Type something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={4}
        disabled={disabled}
        InputProps={{
          sx: {
            bgcolor: disabled ? "#f5f5f7" : "#ffffff",
            borderRadius: 3,
            pr: 1.5,
            py: 1.5,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            maxHeight: 160,
            overflowY: "auto",
            background: disabled ? "#f5f5f7" : "#ffffff",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d0d0d0",
            borderWidth: "1px",
          },
          "& .MuiInputBase-input": {
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontSize: "1.1rem",
            lineHeight: 1.5,
            "&::placeholder": {
              color: "#999",
              opacity: 1,
            },
          },
        }}
      />
    </Box>
  );
}

