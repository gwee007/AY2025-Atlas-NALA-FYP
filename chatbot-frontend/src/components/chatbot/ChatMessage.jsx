import React from "react";
import { Box, Avatar, Typography, useMediaQuery } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ from, text }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isUser = from === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 1.5,
        animation: "fadeIn 0.3s ease-in-out",
        "@keyframes fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: 1.5,
          maxWidth: "80%",
        }}
      >
        {/* Avatar */}
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser ? "#e0e0e0" : "#1976d2", // User: light gray, Bot: blue
            color: isUser ? "#424242" : "#fff",      // User: dark gray, Bot: white
            border: isUser ? "2px solid #bdbdbd" : "2px solid #1565c0", // Bot: darker blue
          }}
        >
          {isUser ? <PersonRoundedIcon fontSize="small" /> : <SmartToyRoundedIcon fontSize="small" />}
        </Avatar>

        {/* Chat bubble */}
        <Box
          sx={{
            bgcolor: isUser ? "#f5f5f5" : "#e3f2fd", // User: very light gray, Bot: very light blue
            color: isUser ? "#212121" : "#0d47a1",   // User: almost black, Bot: deep blue
            borderRadius: 3,
            py: 0.5,
            px: isMobile ? 1 : 1.5, 
            wordWrap: "break-word",
            boxShadow: isUser
              ? "0 2px 8px rgba(189, 189, 189, 0.10)"
              : "0 2px 8px rgba(33, 150, 243, 0.10)", // Bot: blue shadow
            border: isUser ? "2px solid #bdbdbd" : "2px solid #1976d2", // Bot: blue border
            fontSize: isMobile ? "0.75rem" : "0.9rem", 
          }}
        >
          <div>
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </Box>
      </Box>
    </Box>
  );
}
