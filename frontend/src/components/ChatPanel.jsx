import React, { useState, useRef, useEffect } from "react";
import "./ChatPanel.css";

// WebSocket base URL - dynamically determine if we're using HTTPS or not
const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8087/ws/chat`;

/**
 * ChatPanel
 * props:
 *  - currentUserId: string (your user id)
 *  - peerId: string (the id of the other user you are chatting with)
 *  - peerName: string (optional display name)
 *  - onBack: function to navigate back
 */
const ChatPanel = ({ currentUserId, peerId, peerName = "Peer", onBack }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]); // { from, content, system? }
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUserId) return;
    const url = `${WS_BASE}?userId=${encodeURIComponent(currentUserId)}`;
    const ws = new window.WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setConnected(true);
      setStatus("Connected");
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        // system messages
        if (data.system) {
          setStatus(String(data.message || ""));
          return;
        }

        // expected: { id?, from, content, to, sentAt }
        setMessages((prev) => {
          // replace optimistic pending message if present
          const pendingIndex = prev.findIndex(m => m.pending && m.from === data.from && m.content === data.content);
          if (pendingIndex !== -1) {
            const next = [...prev];
            next[pendingIndex] = { id: data.id || next[pendingIndex].id, from: data.from, content: data.content, sentAt: data.sentAt };
            return next;
          }
          return [...prev, { id: data.id, from: data.from, content: data.content, sentAt: data.sentAt }];
        });
      } catch (err) {
        console.error("Invalid message", err);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.reason);
      setConnected(false);
      setStatus("Disconnected - Retrying in 5s");
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          const newWs = new WebSocket(url);
          wsRef.current = newWs;
          // Set up the same event handlers for the new connection
          newWs.onopen = ws.onopen;
          newWs.onmessage = ws.onmessage;
          newWs.onclose = ws.onclose;
          newWs.onerror = ws.onerror;
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus("Connection Error");
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [currentUserId]);

  // fetch message history
  useEffect(() => {
    if (!currentUserId || !peerId) return;
    const histUrl = `/api/chat/history?userA=${encodeURIComponent(currentUserId)}&userB=${encodeURIComponent(peerId)}`;
    fetch(histUrl)
      .then((res) => res.json())
      .then((arr) => {
        const mapped = (arr || []).map((m) => ({
          id: m.id,
          from: m.sender ? m.sender.id : (m.from || ''),
          content: m.content,
          sentAt: m.sentAt
        }));
        setMessages(mapped);
      })
      .catch((err) => console.error('Failed to load history', err));
  }, [currentUserId, peerId]);

  // scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const payload = { to: peerId, content: input, from: currentUserId };
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, from: currentUserId, content: input, sentAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setStatus("Not connected");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <button className="chat-back" onClick={onBack}>←</button>
        <div>
          <div className="chat-title">{peerName}</div>
          <div className="chat-sub">{status}</div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.filter(m => m).map((m, i) => {
          const mine = String(m.from) === String(currentUserId) || m.from === "me";
          return (
            <div key={m.id || i} className="message-row">
              <div className={`message-bubble ${mine ? 'mine' : 'other'}`}>
                {!mine && <div className="message-sender">{m.from}</div>}
                <div className="message-content">{m.content}</div>
                <div className="message-meta">
                  <div className="timestamp">{m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <textarea
          className="chat-textarea"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={connected ? "Type a message..." : "Connecting..."}
        />
        <button className="chat-send" onClick={sendMessage} disabled={!input.trim()}>Send</button>
      </div>
    </div>
  );
};

const styles = {
  container: { width: "100%", maxWidth: 700, border: "1px solid #e6e6e6", borderRadius: 8, display: "flex", flexDirection: "column", height: 520, background: "#f7f7f7" },
  header: { padding: 12, borderBottom: "1px solid #eee", display: "flex", gap: 12, alignItems: "center" },
  backBtn: { fontSize: 18, padding: "6px 10px", cursor: "pointer" },
  peerName: { fontWeight: 600 },
  status: { fontSize: 12, color: "#666" },
  messages: { padding: 12, flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 },
  msgRow: { display: "flex" },
  bubble: { maxWidth: "78%", padding: "8px 12px", borderRadius: 12, boxShadow: "0 1px 0 rgba(0,0,0,0.05)" },
  msgText: { whiteSpace: "pre-wrap" },
  msgMeta: { fontSize: 11, color: "#666", marginTop: 6 },
  inputRow: { display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee" },
  input: { flex: 1, borderRadius: 8, padding: 8, resize: "none" },
  sendBtn: { padding: "8px 14px", borderRadius: 8, cursor: "pointer" },
};

export default ChatPanel;