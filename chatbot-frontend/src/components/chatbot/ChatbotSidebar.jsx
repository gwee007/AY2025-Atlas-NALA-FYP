import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
  Avatar,
} from "@mui/material";
import { Chat as ChatIcon, ViewSidebar as SidebarIcon, AddComment as AddChatIcon } from "@mui/icons-material";

export default function ChatbotSidebar({
  open,
  conversations,
  activeConversationId,
  onConversationClick,
  onToggleSidebar,
  onAddConversation,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const colors = {
    sidebarBg: "#1e1e1e",
    sidebarBorder: "#2f2f2f",
    sidebarForeground: "#f5f5f5",
    sidebarAccent: "#333333",
    mutedForeground: "#9e9e9e",
  };

  // Only include conversations with a topic
  const grouped = React.useMemo(() => {
    const map = {};
    conversations.forEach((conv) => {
      if (!conv.topic) return; // skip conversations without topic
      // Check if the conversation contains at least one user message
      const hasUserMessage = conv.messages.some((msg) => msg.from === "user");
      if (!hasUserMessage) return;

      const topic = conv.topic;
      if (!map[topic]) map[topic] = [];
      map[topic].push(conv);
    });
    return Object.entries(map);
  }, [conversations]);

  return (
    <Box sx={{ display: "flex" }}>
      {/* Slim sidebar */}
      <Box
        sx={{
          position: "fixed",
          top: 64,
          left: 0,
          height: "calc(100vh - 64px)",
          width: 60,
          bgcolor: colors.sidebarBg,
          borderRight: `2px solid ${colors.sidebarBorder}`,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          py: 2,
          zIndex: 1099,
        }}
      >
        <Tooltip title="Toggle Sidebar" arrow>
          <IconButton onClick={onToggleSidebar} sx={{ color: colors.sidebarForeground, mb: 2 }}>
            <SidebarIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="New Conversation" arrow>
          <IconButton onClick={onAddConversation} sx={{ color: colors.sidebarForeground }}>
            <AddChatIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={onToggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: 280,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 280,
            boxSizing: "border-box",
            bgcolor: colors.sidebarBg,
            borderRight: `1px solid ${colors.sidebarBorder}`,
            top: 64,
            height: "calc(100% - 64px)",
            transition: "transform 0.3s ease",
            zIndex: 1099,
            boxShadow: "0 2px 16px 0 rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            py: 2,
            borderBottom: `1px solid ${colors.sidebarBorder}`,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
          onClick={onToggleSidebar}
        >
          <SidebarIcon sx={{ color: "#a9a9a9", mr: 1 }} />
          <Typography sx={{ fontSize: "16px", color: "#a9a9a9", fontFamily: "Inter" }}>Hide Sidebar</Typography>
        </Box>

        {/* Conversations header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: `1px solid ${colors.sidebarBorder}`,
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontFamily: "Inter",
              fontSize: "16px",
              color: colors.sidebarForeground,
            }}
          >
            Conversations
          </Typography>
          <Tooltip title="New Conversation" arrow>
            <IconButton onClick={onAddConversation} sx={{ color: colors.sidebarForeground }}>
              <AddChatIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Conversations list */}
        <Box
          sx={{
            overflow: "auto",
            height: "calc(100% - 104px)",
            px: 0,
            py: 1,
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": { background: "#222", borderRadius: 4 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
          }}
        >
          <List sx={{ p: 0 }}>
            {grouped.length === 0 ? (
              <Typography
                variant="body2"
                sx={{
                  color: colors.mutedForeground,
                  textAlign: "center",
                  fontFamily: "Inter",
                  py: 4,
                }}
              >
                No conversations yet
              </Typography>
            ) : (
              grouped.map(([topic, convs], idx) => (
                <React.Fragment key={topic}>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "12px",
                      color: colors.mutedForeground,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      px: 2,
                      pt: idx === 0 ? 1 : 2,
                      pb: 1,
                    }}
                  >
                    {topic}
                  </Typography>
                  {convs.map((conversation) => (
                    <ListItem key={conversation.id} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => onConversationClick(conversation.id)}
                        selected={activeConversationId === conversation.id}
                        sx={{
                          borderRadius: "8px",
                          minHeight: 48,
                          bgcolor: activeConversationId === conversation.id ? "#a9a9a9" : "transparent",
                          "&:hover": { bgcolor: colors.sidebarAccent },
                          transition: "background 0.2s",
                          px: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: theme.palette.primary.main + "33",
                            color: theme.palette.primary.main,
                            fontSize: 18,
                            mr: 2,
                          }}
                        >
                          <ChatIcon fontSize="small" />
                        </Avatar>
                        <ListItemText
                          primary={conversation.title}
                          primaryTypographyProps={{
                            sx: {
                              fontSize: "15px",
                              color: colors.sidebarForeground,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily: "Inter",
                            },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                  {idx < grouped.length - 1 && <Divider sx={{ my: 1, borderColor: colors.sidebarBorder }} />}
                </React.Fragment>
              ))
            )}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}