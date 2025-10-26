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
				py: 2,
				borderBottom: "1px solid #ddd",
				bgcolor: "#fff",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				{isMobile && (
					<IconButton onClick={onToggleSidebar} sx={{ color: "gray" }}>
						<SidebarIcon fontSize="large" />
					</IconButton>
				)}
				<Typography
					variant="h5"
					sx={{
						fontWeight: 700,
						color: "#1976d2",
						fontFamily: "Inter",
					}}
				>
					NALA-Assess
				</Typography>
			</Box>
			{children}
		</Box>
	);
}
