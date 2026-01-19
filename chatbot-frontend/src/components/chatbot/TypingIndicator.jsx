import { Box, Avatar } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

export default function TypingIndicator() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        mb: 3,
        px: { xs: 2, md: 4 },
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          maxWidth: "75%",
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#764ba2",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <SmartToyRoundedIcon fontSize="small" />
        </Avatar>

        <Box
          sx={{
            bgcolor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            py: 2,
            px: 2.5,
            display: "flex",
            gap: 0.7,
            alignItems: "center",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#9ca3af",
                animation: "pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
                "@keyframes pulse": {
                  "0%": { opacity: 0.4 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.4 },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}