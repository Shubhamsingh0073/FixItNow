package FixItNow.websocket;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.beans.factory.annotation.Autowired;

import FixItNow.manager.UsersManager;
import FixItNow.model.Users;


@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private UsersManager usersManager;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
    	System.out.println("[JwtHandshake] incoming handshake URI=" + request.getURI() + " headers=" + request.getHeaders());

    	// 1) Try Authorization header: "Bearer <token>"
        List<String> auth = request.getHeaders().get("Authorization");
        String token = null;
        if (auth != null && !auth.isEmpty()) {
            String v = auth.get(0);
            if (v != null && v.toLowerCase().startsWith("bearer ")) {
                token = v.substring(7).trim();
            }
        }

        // 2) If not found in header, try query param 'token'
        if (token == null) {
            Optional<String> q = UriComponentsBuilder.fromUri(request.getURI())
                    .build()
                    .getQueryParams()
                    .getFirst("token") == null ? Optional.empty() :
                    Optional.of(UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams().getFirst("token"));
            if (q.isPresent()) token = q.get();
        }

        if (token == null || token.isBlank()) {
            return false; // reject handshake
        }
        
        System.out.println("[JwtHandshake] token=" + (token == null ? "<null>" : token.substring(0, Math.min(token.length(), 16)) + "..."));


        // Validate token using your UsersManager (returns email or "401")
        String email = usersManager.validateToken(token);
        System.out.println("[JwtHandshake] validateToken -> " + email);

        if (email == null || "401".equals(email)) {
            return false;
        }
        

        // Map email -> Users and set userId in attributes
        Users user = usersManager.getUserByEmail(email);
        if (user == null || user.getId() == null) {
            return false;
        }

        attributes.put("userId", user.getId());
        attributes.put("authEmail", email);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}