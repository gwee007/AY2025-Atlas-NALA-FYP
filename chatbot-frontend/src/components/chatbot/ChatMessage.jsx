import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

export default function ChatMessage({ from, text }) {
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
            bgcolor: isUser ? "#438ad0ff" : "#e2e3e5",
            color: isUser ? "#fff" : "#222",
          }}
        >
          {isUser ? <PersonRoundedIcon fontSize="small" /> : <SmartToyRoundedIcon fontSize="small" />}
        </Avatar>

        {/* Chat bubble */}
        <Box
          sx={{
            bgcolor: isUser ? "#438ad0ff" : "#f0ededff",
            color: isUser ? "#fff" : "#2c2c2c",
            borderRadius: 2,
            p: 1.5,
            wordWrap: "break-word",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Subtle shadow
          }}
        >
          <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{text}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
