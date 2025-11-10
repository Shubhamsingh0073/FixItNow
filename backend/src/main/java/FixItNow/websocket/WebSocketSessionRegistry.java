package FixItNow.websocket;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

/**
 * Registry mapping userId -> WebSocketSession.
 * Provides removeBySession to cleanup on connection closed.
 */
@Component
public class WebSocketSessionRegistry {
    private final ConcurrentMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(String userId, WebSocketSession session) {
        if (userId == null || session == null) return;
        sessions.put(userId, session);
    }

    public void unregister(String userId) {
        if (userId == null) return;
        sessions.remove(userId);
    }

    public WebSocketSession getSession(String userId) {
        return sessions.get(userId);
    }

    public boolean isOnline(String userId) {
        WebSocketSession s = sessions.get(userId);
        return s != null && s.isOpen();
    }

    /**
     * Remove the mapping whose session equals the provided session.
     * Returns removed userId or null.
     */
    public String removeBySession(WebSocketSession session) {
        if (session == null) return null;
        for (Map.Entry<String, WebSocketSession> e : sessions.entrySet()) {
            if (e.getValue().equals(session)) {
                sessions.remove(e.getKey());
                return e.getKey();
            }
        }
        return null;
    }
}