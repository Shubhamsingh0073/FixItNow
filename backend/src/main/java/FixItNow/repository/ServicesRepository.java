package FixItNow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import FixItNow.model.Services;
import FixItNow.model.Users;

public interface ServicesRepository extends JpaRepository<Services, String> {
    List<Services> findByProvider(Users provider);
    
    @Query("SELECT MAX(s.id) FROM Services s")
    String findMaxServiceId();
    
}