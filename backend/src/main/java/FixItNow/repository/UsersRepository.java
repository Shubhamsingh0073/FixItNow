package FixItNow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import FixItNow.model.Users;
import FixItNow.model.UserRole;

import java.util.List;

@Repository
public interface UsersRepository extends JpaRepository<Users, String> { // <-- Change primary key type to Long

    @Query("select count(U) from Users U where U.email = :email")
    int validateEmail(@Param("email") String email);

    @Query("select count(U) from Users U where U.email = :email and U.password = :password")
    int validatecredentials(@Param("email") String email, @Param("password") String password);

    boolean existsByEmail(String email);

    Users findByEmail(String email);

    // Find all users with a specific role (for finding all providers)
    List<Users> findByRole(UserRole role);
    
    @Query("SELECT MAX(u.id) FROM Users u")
    String findMaxUserId();
}