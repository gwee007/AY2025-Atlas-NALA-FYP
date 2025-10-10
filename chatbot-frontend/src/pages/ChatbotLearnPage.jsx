import React, { useState } from "react";

const ChatbotLearnPage = () => {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [examples, setExamples] = useState([]);
    const [message, setMessage] = useState("");

    const handleAddExample = () => {
        if (question && answer) {
            setExamples([...examples, { question, answer }]);
            setQuestion("");
            setAnswer("");
            setMessage("Example added!");
            setTimeout(() => setMessage(""), 1500);
        }
    };

    const handleSave = () => {
        // Replace with API call to save examples
        setMessage("Learning data saved!");
        setTimeout(() => setMessage(""), 2000);
    };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee" }}>
            <h2>Teach the Chatbot</h2>
            <div style={{ marginBottom: 16 }}>
                <label>
                    <strong>Question:</strong>
                    <input
                        type="text"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        style={{ width: "100%", marginTop: 4, marginBottom: 8, padding: 8 }}
                        placeholder="Enter a user question"
                    />
                </label>
                <label>
                    <strong>Answer:</strong>
                    <input
                        type="text"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        style={{ width: "100%", marginTop: 4, marginBottom: 8, padding: 8 }}
                        placeholder="Enter the chatbot's answer"
                    />
                </label>
                <button onClick={handleAddExample} style={{ padding: "8px 16px" }}>
                    Add Example
                </button>
            </div>
            {message && <div style={{ color: "green", marginBottom: 12 }}>{message}</div>}
            <h3>Examples</h3>
            <ul>
                {examples.map((ex, idx) => (
                    <li key={idx}>
                        <strong>Q:</strong> {ex.question} <br />
                        <strong>A:</strong> {ex.answer}
                    </li>
                ))}
            </ul>
            {examples.length > 0 && (
                <button onClick={handleSave} style={{ marginTop: 16, padding: "8px 16px" }}>
                    Save Learning Data
                </button>
            )}
        </div>
    );
};

export default ChatbotLearnPage;