export default function useStyles({ sidebarOpen, isMobile }) {
	return {
		root: {
			display: "flex",
			mt: "64px",
			height: "calc(100vh - 64px)",
			width: "100vw",
			overflow: "hidden",
		},
		chatContainer: {
			flexGrow: 1,
			display: "flex",
			flexDirection: "column",
			width: isMobile
				? "100vw"
				: {
					xs: "100%",
					sm: "100%",
					md: `calc(100% - ${sidebarOpen ? "280px" : "60px"})`,
				},
			position: isMobile ? "relative" : "absolute",
			right: 0,
			transition: "width 0.3s ease, background-color 0.3s ease",
			bgcolor: "#f5f5f5",
			height: "100%",
			overflow: "hidden",
		},
		messagesBox: {
			flexGrow: 1,
			p: isMobile ? 1 : 2,
			overflowY: "auto",
			border: "2px solid #888",
			borderRadius: 1,
			mx: isMobile ? 1 : 3,
			my: isMobile ? 1 : 2,
			bgcolor: "#fff",
			maxHeight: isMobile
				? "calc(100vh - 64px - 120px)"
				: "calc(100vh - 64px - 180px - 80px)",
		},
		inputBox: {
			px: isMobile ? 1 : 3,
			pb: isMobile ? 1 : 2,
		},
	};
}
