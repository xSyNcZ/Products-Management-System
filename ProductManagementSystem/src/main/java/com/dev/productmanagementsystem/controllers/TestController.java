package com.dev.productmanagementsystem.controllers;

import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public TestController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/create-test-user")
    public ResponseEntity<?> createTestUser() {
        try {
            // Create a test user
            User testUser = new User();
            testUser.setUsername("testuser");
            testUser.setEmail("test@example.com");
            testUser.setFirstName("Test");
            testUser.setLastName("User");
            testUser.setActive(true);

            // Set password - this will be encoded by the service
            testUser.setPassword("password123");

            // Create user with USER role
            User createdUser = userService.createUserWithRole(testUser, "USER");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Test user created successfully");
            response.put("username", createdUser.getUsername());
            response.put("email", createdUser.getEmail());
            response.put("active", createdUser.isActive());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to create test user: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/test-password")
    public ResponseEntity<?> testPassword(@RequestBody TestPasswordRequest request) {
        try {
            String rawPassword = request.getRawPassword();
            String encodedPassword = request.getEncodedPassword();

            boolean matches = passwordEncoder.matches(rawPassword, encodedPassword);

            Map<String, Object> response = new HashMap<>();
            response.put("rawPassword", rawPassword);
            response.put("encodedPassword", encodedPassword);
            response.put("matches", matches);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Password test failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/encode-password/{password}")
    public ResponseEntity<?> encodePassword(@PathVariable String password) {
        try {
            String encoded = passwordEncoder.encode(password);

            Map<String, Object> response = new HashMap<>();
            response.put("rawPassword", password);
            response.put("encodedPassword", encoded);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Password encoding failed: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    public static class TestPasswordRequest {
        private String rawPassword;
        private String encodedPassword;

        public String getRawPassword() { return rawPassword; }
        public void setRawPassword(String rawPassword) { this.rawPassword = rawPassword; }
        public String getEncodedPassword() { return encodedPassword; }
        public void setEncodedPassword(String encodedPassword) { this.encodedPassword = encodedPassword; }
    }
}