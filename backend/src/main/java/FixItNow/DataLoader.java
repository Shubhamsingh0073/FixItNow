package FixItNow;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import FixItNow.model.Users;
import FixItNow.model.UserRole;
import FixItNow.repository.UsersRepository;



import org.springframework.beans.factory.annotation.Autowired;
@Component
@Profile("!test")
public class DataLoader implements CommandLineRunner {
    @Autowired
    private UsersRepository userRepository;
    @Override
    public void run(String... args) throws Exception {
        // Check if user already exists
        if (!userRepository.existsByEmail("alice@example.com")) {  // Add this method to UserRepository if missing
            Users alice = new Users();
            alice.setEmail("alice@example.com");
            alice.setPassword("password1234");  // Use {noop} for plain text in dev; encode with BCrypt later
            alice.setName("Alice Smith");
            alice.setRole(UserRole.CUSTOMER);  // Assuming Role enum
            userRepository.save(alice);
            System.out.println("Sample user 'alice' created.");
        } else {
            System.out.println("Sample user 'alice' already exists—skipping.");
        }
        
        // Repeat for other sample data (e.g., services, bookings) with similar checks
    }
    
}