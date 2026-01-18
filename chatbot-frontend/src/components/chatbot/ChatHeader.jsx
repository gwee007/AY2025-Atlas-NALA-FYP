import { Box, Typography, IconButton } from "@mui/material";
import { ViewSidebar as SidebarIcon } from "@mui/icons-material";

export default function ChatHeader({ isMobile, onToggleSidebar, children }) {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1,
				px: 3,
				py: 2.5,
				bgcolor: "#ffffff",
				borderBottom: "1px solid #e5e7eb",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
				{isMobile && (
					<IconButton 
						onClick={onToggleSidebar} 
						sx={{ color: "gray" }}
					>
						<SidebarIcon fontSize="large" />
					</IconButton>
				)}
				<Typography
					variant="h5"
					sx={{
						fontWeight: 700,
						color: "#374151",
						fontFamily: "Inter, system-ui, -apple-system, sans-serif",
					}}
				>
					NALA-Assess Chatbot
				</Typography>
			</Box>
			{children}
		</Box>
	);
}
