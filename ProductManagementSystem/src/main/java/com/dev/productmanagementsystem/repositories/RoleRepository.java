package com.dev.productmanagementsystem.repositories;

import com.dev.productmanagementsystem.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // Find role by name
    Optional<Role> findByName(String name);

    // Find roles by name containing
    List<Role> findByNameContaining(String name);

    // Find roles by permission id
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.id = ?1")
    List<Role> findByPermissionId(Long permissionId);

    // Find roles with a set of permissions
    @Query("SELECT r FROM Role r JOIN r.permissions p WHERE p.name IN ?1 GROUP BY r HAVING COUNT(p) = ?2")
    List<Role> findByPermissionNames(Set<String> permissionNames, long count);

    // Count users by role
    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.id = ?1")
    Long countUsersByRoleId(Long roleId);

    // Check if role exists by name
    boolean existsByName(String name);
}