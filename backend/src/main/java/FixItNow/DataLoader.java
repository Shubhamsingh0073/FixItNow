package FixItNow;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import FixItNow.model.Users;
import FixItNow.model.UserRole;
import FixItNow.manager.UsersManager;
import FixItNow.manager.ServicesManager;
import FixItNow.repository.UsersRepository;
import FixItNow.model.Services;

import org.springframework.beans.factory.annotation.Autowired;

@Component
@Profile("!test")
public class DataLoader implements CommandLineRunner {
    @Autowired
    private UsersRepository userRepository;
    @Autowired
    private UsersManager usersManager;
    @Autowired
    private ServicesManager servicesManager;

    @Override
    public void run(String... args) throws Exception {
        // CUSTOMER
        if (!userRepository.existsByEmail("alice@gmail.com")) {
            Users alice = new Users();
            alice.setId(usersManager.generateNextUserId());
            alice.setEmail("alice@gmail.com");
            alice.setPassword("password1234");
            alice.setName("Alice Smith");
            alice.setRole(UserRole.CUSTOMER);
            userRepository.save(alice);
            System.out.println("Sample user 'alice' created.");
        } else {
            System.out.println("Sample user 'alice' already exists—skipping.");
        }

        // PROVIDER
        if (!userRepository.existsByEmail("ramu@gmail.com")) {
            Users provider = new Users();
            provider.setId(usersManager.generateNextUserId());
            provider.setEmail("ramu@gmail.com");
            provider.setPassword("password123");
            provider.setName("Ramu Electricals");
            provider.setRole(UserRole.PROVIDER);
            Users savedProvider = userRepository.save(provider); 
            System.out.println("Sample user 'provider' created.");

            Services service = servicesManager.createDefaultServiceForProvider(savedProvider);
            System.out.println("Sample service for 'provider' created with id: " + service.getId());
        } else {
            System.out.println("Sample user 'provider' already exists—skipping.");
        }
    }
}