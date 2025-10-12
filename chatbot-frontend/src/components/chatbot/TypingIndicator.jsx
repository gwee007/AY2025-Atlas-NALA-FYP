import { Box, Avatar } from "@mui/material";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

export default function TypingIndicator() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#e2e3e5",
            color: "#222",
          }}
        >
          <SmartToyRoundedIcon fontSize="small" />
        </Avatar>

        <Box
          sx={{
            bgcolor: "#f0ededff",
            borderRadius: 2,
            p: 1.5,
            display: "flex",
            gap: 0.5,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#bbb",
                animation: "pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
                "@keyframes pulse": {
                  "0%, 80%, 100%": { opacity: 0.3 },
                  "40%": { opacity: 1 },
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}