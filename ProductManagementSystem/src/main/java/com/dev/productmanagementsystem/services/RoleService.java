package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Permission;
import com.dev.productmanagementsystem.entities.Role;
import com.dev.productmanagementsystem.repositories.RoleRepository;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionService permissionService;

    @Autowired
    public RoleService(RoleRepository roleRepository, PermissionService permissionService) {
        this.roleRepository = roleRepository;
        this.permissionService = permissionService;
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role getRoleById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + id));
    }

    public Role getRoleByName(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + name));
    }

    @Transactional
    public Role createRole(String name, Set<Long> permissionIds) {
        if (roleRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Role with name '" + name + "' already exists");
        }

        Role role = new Role();
        role.setName(name);

        if (permissionIds != null && !permissionIds.isEmpty()) {
            Set<Permission> permissions = permissionService.getPermissionsByIds(permissionIds);
            role.setPermissions(permissions);
        }

        return roleRepository.save(role);
    }

    @Transactional
    public Role updateRole(Long id, String name) {
        Role role = getRoleById(id);

        // Check if new name already exists (if name is being changed)
        if (name != null && !name.equals(role.getName()) &&
                roleRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Role with name '" + name + "' already exists");
        }

        if (name != null) {
            role.setName(name);
        }

        return roleRepository.save(role);
    }

    @Transactional
    public Role addPermissionsToRole(Long roleId, Set<Long> permissionIds) {
        Role role = getRoleById(roleId);
        Set<Permission> permissions = permissionService.getPermissionsByIds(permissionIds);

        for (Permission permission : permissions) {
            role.addPermission(permission);
        }

        return roleRepository.save(role);
    }

    @Transactional
    public Role removePermissionsFromRole(Long roleId, Set<Long> permissionIds) {
        Role role = getRoleById(roleId);
        Set<Permission> permissions = permissionService.getPermissionsByIds(permissionIds);

        for (Permission permission : permissions) {
            role.removePermission(permission);
        }

        return roleRepository.save(role);
    }

    public void deleteRole(Long id) {
        Role role = getRoleById(id);

        if (role.getUsers() != null && !role.getUsers().isEmpty()) {
            throw new IllegalStateException("Cannot delete role as it is assigned to users");
        }

        roleRepository.deleteById(id);
    }
}