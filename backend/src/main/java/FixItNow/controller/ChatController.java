package FixItNow.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import FixItNow.model.Message;
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
}
