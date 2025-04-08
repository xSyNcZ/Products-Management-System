package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Find user by username
    Optional<User> findByUsername(String username);

    // Find user by email
    Optional<User> findByEmail(String email);

    // Find users by role id
    List<User> findByRoleId(Long roleId);

    // Find users by active status
    List<User> findByActive(boolean active);

    // Find users by first name and last name
    List<User> findByFirstNameAndLastName(String firstName, String lastName);

    // Find users by first name containing or last name containing
    List<User> findByFirstNameContainingOrLastNameContaining(String firstName, String lastName);

    // Find users created after a certain date
    List<User> findByCreatedAtAfter(LocalDateTime date);

    // Find users by workplace (warehouse)
    @Query("SELECT u FROM User u JOIN u.workplaces w WHERE w.id = ?1")
    List<User> findByWorkplaceId(Long warehouseId);

    // Find warehouse managers
    @Query("SELECT u FROM User u JOIN Warehouse w ON u = w.manager")
    List<User> findWarehouseManagers();

    // Find users with a specific permission
    @Query("SELECT u FROM User u JOIN u.role r JOIN r.permissions p WHERE p.name = ?1")
    List<User> findByPermissionName(String permissionName);

    // Check if username exists
    boolean existsByUsername(String username);

    // Check if email exists
    boolean existsByEmail(String email);
}