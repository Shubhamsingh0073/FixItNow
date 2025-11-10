package FixItNow.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.util.UriUtils;
import org.springframework.web.socket.CloseStatus;

import FixItNow.manager.MessageManager;
import FixItNow.manager.UsersManager;
import FixItNow.model.Message;

import java.util.Map;

/**
 * JWT-authenticated WebSocket handler.
 * The JwtHandshakeInterceptor authenticates the token and sets "userId" in session attributes.
 * Client must pass token during connection (query param ?token=... or Authorization header).
 *
 * Incoming payload expected JSON: { "to": "<userId>", "content": "..." }
 * The server will determine the sender as the authenticated user in the session attributes.
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    @Autowired
    private WebSocketSessionRegistry registry;

    @Autowired
    private MessageManager messageManager;

    @Autowired
    private UsersManager usersManager;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // userId was injected into attributes by JwtHandshakeInterceptor
        Object uid = session.getAttributes().get("userId");
        if (uid == null) {
            // no authenticated user - close
            session.close(CloseStatus.BAD_DATA);
            return;
        }
        String userId = String.valueOf(uid);
        registry.register(userId, session);
        System.out.println("[ChatWS] connection established: userId=" + userId + " sessionId=" + session.getId());


        // send a system message acknowledging connection
        ObjectNode sys = mapper.createObjectNode();
        sys.put("system", true);
        sys.put("message", "connected");
        session.sendMessage(new TextMessage(mapper.writeValueAsString(sys)));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    	System.out.println("[ChatWS] onMessage payload=" + message.getPayload() + " sessionUser=" + session.getAttributes().get("userId"));

    	Map<String, Object> json;
        try {
            json = mapper.readValue(message.getPayload(), Map.class);
        } catch (Exception e) {
            // invalid JSON - ignore
            return;
        }

        // determine authenticated sender
        String senderId = (String) session.getAttributes().get("userId");
        if (senderId == null) return;

        // Expect "to" and "content"
        String to = (String) json.get("to");
        String content = (String) json.get("content");
        
        String tempId = json.get("tempId") != null ? (String) json.get("tempId") : null;

        if (to == null || content == null || content.trim().isEmpty()) {
            // ignore invalid payload
            return;
        }

        // Persist message using MessageManager (resolves Users)
        Message saved = messageManager.saveMessage(senderId, to, content);

        // Build outgoing JSON
        ObjectNode out = mapper.createObjectNode();
        out.put("id", saved.getId());
        out.put("from", saved.getSender() != null ? saved.getSender().getId() : senderId);
        out.put("to", saved.getReceiver() != null ? saved.getReceiver().getId() : to);
        out.put("content", saved.getContent());
        out.put("sentAt", saved.getSentAt() != null ? saved.getSentAt().toString() : null);
        
        if (tempId != null) { out.put("tempId", tempId); }

        String outText = mapper.writeValueAsString(out);

        // Send to recipient if online
        WebSocketSession recipientSession = registry.getSession(to);
        if (recipientSession != null && recipientSession.isOpen()) {
            recipientSession.sendMessage(new TextMessage(outText));
        }

        // Also send back to sender (so optimistic pending message gets replaced)
        WebSocketSession senderSession = registry.getSession(senderId);
        if (senderSession != null && senderSession.isOpen()) {
            senderSession.sendMessage(new TextMessage(outText));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        try {
            String removedUser = registry.removeBySession(session);
            // no-op otherwise
        } catch (Exception ignored) {}
    }
}