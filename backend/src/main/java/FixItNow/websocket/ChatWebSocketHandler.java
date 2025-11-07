package FixItNow.websocket;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import FixItNow.model.Message;
import FixItNow.model.Users;
import FixItNow.repository.MessageRepository;
import FixItNow.repository.UsersRepository;

/**
 * Simple Text WebSocket handler that maps a connected userId to a session and
 * forwards JSON messages between users.
 *
 * Connect clients using: ws://<host>:<port>/ws/chat?userId=<yourUserId>
 * Sent messages are expected to be JSON objects like: { "to": "peerId", "content": "hello" }
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

	private final ObjectMapper objectMapper = new ObjectMapper();

	// userId -> session
	private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

	private final MessageRepository messageRepository;
	private final UsersRepository usersRepository;

	public ChatWebSocketHandler(MessageRepository messageRepository, UsersRepository usersRepository) {
		this.messageRepository = messageRepository;
		this.usersRepository = usersRepository;
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		URI uri = session.getUri();
		if (uri == null) return;
		String query = uri.getQuery();
		String userId = parseQueryParam(query, "userId");
		if (userId != null && !userId.isBlank()) {
			sessions.put(userId, session);
			// notify connected
			var payload = Map.of("system", true, "message", "connected", "userId", userId);
			session.sendMessage(new TextMessage(objectMapper.writeValueAsString(payload)));
		} else {
			// close connection if no userId provided
			session.close(CloseStatus.BAD_DATA);
		}
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		String payload = message.getPayload();
		Map<String, Object> data = objectMapper.readValue(payload, Map.class);

		// Expected fields: to, content, (optional) from
		String to = (String) data.get("to");
		String content = (String) data.get("content");
		String from = (String) data.get("from");

		if (to == null || content == null || from == null) {
			// ignore or send error back
			var err = Map.of("error", "missing 'to' or 'from' or 'content' field");
			session.sendMessage(new TextMessage(objectMapper.writeValueAsString(err)));
			return;
		}

		// Persist message to database
		try {
			Users sender = usersRepository.findById(from).orElse(null);
			Users receiverUser = usersRepository.findById(to).orElse(null);

			Message saved = null;
			if (sender != null && receiverUser != null) {
				Message msg = new Message();
				msg.setId(UUID.randomUUID().toString());
				msg.setSender(sender);
				msg.setReceiver(receiverUser);
				msg.setContent(content);
				saved = messageRepository.save(msg);
			}

			String timestamp = saved != null && saved.getSentAt() != null ? saved.getSentAt().toString() : null;

			// Echo to sender with timestamp
			var sentBack = Map.of("from", from, "content", content, "to", to, "sentAt", timestamp);
			session.sendMessage(new TextMessage(objectMapper.writeValueAsString(sentBack)));

			WebSocketSession receiver = sessions.get(to);
			if (receiver != null && receiver.isOpen()) {
				var forward = Map.of("from", from, "content", content, "to", to, "sentAt", timestamp);
				receiver.sendMessage(new TextMessage(objectMapper.writeValueAsString(forward)));
			} else {
				// send system notice back (receiver offline)
				var sys = Map.of("system", true, "message", "user-offline", "to", to);
				session.sendMessage(new TextMessage(objectMapper.writeValueAsString(sys)));
			}
		} catch (IOException ioe) {
			var err = Map.of("error", "server-error");
			session.sendMessage(new TextMessage(objectMapper.writeValueAsString(err)));
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		// remove session from map if present
		sessions.values().removeIf(s -> s.getId().equals(session.getId()));
	}

	private String parseQueryParam(String query, String key) {
		if (query == null) return null;
		String[] parts = query.split("&");
		for (String p : parts) {
			String[] kv = p.split("=", 2);
			if (kv.length == 2 && kv[0].equals(key)) return kv[1];
		}
		return null;
	}
}
