package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.RoleDTO;
import com.dev.productmanagementsystem.entities.Role;
import com.dev.productmanagementsystem.services.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;

    @Autowired
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        List<Role> roles = roleService.getAllRoles();
        List<RoleDTO> roleDTOs = roles.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roleDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        return ResponseEntity.ok(convertToDTO(role));
    }

    @PostMapping
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleDTO roleDTO) {
        Role createdRole = roleService.createRole(roleDTO.getName(), roleDTO.getPermissionIds());
        return new ResponseEntity<>(convertToDTO(createdRole), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long id, @RequestBody RoleDTO roleDTO) {
        Role updatedRole = roleService.updateRole(id, roleDTO.getName());
        return ResponseEntity.ok(convertToDTO(updatedRole));
    }

    @PutMapping("/{id}/permissions/add")
    public ResponseEntity<RoleDTO> addPermissionsToRole(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds) {
        Role updatedRole = roleService.addPermissionsToRole(id, permissionIds);
        return ResponseEntity.ok(convertToDTO(updatedRole));
    }

    @PutMapping("/{id}/permissions/remove")
    public ResponseEntity<RoleDTO> removePermissionsFromRole(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds) {
        Role updatedRole = roleService.removePermissionsFromRole(id, permissionIds);
        return ResponseEntity.ok(convertToDTO(updatedRole));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    private RoleDTO convertToDTO(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        dto.setPermissionIds(
                role.getPermissions().stream()
                        .map(permission -> permission.getId())
                        .collect(Collectors.toSet())
        );
        return dto;
    }
}