package FixItNow.controller;

import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import FixItNow.model.Message;
import FixItNow.model.MessageDTO;
import FixItNow.model.ConversationSummary;
import FixItNow.repository.MessageRepository;


@RestController
public class ChatController {

    private final MessageRepository messageRepository;

    public ChatController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/api/chat/history")
    public List<MessageDTO> getHistory(@RequestParam String userA, @RequestParam String userB) {
        List<Message> msgs = messageRepository.findConversation(userA, userB);
        return msgs.stream()
                .map(m -> new MessageDTO(
                        m.getId(),
                        m.getSender() != null ? m.getSender().getId() : null,
                        m.getReceiver() != null ? m.getReceiver().getId() : null,
                        m.getContent(),
                        m.getSentAt()))
                .collect(Collectors.toList());
    }

    
    @GetMapping("/api/chat/conversations")
    public List<ConversationSummary> getConversations(@RequestParam String userId) {
        List<Message> msgs = messageRepository.findBySender_IdOrReceiver_IdOrderBySentAtDesc(userId, userId);

        Map<String, ConversationSummary> map = new LinkedHashMap<>();

        for (Message m : msgs) {
            String peerId = null;
            String peerName = null;
            if (m.getSender() != null && userId.equals(m.getSender().getId())) {
                if (m.getReceiver() == null) continue;
                peerId = m.getReceiver().getId();
                peerName = m.getReceiver().getName();
            } else if (m.getReceiver() != null && userId.equals(m.getReceiver().getId())) {
                if (m.getSender() == null) continue;
                peerId = m.getSender().getId();
                peerName = m.getSender().getName();
            }

            if (peerId == null) continue;

            if (!map.containsKey(peerId)) {
                ConversationSummary s = new ConversationSummary(peerId, peerName, m.getContent(), m.getSentAt());
                map.put(peerId, s);
            }
        }

        return new ArrayList<>(map.values());
    }
}