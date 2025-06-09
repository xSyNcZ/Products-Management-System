package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Permission;
import com.dev.productmanagementsystem.repositories.PermissionRepository;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Autowired
    public PermissionService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    public Permission getPermissionById(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + id));
    }

    public Permission getPermissionByName(String name) {
        return permissionRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with name: " + name));
    }

    public Permission createPermission(String name, String description) {
        if (permissionRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Permission with name '" + name + "' already exists");
        }

        Permission permission = new Permission();
        permission.setName(name);
        permission.setDescription(description);

        return permissionRepository.save(permission);
    }

    public Permission updatePermission(Long id, String name, String description) {
        Permission permission = getPermissionById(id);

        // Check if new name already exists (if name is being changed)
        if (name != null && !name.equals(permission.getName()) &&
                permissionRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Permission with name '" + name + "' already exists");
        }

        if (name != null) {
            permission.setName(name);
        }

        if (description != null) {
            permission.setDescription(description);
        }

        return permissionRepository.save(permission);
    }

    public void deletePermission(Long id) {
        Permission permission = getPermissionById(id);

        if (permission.getRoles() != null && !permission.getRoles().isEmpty()) {
            throw new IllegalStateException("Cannot delete permission as it is assigned to roles");
        }

        permissionRepository.deleteById(id);
    }

    public Set<Permission> getPermissionsByIds(Set<Long> permissionIds) {
        return permissionRepository.findByIdIn(permissionIds);
    }
}