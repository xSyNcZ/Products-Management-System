package com.dev.productmanagementsystem.dto;

import java.util.HashSet;
import java.util.Set;

public class RoleDTO {
    private Long id;
    private String name;
    private Set<Long> permissionIds = new HashSet<>();

    // Constructors
    public RoleDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Set<Long> getPermissionIds() { return permissionIds; }
    public void setPermissionIds(Set<Long> permissionIds) { this.permissionIds = permissionIds; }
}