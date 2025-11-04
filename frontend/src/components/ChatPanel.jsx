import React, { useState, useRef, useEffect } from "react";

// REPLACE WITH YOUR actual WebSocket URL
const WS_BASE_URL = "ws://localhost:8087/ws"; 

const ChatPanel = ({ providerId, customerId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const socketRef = useRef();

  useEffect(() => {
    // WebSocket URL includes info for routing (this is a common pattern!)
    // You can adapt this depending on your backend (group chat, direct, broadcast):
    // For provider: ws://.../ws/chat?customerId=...&providerId=...
    // For admin: ws://.../ws/chat?customerId=...&admin=true
    const url = `${WS_BASE_URL}/chat?customerId=${customerId}&providerId=${providerId}`;
    socketRef.current = new window.WebSocket(url);

    socketRef.current.onopen = () => {
      console.log("WebSocket Connected");
    };
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // { sender: 'provider' | 'customer' | 'admin', message: 'hello world' }
      setMessages((prev) => [...prev, data]);
    };
    socketRef.current.onerror = (e) => console.error("WebSocket error", e);
    socketRef.current.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      socketRef.current.close();
    };
  }, [providerId, customerId]);

  const sendMessage = () => {
    if (!inputMsg.trim()) return;
    const msgData = {
      sender: "customer",
      message: inputMsg,
      to: providerId, // if your backend wants this info
    };
    socketRef.current.send(JSON.stringify(msgData));
    setMessages((prev) => [...prev, { sender: "me", message: inputMsg }]);
    setInputMsg("");
  };

  return (
    <div className="chat-panel">
      <button className="back-to-booking-btn" onClick={onBack}>⬅ Back</button>
      <h2 className="chat-title">Chat</h2>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-msg ${msg.sender}`}>
            <b>{msg.sender === "admin" ? "Admin"
               : msg.sender === "provider" ? "Provider"
               : msg.sender === "customer" ? "You"
               : msg.sender === "me" ? "You" 
               : msg.sender}</b>: {msg.message}
          </div>
        ))}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          value={inputMsg}
          placeholder="Type a message..."
          onChange={e => setInputMsg(e.target.value)}
          className="chat-input"
        />
        <button className="chat-send-btn" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;