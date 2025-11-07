package FixItNow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import FixItNow.model.Message;

public interface MessageRepository extends JpaRepository<Message, String> {

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :a AND m.receiver.id = :b) OR (m.sender.id = :b AND m.receiver.id = :a) ORDER BY m.sentAt ASC")
    List<Message> findConversation(@Param("a") String a, @Param("b") String b);

    // Find all messages where the given user is either sender or receiver, ordered by sentAt desc
    List<Message> findBySender_IdOrReceiver_IdOrderBySentAtDesc(String senderId, String receiverId);
}
