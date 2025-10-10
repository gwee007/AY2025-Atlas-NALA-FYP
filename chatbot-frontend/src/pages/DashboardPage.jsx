// NOT THE ACTUAL DASHBOARD, JUST A PLACEHOLDER
const stats = [
    { label: "Active Users", value: 1245 },
    { label: "New Signups", value: 87 },
    { label: "Messages Sent", value: 3421 },
    { label: "System Uptime", value: "99.98%" },
];

const recentActivities = [
    { time: "10:05 AM", activity: "User JohnDoe signed in" },
    { time: "09:50 AM", activity: "New message received" },
    { time: "09:30 AM", activity: "User JaneSmith registered" },
    { time: "09:10 AM", activity: "System backup completed" },
];

export default function DashboardPage() {
    return (
        <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
            <h1>Dashboard</h1>
            <section style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            background: "#f5f6fa",
                            padding: "1.5rem",
                            borderRadius: "8px",
                            minWidth: "160px",
                            boxShadow: "0 2px 8px #e1e1e1",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                            {stat.value}
                        </div>
                        <div style={{ color: "#888", marginTop: "0.5rem" }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}