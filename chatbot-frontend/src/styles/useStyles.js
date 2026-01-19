export default function useStyles({ sidebarOpen, isMobile }) {
	return {
		root: {
			display: "flex",
			mt: "64px",
			height: "calc(100vh - 64px)",
			width: "100vw",
			overflow: "hidden",
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		},
		chatContainer: {
			flexGrow: 1,
			display: "flex",
			flexDirection: "column",
			width: isMobile
				? "100%"
				: {
					xs: "100%",
					sm: "100%",
					md: `calc(100% - ${sidebarOpen ? "280px" : "60px"})`,
				},
			position: "relative",
			bgcolor: "#fafbfc",
			height: "100%",
			overflow: "hidden",
		},
		messagesBox: {
			flexGrow: 1,
			overflowY: "auto",
			bgcolor: "#ffffff",
			height: "1px",
			minHeight: 0,
			// Scrollbar styling to prevent pop-out
			"&::-webkit-scrollbar": {
				width: "6px",
			},
			"&::-webkit-scrollbar-track": {
				background: "transparent",
			},
			"&::-webkit-scrollbar-thumb": {
				background: "#d1d5db",
				borderRadius: "3px",
				"&:hover": {
					background: "#9ca3af",
				},
			},
			scrollbarWidth: "thin",
			scrollbarColor: "#d1d5db transparent",
		},
		inputBox: {
			px: isMobile ? 1 : 3,
			pb: isMobile ? 2.5 : 3.5,
			pt: isMobile ? 1.5 : 2,
			flexShrink: 0,
		},
	};
}
