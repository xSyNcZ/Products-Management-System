package com.dev.productmanagementsystem.services;

import com.dev.productmanagementsystem.entities.Role;
import com.dev.productmanagementsystem.entities.User;
import com.dev.productmanagementsystem.exceptions.DuplicateResourceException;
import com.dev.productmanagementsystem.exceptions.ResourceNotFoundException;
import com.dev.productmanagementsystem.repositories.RoleRepository;
import com.dev.productmanagementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User save(User user) {
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User update(User user) {
        // Check if password has been changed
        Optional<User> existingUser = userRepository.findById(user.getId());
        if (existingUser.isPresent() && !existingUser.get().getPassword().equals(user.getPassword())) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    public User assignRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));

        user.setRole(role);
        return userRepository.save(user);
    }

    public List<User> findUsersByRole(String roleName) {
        return userRepository.findByRole_Name(roleName);
    }

    public List<User> findActiveUsers() {
        return userRepository.findByActiveTrue();
    }

    public List<User> findByName(String name) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name, name);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Transactional
    public User createUserWithRole(User user, String roleName) {
        // Check if username or email already exists
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new DuplicateResourceException("Username already exists: " + user.getUsername());
        }

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email already exists: " + user.getEmail());
        }

        // Find role
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with name: " + roleName));

        // Set role and encrypt password
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setActive(true);

        return userRepository.save(user);
    }

    @Transactional
    public User changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        return userRepository.save(user);
    }

    public boolean hasPermission(Long userId, String permissionName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Role role = user.getRole();
        if (role == null) {
            return false;
        }

        return role.getPermissions().stream()
                .anyMatch(permission -> permission.getName().equals(permissionName));
    }

    public List<User> findUsersWithPermission(String permissionName) {
        return userRepository.findByRole_Permissions_Name(permissionName);
    }

    public User activateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(true);
        return userRepository.save(user);
    }

    public User deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(false);
        return userRepository.save(user);
    }
}
