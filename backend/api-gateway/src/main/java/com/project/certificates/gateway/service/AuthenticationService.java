package com.project.certificates.gateway.service;

import com.project.certificates.gateway.dto.AuthResponse;
import com.project.certificates.gateway.dto.LoginRequest;
import com.project.certificates.gateway.dto.RegisterRequest;
import com.project.certificates.gateway.entity.Role;
import com.project.certificates.gateway.entity.User;
import com.project.certificates.gateway.repository.UserRepository;
import com.project.certificates.gateway.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Mono<AuthResponse> register(RegisterRequest request) {
        return Mono.fromCallable(() -> {
            if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
                throw new IllegalArgumentException("An account with this email already exists");
            }

            Role role = userRepository.count() == 0 ? Role.ADMIN : Role.USER;

            User user = User.builder()
                    .username(request.getUsername().trim())
                    .email(request.getEmail().trim().toLowerCase())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(role)
                    .build();

            User savedUser = userRepository.save(user);
            log.info("New user registered: {} with role {}", savedUser.getEmail(), savedUser.getRole());

            String token = jwtUtil.generateToken(
                    savedUser.getId(),
                    savedUser.getEmail(),
                    savedUser.getUsername(),
                    savedUser.getRole().name()
            );

            return AuthResponse.builder()
                    .token(token)
                    .username(savedUser.getUsername())
                    .email(savedUser.getEmail())
                    .role(savedUser.getRole().name())
                    .build();
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        return Mono.fromCallable(() -> {
            User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Invalid email or password");
            }

            String token = jwtUtil.generateToken(
                    user.getId(),
                    user.getEmail(),
                    user.getUsername(),
                    user.getRole().name()
            );

            log.info("User logged in: {}", user.getEmail());

            return AuthResponse.builder()
                    .token(token)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .build();
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
