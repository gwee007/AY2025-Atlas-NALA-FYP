import React from "react";
import { Box, TextField, IconButton, InputAdornment } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

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
        size="small"
        placeholder="Type something..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={2}
        disabled={disabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={onSend}
                disabled={!input.trim() || disabled}
                sx={{
                  bgcolor: "#1976d2",
                  color: "#fff",
                  "&:hover": { bgcolor: "#1565c0" }, // Slightly deeper blue on hover
                  p: 1,
                  ml: 0.5,
                  boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)", // Blue shadow for accent
                }}
              >
                <SendRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            bgcolor: disabled ? "#f5f5f7" : "#f9fbfd", // Softer backgrounds
            borderRadius: 3,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            boxShadow: "0 1px 6px rgba(25, 118, 210, 0.08)", // Blue-tinted shadow
            maxHeight: 140,
            overflowY: "auto",
            background: disabled ? "#f5f5f7" : "#f9fbfd",
            border: "1px solid #888",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#888", 
          },
        }}
      />
    </Box>
  );
}

