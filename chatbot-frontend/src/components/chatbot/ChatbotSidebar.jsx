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

  // No filtering needed - backend only returns conversations with messages
  const filteredConversations = conversations;

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
        <Tooltip title="Show Sidebar" arrow>
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
        open={isMobile ? open : true} // Always open on large screens
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
        {!isMobile && null /* Hide Close Sidebar button on large screens */}
        {isMobile && (
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
            <Typography sx={{ fontSize: "16px", color: "#a9a9a9", fontFamily: "Inter" }}>Close Sidebar</Typography>
          </Box>
        )}

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
            {filteredConversations.length === 0 ? (
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
              filteredConversations.map((conversation) => (
                <ListItem key={conversation.id} disablePadding sx={{ mb: 0.5 }}>
                  <Tooltip title={conversation.title} placement="right" arrow>
                    <ListItemButton
                      onClick={() => onConversationClick(conversation.id)}
                      selected={activeConversationId === conversation.id}
                      sx={{
                        borderRadius: "8px",
                        minHeight: 48,
                        bgcolor: activeConversationId === conversation.id ? "#a9a9a9" : "transparent",
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
                            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                          },
                        }}
                      />
                    </ListItemButton>
                  </Tooltip>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
}