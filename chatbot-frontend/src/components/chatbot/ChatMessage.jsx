import React from "react";
import { Box, Avatar, useMediaQuery } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useTheme } from "@mui/material/styles";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function ChatMessage({ from, text }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isUser = from === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 3,
        px: isMobile ? 2 : 4,
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-start",
          gap: 2,
          maxWidth: "75%",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: isUser ? "#667eea" : "#764ba2",
            color: "#fff",
            flexShrink: 0,
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          {isUser ? "U" : <SmartToyRoundedIcon fontSize="small" />}
        </Avatar>

        <Box
          sx={{
            bgcolor: isUser ? "#f3f4f6" : "#ffffff",
            border: isUser ? "1px solid #e5e7eb" : "1px solid #e2e8f0",
            borderRadius: 3,
            py: 2,
            px: 2.5,
            color: "#374151",
            fontSize: isMobile ? "0.9rem" : "1rem",
            lineHeight: 1.7,
            wordWrap: "break-word",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            "& p": {
              margin: "0 0 1em 0",
              fontFamily: "inherit",
              fontSize: "inherit",
              "&:last-child": {
                margin: 0,
              },
            },
            "& strong": {
              fontFamily: "inherit",
              fontSize: "inherit",
              fontWeight: 600,
            },
            "& em": {
              fontFamily: "inherit",
              fontSize: "inherit",
            },
            "& ul, & ol": {
              paddingLeft: "1.5em",
              margin: "0.5em 0",
              fontFamily: "inherit",
              fontSize: "inherit",
            },
            "& li": {
              marginBottom: "0.5em",
              fontFamily: "inherit",
              fontSize: "inherit",
            },
            "& code": {
              backgroundColor: "#f9fafb",
              padding: "0.125em 0.25em",
              borderRadius: "0.25em",
              fontSize: "0.875em",
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
              border: "1px solid #e5e7eb",
            },
            "& pre": {
              backgroundColor: "#f8fafc",
              padding: "1em",
              borderRadius: "0.5em",
              border: "1px solid #e2e8f0",
              overflow: "auto",
              fontSize: "0.875em",
              fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
            },
            "& pre code": {
              backgroundColor: "transparent",
              padding: 0,
              border: "none",
            },
            "& .katex": {
              fontSize: "1em",
              fontFamily: "'KaTeX_Main', 'Times New Roman', serif",
            },
            "& .katex-display": {
              margin: "1em 0",
              overflow: "auto",
            },
          }}
        >
          <div>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {text}
            </ReactMarkdown>
          </div>
        </Box>
      </Box>
    </Box>
  );
}
