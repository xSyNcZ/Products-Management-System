package com.dev.productmanagementsystem.dto;

// Summary DTO to avoid circular references
public class UserSummaryDTO {
    private Long id;
    private String username;
    private String email;

    public UserSummaryDTO() {}

    public UserSummaryDTO(Long id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

