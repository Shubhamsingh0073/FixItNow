package FixItNow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import FixItNow.controller.UsersController;
import FixItNow.model.Users;

@Repository
public interface UsersRepository extends JpaRepository<Users, String>
{
	@Query("select count(U) from Users U where U.email=:email")
	public int validateEmail(@Param("email") String email);
	
	@Query("select count(U) from Users U where U.email=:email and U.password=:password")
	public int validatecredentials(@Param("email")String email,@Param("password")String password);

	public boolean existsByEmail(String string);

	public Users findByEmail(String email);


}
