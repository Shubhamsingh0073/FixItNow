package FixItNow.controller;

import FixItNow.model.Services;
import FixItNow.model.Users;
import FixItNow.model.UserRole;
import FixItNow.repository.ServicesRepository;
import FixItNow.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/services")
public class ServicesController {

    @Autowired
    private ServicesRepository servicesRepository;

    @Autowired
    private UsersRepository usersRepository;

    // Get all services
    @GetMapping
    public List<Services> getAllServices() {
        return servicesRepository.findAll();
    }

    // Get services for a specific provider
    @GetMapping("/provider/{providerId}")
    public List<Services> getServicesByProvider(@PathVariable String providerId) {
        Users provider = usersRepository.findById(providerId).orElse(null);
        if (provider == null) {
            return List.of(); // or throw a 404
        }
        return servicesRepository.findByProvider(provider);
    }

    // Get all providers from users table (role="PROVIDER")
    @GetMapping("/providers")
    public List<Users> getAllProviders() {
        return usersRepository.findByRole(UserRole.PROVIDER);
    }
}