package FixItNow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import FixItNow.model.Services;
import FixItNow.model.Users;
import java.util.List;

public interface ServicesRepository extends JpaRepository<Services, String> {
    List<Services> findByProvider(Users provider);
    
    @Query("SELECT MAX(s.id) FROM Services s")
    String findMaxServiceId();
    
}