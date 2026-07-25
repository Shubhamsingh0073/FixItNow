import React, { useState, useRef, useEffect } from "react";
import "./ChatPanel.css";

const WS_BASE = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8087/ws/chat`;
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8087";

function normalizeId(raw) {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    const candidate = raw.id ?? raw._id ?? raw.userId ?? raw.user_id ?? raw.userid ?? raw.uid;
    if (candidate != null) return String(candidate);
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }
  return String(raw);
}

/**
 * ChatPanel
 * props:
 *  - currentUserId: string (your user id)
 *  - peerId: string (the id of the other user you are chatting with)
 *  - peerName: string (optional display name)
 *  - onBack: function to navigate back
 *
 * NOTE: this component expects a JWT saved in localStorage under key "token".
 * The client connects to: ws://.../ws/chat?token=<JWT>
 */
const ChatPanel = ({ currentUserId, peerId, peerName = "Peer", onBack }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]); // { id, from, to, content, sentAt, pending? }
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getStoredUserId = () => {
    const direct = localStorage.getItem("userId");
    if (direct) return direct;
    try {
      const userObj = JSON.parse(localStorage.getItem("currentUser"));
      if (userObj && (userObj.id || userObj.userId || userObj._id || userObj.email)) {
        return userObj.id || userObj.userId || userObj._id || userObj.email;
      }
    } catch (_) {}
    return "";
  };

  const myId = normalizeId(currentUserId || getStoredUserId());

  // helper to map server/history message object to our shape with normalized ids
  const mapServerMessage = (m) => {
    const id = m.id ?? m.messageId ?? m.message_id ?? "";
    const rawFrom = m.from ?? m.senderId ?? m.sender_id ?? m.sender ?? m.userId ?? m.user_id;
    const rawTo = m.to ?? m.receiverId ?? m.receiver_id ?? m.receiver ?? m.peerId ?? m.peer_id;
    return {
      id: id,
      from: normalizeId(rawFrom),
      to: normalizeId(rawTo),
      content: m.content,
      sentAt: m.sentAt || m.createdAt || m.timestamp || m.time || null,
      pending: !!m.pending,
    };
  };

  const handleIncomingWsMessage = (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.system) {
        setStatus(String(data.message || ""));
        return;
      }

      const incoming = mapServerMessage(data);

      setMessages(prev => {
        // 1) If the server echoed tempId, match the optimistic by tempId
        if (data.tempId) {
          const idx = prev.findIndex(m => m.id === data.tempId && m.pending);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { id: incoming.id, from: incoming.from, to: incoming.to, content: incoming.content, sentAt: incoming.sentAt };
            return next;
          }
        }

        // 2) fallback: match by pending + content + from
        const pendingIndex = prev.findIndex(m => m.pending && m.content === incoming.content && normalizeId(m.from) === incoming.from);
        if (pendingIndex !== -1) {
          const next = [...prev];
          next[pendingIndex] = { id: incoming.id, from: incoming.from, to: incoming.to, content: incoming.content, sentAt: incoming.sentAt };
          return next;
        }

        // 3) otherwise append new message, avoid duplicates by id
        if (incoming.id) {
          const exists = prev.some(m => (m.id && incoming.id && String(m.id) === String(incoming.id)));
          if (exists) return prev;
        }
        return [...prev, { id: incoming.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, from: incoming.from, to: incoming.to, content: incoming.content, sentAt: incoming.sentAt }];
      });

    } catch (err) {
      console.error("[ChatPanel] invalid WS message", err, raw);
    }
  };


  // Connection useEffect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("[ChatPanel] no token found - won't connect");
      return;
    }

    const url = `${WS_BASE}?token=${encodeURIComponent(token)}`;
    console.log("[ChatPanel] connecting to", url);
    const ws = new window.WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[ChatPanel] ws.onopen");
      setConnected(true);
      setStatus("Connected");
    };

    ws.onmessage = (ev) => {
      handleIncomingWsMessage(ev.data);
    };

    ws.onerror = (ev) => {
      console.log("[ChatPanel] ws.onerror", ev);
      setStatus("Error");
    };

    ws.onclose = (ev) => {
      console.log("[ChatPanel] ws.onclose", ev);
      setConnected(false);
      setStatus("Disconnected");
    };

    return () => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) ws.close();
      } catch (_) { }
    };
  }, []); // run once on mount

  // fetch message history
  useEffect(() => {
    const token = localStorage.getItem("token");
    const uid = myId;
    if (!uid || !peerId) {
      console.log("[ChatPanel] skipping history fetch - missing uid or peerId", { uid, peerId });
      return;
    }

    const histUrl = `${API_BASE}/api/chat/history?userA=${encodeURIComponent(uid)}&userB=${encodeURIComponent(peerId)}`;
    console.log("[ChatPanel] fetching history", histUrl);
    fetch(histUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`History fetch failed ${res.status}`);
        return res.json();
      })
      .then((arr) => {
        const mapped = (arr || []).map((m) => {
          const mm = mapServerMessage(m);
          return { id: mm.id || `${Math.random().toString(36).slice(2)}`, from: mm.from, to: mm.to, content: mm.content, sentAt: mm.sentAt };
        });
        console.log("[ChatPanel] history loaded, messages:", mapped.length);
        setMessages(mapped);
      })
      .catch((err) => {
        console.error("Failed to load history", err);
      });
  }, [peerId, myId]);

  // scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const payload = { to: peerId, content: input, tempId };

    const optimistic = {
      id: tempId,
      from: myId,
      to: normalizeId(peerId),
      content: input,
      sentAt: new Date().toISOString(),
      pending: true
    };

    setMessages(prev => [...prev, optimistic]);
    setInput("");

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      setStatus("Not connected");
      console.warn("[ChatPanel] ws not ready; message queued locally");
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
        <button className="chat-back" onClick={onBack}>
          ←
        </button>
        <div>
          <div className="chat-title">{peerName}</div>
          <div className="chat-sub">{status}</div>
        </div>
      </div>

      <div className="chat-messages">
        {messages
          .filter((m) => m)
          .map((m, i) => {
            const fromId = normalizeId(m.from);
            const toId = normalizeId(m.to);
            const targetPeerId = normalizeId(peerId);
            const currentMyId = normalizeId(myId || currentUserId || getStoredUserId());

            const same = (a, b) => a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

            let mine = false;
            if (same(fromId, currentMyId)) {
              mine = true;
            } else if (same(fromId, targetPeerId)) {
              mine = false;
            } else if (same(toId, targetPeerId)) {
              mine = true;
            } else if (same(toId, currentMyId)) {
              mine = false;
            } else if (fromId && targetPeerId && !same(fromId, targetPeerId)) {
              mine = true;
            }

            const rowStyle = {
              display: 'flex',
              width: '100%',
              justifyContent: mine ? 'flex-end' : 'flex-start',
              marginBottom: '14px',
            };

            const bubbleStyle = mine
              ? {
                  maxWidth: '72%',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 4px 16px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                  color: '#ffffff',
                  marginLeft: 'auto',
                  marginRight: '0',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                  position: 'relative',
                  wordBreak: 'break-word',
                }
              : {
                  maxWidth: '72%',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  marginRight: 'auto',
                  marginLeft: '0',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  wordBreak: 'break-word',
                };

            return (
              <div key={m.id || i} className={`message-row ${mine ? "mine" : "other"}`} style={rowStyle}>
                <div className={`message-bubble ${mine ? "mine" : "other"}`} style={bubbleStyle}>
                  {!mine && (
                    <div className="message-sender" style={{ fontWeight: 600, color: '#a78bfa', fontSize: '13px', marginBottom: '6px' }}>
                      {peerName || m.from}
                    </div>
                  )}
                  <div className="message-content">{m.content}</div>
                  <div className="message-meta" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                    <div className="timestamp">
                      {m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    {m.pending && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginLeft: 8 }}>Sending…</div>}
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
        <button className="chat-send" onClick={sendMessage} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;