package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.PermissionDTO;
import com.dev.productmanagementsystem.entities.Permission;
import com.dev.productmanagementsystem.repositories.PermissionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    @Autowired
    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @GetMapping
    public List<PermissionDTO> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermissionDTO> getPermissionById(@PathVariable Long id) {
        return permissionRepository.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission not found"));
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<PermissionDTO> getPermissionByName(@PathVariable String name) {
        return permissionRepository.findByName(name)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission not found"));
    }

    @GetMapping("/search")
    public List<PermissionDTO> getPermissionsByNameContaining(@RequestParam String name) {
        return permissionRepository.findByNameContaining(name).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/role/{roleId}")
    public List<PermissionDTO> getPermissionsByRoleId(@PathVariable Long roleId) {
        return permissionRepository.findByRolesId(roleId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/names")
    public List<PermissionDTO> getPermissionsByNames(@RequestParam Set<String> names) {
        return permissionRepository.findByNameIn(names).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/ids")
    public Set<PermissionDTO> getPermissionsByIds(@RequestParam Set<Long> ids) {
        return permissionRepository.findByIdIn(ids).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toSet());
    }

    @GetMapping("/exists/{name}")
    public ResponseEntity<Boolean> checkPermissionExists(@PathVariable String name) {
        boolean exists = permissionRepository.existsByName(name);
        return ResponseEntity.ok(exists);
    }

    @PostMapping
    public ResponseEntity<PermissionDTO> createPermission(@RequestBody PermissionDTO permissionDTO) {
        // Check if permission with the same name already exists
        if (permissionRepository.existsByName(permissionDTO.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Permission with this name already exists");
        }

        Permission permission = convertToEntity(permissionDTO);
        Permission savedPermission = permissionRepository.save(permission);
        return new ResponseEntity<>(convertToDTO(savedPermission), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermissionDTO> updatePermission(@PathVariable Long id, @RequestBody PermissionDTO permissionDTO) {
        return permissionRepository.findById(id)
                .map(existingPermission -> {
                    // Check if name is being changed and if new name already exists
                    if (permissionDTO.getName() != null &&
                            !permissionDTO.getName().equals(existingPermission.getName()) &&
                            permissionRepository.existsByName(permissionDTO.getName())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Permission with this name already exists");
                    }

                    // Update the existing permission with values from DTO
                    if (permissionDTO.getName() != null) {
                        existingPermission.setName(permissionDTO.getName());
                    }

                    if (permissionDTO.getDescription() != null) {
                        existingPermission.setDescription(permissionDTO.getDescription());
                    }

                    Permission updatedPermission = permissionRepository.save(existingPermission);
                    return ResponseEntity.ok(convertToDTO(updatedPermission));
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission not found"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        return permissionRepository.findById(id)
                .map(permission -> {
                    // Check if permission is associated with any roles
                    if (permission.getRoles() != null && !permission.getRoles().isEmpty()) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Cannot delete permission as it is assigned to one or more roles");
                    }

                    permissionRepository.delete(permission);
                    return new ResponseEntity<Void>(HttpStatus.NO_CONTENT);
                })
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Permission not found"));
    }

    // Helper methods
    private PermissionDTO convertToDTO(Permission permission) {
        PermissionDTO dto = new PermissionDTO();
        dto.setId(permission.getId());
        dto.setName(permission.getName());
        dto.setDescription(permission.getDescription());
        return dto;
    }

    private Permission convertToEntity(PermissionDTO dto) {
        Permission entity = new Permission();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }

        entity.setName(dto.getName());
        entity.setDescription(dto.getDescription());

        return entity;
    }
}