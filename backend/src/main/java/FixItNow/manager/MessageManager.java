package FixItNow.manager;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import FixItNow.model.Message;
import FixItNow.model.Users;
import FixItNow.repository.MessageRepository;
import FixItNow.repository.UsersRepository;

@Service
public class MessageManager {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UsersRepository usersRepository;

    /**
     * Persist a message given senderId, receiverId and content.
     * Returns the saved Message entity with id and sentAt.
     */
    public Message saveMessage(String senderId, String receiverId, String content) {
        Users sender = usersRepository.findById(senderId).orElse(null);
        Users receiver = usersRepository.findById(receiverId).orElse(null);

        Message msg = new Message();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setContent(content);
        
        System.out.println("[MessageManager] saveMessage senderId=" + senderId + " receiverId=" + receiverId + " content=" + content);

        return messageRepository.save(msg);
        
       
    }
}