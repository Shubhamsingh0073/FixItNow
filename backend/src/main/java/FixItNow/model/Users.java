package FixItNow.model;



import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class Users
{
  @Column(name = "name")
    String name;
  @Column(name = "email")
    @Id
    String email;
  @Enumerated(EnumType.STRING)
  private UserRole role;
  
  @Column(name = "password")
    String password;
  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }
  public String getEmail() {
    return email;
  }
  public void setEmail(String email) {
    this.email = email;
  }
  public FixItNow.model.UserRole getRole() {
    return role;
  }
  public void setRole(FixItNow.model.UserRole role) {
    this.role = role;
  }
  public String getPassword() {
    return password;
  }
  public void setPassword(String password) {
    this.password = password;
  }
  @Override
  public String toString() {
    return "Users [name=" + name + ", email=" + email + ", role=" + role + ", password=" + password + "]";
  }
    
}