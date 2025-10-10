// NOT UPDATED AT ALL 
import React, { useState } from "react";

const sampleQuestions = [
    { id: 1, question: "What is your name?" },
    { id: 2, question: "How can I help you today?" },
    { id: 3, question: "Do you have any feedback for us?" },
];

export default function ChatbotAssessPage() {
    const [messages, setMessages] = useState([
        { from: "bot", text: "Hello! I'm your assessment chatbot. How can I assist you today?" },
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { from: "user", text: input }]);
        // Simulate bot response
        setTimeout(() => {
            const nextQuestion = sampleQuestions[messages.length - 1];
            setMessages((msgs) => [
                ...msgs,
                {
                    from: "bot",
                    text: nextQuestion ? nextQuestion.question : "Thank you for your responses!",
                },
            ]);
        }, 800);
        setInput("");
    };

    return (
        <div style={{ maxWidth: 500, margin: "40px auto", border: "1px solid #ccc", borderRadius: 8, padding: 24 }}>
            <h2>Assessment Chatbot</h2>
            <div style={{ minHeight: 200, marginBottom: 16, background: "#f9f9f9", padding: 12, borderRadius: 4 }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{ textAlign: msg.from === "user" ? "right" : "left", margin: "8px 0" }}>
                        <span
                            style={{
                                display: "inline-block",
                                background: msg.from === "user" ? "#d1e7dd" : "#e2e3e5",
                                color: "#222",
                                padding: "8px 12px",
                                borderRadius: 16,
                                maxWidth: "80%",
                            }}
                        >
                            {msg.text}
                        </span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    type="text"
                    value={input}
                    placeholder="Type your answer..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                />
                <button onClick={handleSend} style={{ padding: "8px 16px", borderRadius: 4 }}>
                    Send
                </button>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------------- //
// chatbot input area can look like this

// import React, { useState } from 'react';

// const ChatbotPage = () => {
//     const [messages, setMessages] = useState([
//         { sender: 'bot', text: 'Hello! How can I help you today?' }
//     ]);
//     const [input, setInput] = useState('');

//     const handleSend = () => {
//         if (!input.trim()) return;
//         setMessages([...messages, { sender: 'user', text: input }]);
//         // Simulate bot response
//         setTimeout(() => {
//             setMessages(prev => [
//                 ...prev,
//                 { sender: 'bot', text: "I'm just a sample bot. You said: " + input }
//             ]);
//         }, 500);
//         setInput('');
//     };

//     const handleInputKeyDown = (e) => {
//         if (e.key === 'Enter') handleSend();
//     };

//     return (
//         <div style={{ maxWidth: 500, margin: '40px auto', border: '1px solid #ccc', borderRadius: 8, padding: 24, background: '#fafafa' }}>
//             <h2>Chatbot</h2>
//             <div style={{ minHeight: 300, marginBottom: 16, overflowY: 'auto', background: '#fff', padding: 12, borderRadius: 4, border: '1px solid #eee' }}>
//                 {messages.map((msg, idx) => (
//                     <div key={idx} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
//                         <span
//                             style={{
//                                 display: 'inline-block',
//                                 padding: '8px 12px',
//                                 borderRadius: 16,
//                                 background: msg.sender === 'user' ? '#0078d4' : '#e5e5ea',
//                                 color: msg.sender === 'user' ? '#fff' : '#333',
//                                 maxWidth: '80%',
//                                 wordBreak: 'break-word'
//                             }}
//                         >
//                             {msg.text}
//                         </span>
//                     </div>
//                 ))}
//             </div>
//             <div style={{ display: 'flex', gap: 8 }}>
//                 <input
//                     type="text"
//                     value={input}
//                     onChange={e => setInput(e.target.value)}
//                     onKeyDown={handleInputKeyDown}
//                     placeholder="Type your message..."
//                     style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
//                 />
//                 <button onClick={handleSend} style={{ padding: '8px 16px', borderRadius: 4, background: '#0078d4', color: '#fff', border: 'none' }}>
//                     Send
//                 </button>
//             </div>
//         </div>
//     );
// };
