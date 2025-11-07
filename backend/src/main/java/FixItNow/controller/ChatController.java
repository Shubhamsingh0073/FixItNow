package FixItNow.controller;

import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import FixItNow.model.Message;
import FixItNow.model.ConversationSummary;
import FixItNow.repository.MessageRepository;

@RestController
public class ChatController {

    private final MessageRepository messageRepository;

    public ChatController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/api/chat/history")
    public List<Message> getHistory(@RequestParam String userA, @RequestParam String userB) {
        return messageRepository.findConversation(userA, userB);
    }

    /**
     * Return conversation summaries for a given user (peer id, peer name, last message, lastAt)
     */
    @GetMapping("/api/chat/conversations")
    public List<ConversationSummary> getConversations(@RequestParam String userId) {
        // fetch all messages where user is either sender or receiver, newest first
        List<Message> msgs = messageRepository.findBySender_IdOrReceiver_IdOrderBySentAtDesc(userId, userId);

        // preserve insertion order -> newest first encountered
        Map<String, ConversationSummary> map = new LinkedHashMap<>();

        for (Message m : msgs) {
            String peerId = null;
            String peerName = null;
            if (m.getSender() != null && userId.equals(m.getSender().getId())) {
                // peer is receiver
                if (m.getReceiver() == null) continue;
                peerId = m.getReceiver().getId();
                peerName = m.getReceiver().getName();
            } else if (m.getReceiver() != null && userId.equals(m.getReceiver().getId())) {
                // peer is sender
                if (m.getSender() == null) continue;
                peerId = m.getSender().getId();
                peerName = m.getSender().getName();
            }

            if (peerId == null) continue;

            // If we already have this peer, skip because msgs are ordered newest-first
            if (!map.containsKey(peerId)) {
                ConversationSummary s = new ConversationSummary(peerId, peerName, m.getContent(), m.getSentAt());
                map.put(peerId, s);
            }
        }

        return new ArrayList<>(map.values());
    }
}
