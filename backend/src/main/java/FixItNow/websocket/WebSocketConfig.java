package FixItNow.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    @Autowired
    private JwtHandshakeInterceptor jwtHandshakeInterceptor;

    @Value("${app.websocket.path:/ws/chat}")
    private String websocketPath;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Allow all origins for development; restrict origins in production
        registry.addHandler(chatWebSocketHandler, websocketPath)
                .addInterceptors(new HttpSessionHandshakeInterceptor(), jwtHandshakeInterceptor)
                .setAllowedOrigins("*");
    }
}