package com.project.certificates.gateway.controller;

import com.project.certificates.gateway.dto.AuthResponse;
import com.project.certificates.gateway.dto.LoginRequest;
import com.project.certificates.gateway.dto.RegisterRequest;
import com.project.certificates.gateway.service.AuthenticationService;
import com.project.certificates.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public Mono<ResponseEntity<Object>> register(@Valid @RequestBody RegisterRequest request) {
        return authenticationService.register(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).<Object>body(response))
                .onErrorResume(IllegalArgumentException.class, e -> 
                    Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                        .<Object>body(new ApiResponse(false, e.getMessage())))
                );
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<Object>> login(@Valid @RequestBody LoginRequest request) {
        return authenticationService.login(request)
                .map(response -> ResponseEntity.ok().<Object>body(response))
                .onErrorResume(IllegalArgumentException.class, e -> 
                    Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .<Object>body(new ApiResponse(false, e.getMessage())))
                );
    }
}
