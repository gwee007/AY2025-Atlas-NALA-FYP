import { FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";

export default function TopicSelector({ selectedTopicLabel, selectedTopicValue, onSelectTopic, topicList }) {
    return !selectedTopicLabel ? (
        <FormControl size="small" fullWidth variant="filled" error={!selectedTopicValue}
            sx={{ border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            <InputLabel sx={{ fontFamily: "Inter" }}>Select CH3111 Topic For Assessment</InputLabel>
            <Select value={selectedTopicValue} onChange={(e) => onSelectTopic(e.target.value)} sx={{ fontFamily: "Inter" }}>
                {topicList.map((topic) => (
                    <MenuItem key={topic.value} value={topic.value}>{topic.label}</MenuItem>
                ))}
            </Select>
        </FormControl>
    ) : (
        <Typography sx={{
            fontWeight: "bold",
            color: "green",
            fontFamily: "Inter",
            bgcolor: "#e6f4ea",
            borderRadius: "8px",
            px: 2,
            py: 1,
            display: "inline-block",
        }}>
            Selected Topic: {selectedTopicLabel}
        </Typography>
    );
}