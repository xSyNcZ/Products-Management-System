package com.dev.productmanagementsystem.repository;

import com.dev.productmanagementsystem.entities.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    // Find permission by name
    Optional<Permission> findByName(String name);

    // Find permissions with names containing
    List<Permission> findByNameContaining(String name);

    // Find permissions by role id
    List<Permission> findByRolesId(Long roleId);

    // Find permissions by multiple names
    List<Permission> findByNameIn(Set<String> names);

    // Check if permission exists by name
    boolean existsByName(String name);
}