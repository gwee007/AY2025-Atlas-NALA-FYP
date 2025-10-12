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
                  "&:hover": { bgcolor: "#0d47a1" }, 
                  p: 1,
                  ml: 0.5,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)", 
                }}
              >
                <SendRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
          sx: {
            borderRadius: 6,
            bgcolor: disabled ? "#f0f0f0" : "#ffffff", // Brighter color when enabled
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 6, 
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)", // Subtle shadow
          },
        }}
      />
    </Box>
  );
}

