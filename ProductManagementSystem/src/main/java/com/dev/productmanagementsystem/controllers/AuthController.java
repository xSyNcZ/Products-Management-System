package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.dto.UserDTO;
import com.dev.productmanagementsystem.entities.Role;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow all origins for development
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    // Simple in-memory token storage (use Redis or database in production)
    private final Map<String, Long> tokenStore = new HashMap<>();

    @Autowired
    public AuthController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Validate input
            if (loginRequest.getUsername() == null || loginRequest.getUsername().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Username is required"));
            }

            if (loginRequest.getPassword() == null || loginRequest.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Password is required"));
            }

            // Find user by username (case-insensitive)
            Optional<User> userOptional = userService.findByUsername(loginRequest.getUsername().trim());

            if (!userOptional.isPresent()) {
                // Log for debugging (remove in production)
                System.out.println("User not found: " + loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid credentials"));
            }

            User user = userOptional.get();

            // Check if user is active
            if (!user.isActive()) {
                System.out.println("User account is deactivated: " + loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Account is deactivated"));
            }

            // Verify password
            boolean passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
            System.out.println("Password verification for user " + loginRequest.getUsername() + ": " + passwordMatches);

            if (!passwordMatches) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid credentials"));
            }

            // Generate token (simple UUID for demo - use JWT in production)
            String token = UUID.randomUUID().toString();
            tokenStore.put(token, user.getId());

            // Prepare response
            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setUser(convertToDTO(user));

            // Handle roles safely
            List<String> roleNames = new ArrayList<>();
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roleNames = user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toList());
            }
            response.setRoles(roleNames);

            System.out.println("Login successful for user: " + loginRequest.getUsername());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Login error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Login failed: " + e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from "Bearer <token>" format
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid token format"));
            }

            String token = authHeader.substring(7);
            Long userId = tokenStore.get(token);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid or expired token"));
            }

            // Get user details
            Optional<User> userOptional = userService.findById(userId);
            if (!userOptional.isPresent()) {
                tokenStore.remove(token); // Clean up invalid token
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("User not found"));
            }

            User user = userOptional.get();

            // Check if user is still active
            if (!user.isActive()) {
                tokenStore.remove(token); // Clean up token for inactive user
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Account is deactivated"));
            }

            // Prepare response
            ValidateResponse response = new ValidateResponse();
            response.setUser(convertToDTO(user));

            // Handle roles safely
            List<String> roleNames = new ArrayList<>();
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roleNames = user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toList());
            }
            response.setRoles(roleNames);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Token validation error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Token validation failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                tokenStore.remove(token);
            }
            return ResponseEntity.ok(new MessageResponse("Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.ok(new MessageResponse("Logged out"));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordRequest request) {
        try {
            // Validate token and get user
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid token format"));
            }

            String token = authHeader.substring(7);
            Long userId = tokenStore.get(token);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Invalid or expired token"));
            }

            // Validate input
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("Current password is required"));
            }

            if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse("New password is required"));
            }

            // Change password using existing service method
            User updatedUser = userService.changePassword(userId,
                    request.getCurrentPassword(), request.getNewPassword());

            return ResponseEntity.ok(new MessageResponse("Password changed successfully"));

        } catch (Exception e) {
            System.err.println("Password change error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Failed to change password: " + e.getMessage()));
        }
    }

    // Debug endpoint to check if user exists (remove in production)
    @GetMapping("/debug/user/{username}")
    public ResponseEntity<?> debugUser(@PathVariable String username) {
        try {
            Optional<User> userOptional = userService.findByUsername(username);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                Map<String, Object> debugInfo = new HashMap<>();
                debugInfo.put("found", true);
                debugInfo.put("username", user.getUsername());
                debugInfo.put("email", user.getEmail());
                debugInfo.put("active", user.isActive());
                debugInfo.put("hasPassword", user.getPassword() != null && !user.getPassword().isEmpty());
                debugInfo.put("rolesCount", user.getRoles() != null ? user.getRoles().size() : 0);
                return ResponseEntity.ok(debugInfo);
            } else {
                return ResponseEntity.ok(Map.of("found", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Debug failed: " + e.getMessage()));
        }
    }

    // Helper method to convert User to UserDTO
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());

        // Handle multiple roles - get first role for DTO compatibility
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            Role firstRole = user.getRoles().iterator().next();
            dto.setRoleId(firstRole.getId());
            dto.setRoleName(firstRole.getName());
        }

        dto.setActive(user.isActive());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    // Request/Response DTOs
    public static class LoginRequest {
        private String username;
        private String password;

        // Getters and setters
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String token;
        private UserDTO user;
        private List<String> roles;

        // Getters and setters
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public UserDTO getUser() { return user; }
        public void setUser(UserDTO user) { this.user = user; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
    }

    public static class ValidateResponse {
        private UserDTO user;
        private List<String> roles;

        // Getters and setters
        public UserDTO getUser() { return user; }
        public void setUser(UserDTO user) { this.user = user; }
        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }
    }

    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;

        // Getters and setters
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}