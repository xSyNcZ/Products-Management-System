package com.dev.productmanagementsystem.services;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authz -> authz
                        .anyRequest().permitAll() // Allow all requests for now
                )
                .csrf(csrf -> csrf.disable()) // Disable CSRF
                .formLogin(form -> form.disable()) // Disable form login
                .httpBasic(basic -> basic.disable()) // Disable basic auth
                .sessionManagement(session -> session.disable()); // Disable sessions

        return http.build();
    }
}